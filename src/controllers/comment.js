import dotenv from "dotenv";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Bill from "../models/Bill.js";
import {
  commentValidate,
  updateCommentValidate,
} from "../validations/comments.js";
import cloudinary from "../configs/cloudinary.js";
dotenv.config();

const { SECRET_CODE } = process.env;

export const createComment = async (req, res) => {
  try {
    const body = req.body;
    console.log("asdsaas", body);
    const { error } = commentValidate.validate(body, { abortEarly: false });
    console.log(error);
    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }
    // check shoeId is exist?
    const product = await Product.findById(body.shoeId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // get userId from header Token middleware
    const { _id } = req.user;
    const data = await Comment.create({ ...body, userId: _id });
    return res.status(201).json({
      message: "Create Comment successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
export const isRatingComment = async (req, res) => {
  try {
    const { _id } = req.user;
    const { id } = req.params;
    const bill = await Bill.find({
      user: _id,
      isDelivered: "Đã giao hàng",
      cartItems: {
        $elemMatch: {
          product: id,
        },
      },
    });
    if (!Array.isArray(bill) || bill.length === 0) {
      return res
        .status(200)
        .json({ message: "Chưa mua hàng", isRating: false });
    }
    return res.json({ message: "Đã mua hàng", isRating: true });
  } catch (error) {
    console.log(error);
  }
};
export const getAllComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchKeyword = req.query.search || "";
    const shoeId = req.query.shoeId || null;

    const options = {
      page,
      limit: pageSize,
      select: { password: 0 },
    };
    const searchCondition = {
      $or: [{ content: { $regex: searchKeyword, $options: "i" } }],
    };
    if (shoeId) {
      searchCondition.shoeId = shoeId;
    }
    const data = await Comment.paginate(searchCondition, options);

    // Populate the necessary fields after pagination
    await Comment.populate(data.docs, [
      {
        path: "likes",
        select: "userName _id role avt",
      },
      {
        path: "parentId",
        populate: {
          path: "userId",
          select: "userName _id role avt",
        },
      },
      {
        path: "userId",
        select: "userName _id role avt",
      },
    ]);

    // Modify userId for comments where userId is null or not found
    data.docs.forEach((comment) => {
      if (!comment.userId) {
        comment.userId = {
          userName: "None",
          _id: "1",
          role: "admin",
          avt: {
            publicId: "0",
            url: "https://res.cloudinary.com/lamnt/image/upload/v1710477395/book/fdokwbvx5zxrxrqvdrtj.png",
          },
        };
      }
    });

    return res.status(200).json({
      ...data,
      docs: data.docs.map((comment) => ({
        ...comment.toObject(),
        likes: comment.likes.map((like) => ({
          userName: like.userName,
          _id: like._id,
          role: like.role,
          avt: like.avt,
        })),
        parentId: comment.parentId
          ? {
              ...comment.parentId.toObject(),
              userId: {
                userName: comment.parentId.userId.userName,
                _id: comment.parentId.userId._id,
                role: comment.parentId.userId.role,
                avt: comment.parentId.userId.avt,
              },
            }
          : null,
        userId: {
          userName: comment.userId.userName,
          _id: comment.userId._id,
          role: comment.userId.role,
          avt: comment.userId.avt,
        },
      })),
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { _id } = req.user;
    const { error } = updateCommentValidate.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }
    const data = await Comment.findByIdAndUpdate(
      req.body.commentId,
      { ...req.body, userId: _id },
      {
        new: true,
      }
    );
    return res.status(200).json({
      message: "updated comment successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      error: error,
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params._id);

    if (!comment) {
      return res.status(404).json({
        message: "Không tìm thấy cmt ",
      });
    }

    if (
      comment.userId.toString() !== req.user._id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Bạn không thể xoá cmt của người khác",
      });
    }

    // Xóa tất cả các comment có parentId trùng với _id của comment đang xóa
    await Comment.deleteMany({ parentId: comment._id });

    // Xóa comment chính
    await Comment.findByIdAndDelete(req.params._id);

    return res.status(200).json({
      message: "Xoá thành công",
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const likeComment = async (req, res) => {
  const { commentId } = req.body;
  try {
    const liker = await Comment.findById(commentId);
    const isLike = liker.likes.includes(req.user._id);
    if (!isLike) {
      liker.likes.push(req.user._id);
    } else {
      liker.likes.remove(req.user._id);
    }
    await liker.save();
    return res.json(liker);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const replyComment = async (req, res) => {
  try {
    const body = req.body;
    const { error } = commentValidate.validate(body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: error.message,
      });
    }
    // check shoeId is exist?
    const cmt = await Comment.findById(req.params.parent_id);
    if (!cmt) {
      return res.status(404).json({
        message: "cmt not found",
      });
    }

    // get userId from header Token middleware
    const { _id } = req.user;
    const result = await Comment.findById({
      _id: req.params.parent_id,
    });
    if (!result) {
      return res.status(400).json("Khong tim thay");
    }

    const data = await Comment.create({
      ...body,
      userId: await User.findById(_id).select("_id userName role avt").lean(),
      parentId: req.params.parent_id,
    });

    return res.status(201).json({
      message: "Reply comment successfully",
      data,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

export const uploadImage = async (req, res) => {
  const files = req.files;
  // console.log("files", JSON.stringify(files));
  if (!Array.isArray(files)) {
    return res.status(400).json({ error: "No files were uploaded" });
  }
  try {
    const uploadPromises = files.map((file) => {
      // Sử dụng Cloudinary API để upload file lên Cloudinary
      return cloudinary.uploader.upload(file.path);
    });
    // console.log("uploadPromises", uploadPromises);

    // Chờ cho tất cả các file đều được upload lên Cloudinary
    const results = await Promise.all(uploadPromises);
    console.log(results);

    // Trả về kết quả là 1 mảng các đối tượng chứa thông tin của các file đã được upload lên Cloudinary
    const uploadedFiles = results.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
    }));
    return res.json({ urls: uploadedFiles });
  } catch (error) {
    return res.status(500).json({
      error,
    });
  }
};

export const deleteImage = async (req, res) => {
  const publicId = req.params.publicId;
  console.log(publicId);
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return res.status(200).json({
      message: "Delete image successfully",
      result,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || "Error deleting image",
    });
  }
};

export const updateImage = async (req, res) => {
  const files = req.files;
  if (!Array.isArray(files)) {
    return res.status(400).json({
      error: "No files were uploaded",
    });
  }

  const publicId = req.params.publicId; // Lay id cua anh can cap nhat
  const newImage = req?.files[0]?.path; // Lay duong dan cua anh moi

  try {
    // Upload anh moi len Cloudinary va xoa anh cu cung mot luc
    const [uploadResult, deleteResult] = await Promise.all([
      cloudinary.uploader.upload(newImage),
      cloudinary.uploader.destroy(publicId),
    ]);

    // Tra ve ket qua voi url va publicId cua anh moi
    return res.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Error updating image",
    });
  }
};

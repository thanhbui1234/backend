import {
  createValidator,
  signInValidator,
  signUpValidator,
  updateValidator,
} from "../validations/user.js";
import bcryptjs from "bcryptjs";
import User from "../models/User.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import transporter from "../configs/nodemailer.js";
import { createNotificationForAdmin } from "./notification.js";
import io from "socket.io-client";
import cloudinary from "../configs/cloudinary.js";
dotenv.config();

const { SECRET_CODE, PORT_CLIENT } = process.env;
const generateVerificationToken = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};

export const sendEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const verificationToken = generateVerificationToken();
    const verificationExpiry = new Date();
    verificationExpiry.setMinutes(verificationExpiry.getMinutes() + 30);

    const mailOptions = {
      from: "your_email@gmail.com",
      to: email,
      subject: "Xác thực tài khoản",
      html: `<p>Mã xác thực của bạn là: <strong>${verificationToken}</strong></p>
             <p>Mã có hiệu lực trong vòng 30 phút.</p>`,
    };
    await transporter.sendMail(mailOptions);

    await User.findOneAndUpdate(
      { email: email },
      {
        $set: {
          emailVerificationToken: verificationToken,
          emailVerificationExpiry: verificationExpiry,
        },
      },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Mã xác thực đã được gửi đến email của bạn." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi gửi email xác thực." });
  }
};
export const createUser = async (req, res) => {
  try {
    const projection = {
      password: 0,
      _id: 0,
      emailVerified: 0,
      role: 0,
      emailVerificationToken: 0,
      emailVerificationExpiry: 0,
      updatedAt: 0,
      resetToken: 0,
      resetTokenExpiry: 0,
    };

    const { error } = createValidator.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({
        message: errors,
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: req.body.email });
    if (existingEmail) {
      return res.status(400).json({
        message: "Email đã tồn tại.",
      });
    }

    // Check for unique phone numbers
    const existingPhoneNumbers = await User.find({
      phoneNumbers: { $in: req.body.phoneNumbers },
    });
    if (existingPhoneNumbers.length > 0) {
      return res.status(400).json({
        message: "Số điện thoại đã tồn tại.",
      });
    }
    let avatarUrl = { url: req.file.path, publicId: req.file.filename };
    // Tiếp tục xử lý logic tạo user, sử dụng avatarUrl nếu ảnh đã được gửi lên thành công
    // Hash the password
    const hashPassword = await bcryptjs.hash(req.body.password, 10);

    // Create a new User instance
    const newUser = new User({
      userName: req.body.userName,
      email: req.body.email,
      password: hashPassword,
      role: req.body.role,
      deliveryAddress: req.body.deliveryAddress,
      gender: req.body.gender,
      dateOfBirth: req.body.dateOfBirth,
      avt: avatarUrl, // Use the Cloudinary URL for the avatar
      phoneNumbers: req.body.phoneNumbers,
      emailVerified: true,
    });

    // Save the new user to the database
    await newUser.save();

    const savedUser = await User.findOne({ _id: newUser._id }).select(
      projection
    );

    res.status(200).json({
      message: "Tạo User thành công",
      newUser: savedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const signUp = async (req, res) => {
  try {
    const { error } = signUpValidator.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({
        message: errors,
      });
    }

    const email = await User.findOne({ email: req.body.email });
    if (!email) {
      const hashPassword = await bcryptjs.hash(req.body.password, 10);
      const newUser = new User({
        userName: req.body.userName,
        email: req.body.email,
        password: hashPassword,
      });
      const verificationToken = generateVerificationToken();
      const verificationExpiry = new Date();
      verificationExpiry.setMinutes(verificationExpiry.getMinutes() + 30);

      newUser.emailVerificationToken = verificationToken;
      newUser.emailVerificationExpiry = verificationExpiry;

      // Lưu thông tin xác thực vào cơ sở dữ liệu
      await newUser.save();

      const mailOptionsVerify = {
        from: "your-email@example.com",
        to: newUser.email,
        subject: "Xác thực tài khoản",
        text: `Mã xác thực của bạn là: ${verificationToken}`,
      };

      transporter.sendMail(mailOptionsVerify, (error, info) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ error: "Internal Server Error" });
        }
        console.log("Email sent: " + info.response);
        res.status(200).json({
          message: "Đăng ký thành công. Kiểm tra email để xác thực tài khoản.",
        });
      });
    } else {
      return res.status(400).json({
        message: "Email đã tồn tại.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  const { email, emailVerificationToken } = req.body;

  try {
    const user = await User.findOne({ email, emailVerificationToken });
    console.log(email);
    console.log(emailVerificationToken);
    if (!user) {
      return res.status(400).json({ error: "Invalid verification token." });
    }

    // Kiểm tra thời hạn xác thực
    if (user.emailVerificationExpiry < new Date()) {
      return res.status(400).json({ error: "Verification token has expired." });
    }

    // Đánh dấu email đã được xác thực
    user.emailVerified = true;
    await user.save();

    res.json({ message: "Email verified successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const signIn = async (req, res) => {
  try {
    const { error } = signInValidator.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({
        message: errors,
        code: 400
      });
    }
    const user = await User.findOne({ email: req.body.email,isDelete: false });
    if (!user) {
      return res.status(404).json({
        message: "Email này chưa đăng ký, bạn có muốn đăng ký không?",
        code: 404
      });
    }
    const isMatch = await bcryptjs.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Password không đúng, vui lòng kiểm tra lại!",
        code: 403
      });
    }
    const accessToken = jwt.sign({ _id: user._id }, SECRET_CODE, {
      expiresIn: "1d",
    });
    user.password = undefined;
    const socket = io("http://localhost:9000", { transports: ["websocket"] });
    socket.emit("new_user_login", {
      message: `đăng nhập thành công`,
      _id: `${user._id}`,
    });
    return res.status(200).json({
      message: "Đăng nhập thành công!",
      accessToken,
      // user,
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const searchKeyword = req.query.search || "";
    const roleFilter = req.query.role || "";
    const isDeletedFilter = req.query.isDelete;

    const options = {
      page,
      limit: pageSize,
      select: {
        password: 0,
        emailVerificationToken: 0,
        emailVerificationExpiry: 0,
        resetToken: 0,
        resetTokenExpiry: 0,
      },
    };

    const searchCondition = {
      $or: [
        { userName: { $regex: searchKeyword, $options: "i" } },
        { email: { $regex: searchKeyword, $options: "i" } },
      ],
    };

    if (roleFilter) {
      searchCondition.role = roleFilter;
    }

    if (isDeletedFilter) {
      searchCondition.isDelete = isDeletedFilter
    }

    const users = await User.paginate(searchCondition, {
      ...options,
      sort: { isActive: -1 },
    });

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};


export const getOneUser = async (req, res) => {
  try {
    let userId;

    if (req.params.userId) {
      userId = req.params.userId;
    } else {
      const { _id } = req.user;
      userId = _id;
    }

    const projection = {
      password: 0,
      emailVerified: 0,
      emailVerificationToken: 0,
      emailVerificationExpiry: 0,
      updatedAt: 0,
      resetToken: 0,
      resetTokenExpiry: 0,
    };

    const user = await User.findById(userId, projection);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};
export const getOneUserAll = async (req, res) => {
  try {
    let userId;
      userId = req.params.userId;
    const projection = {
      password: 0,
      emailVerified: 0,
      emailVerificationToken: 0,
      emailVerificationExpiry: 0,
      updatedAt: 0,
      resetToken: 0,
      resetTokenExpiry: 0,
      isDelete:0,
      deliveryAddress:0,
      phoneNumbers:0
    };

    const user = await User.findById(userId, projection);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { error } = updateValidator.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({
        message: errors,
      });
    }

    const userId = req.params.userId;
    const updatedUser = req.body;

    // Kiểm tra số điện thoại đã tồn tại cho người dùng khác
    const isPhoneNumberExist = await User.exists({
      _id: { $ne: userId }, // Loại bỏ người dùng đang cập nhật khỏi kiểm tra
      phoneNumbers: updatedUser.phoneNumbers,
    });

    if (isPhoneNumberExist) {
      return res.status(400).json({
        message:
          "Số điện thoại đã tồn tại trong cơ sở dữ liệu cho người dùng khác",
      });
    }

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        message: "Người dùng không tồn tại",
      });
    }
    // Kiểm tra xem người dùng đã cung cấp ảnh mới hay không
    if (req.file) {
      if (existingUser.avt && existingUser.avt.publicId) {
        await cloudinary.uploader.destroy(existingUser.avt.publicId, { folder: 'avatar' });
      }
      existingUser.avt = {
        url: req.file.path,
        
        publicId: req.file.filename,
      };
    }

    // Tiếp tục với quá trình cập nhật thông tin người dùng...
    existingUser.userName = updatedUser.userName || existingUser.userName;
    existingUser.gender = updatedUser.gender || existingUser.gender;
    existingUser.dateOfBirth =
      updatedUser.dateOfBirth || existingUser.dateOfBirth;
    existingUser.deliveryAddress =
      updatedUser.deliveryAddress || existingUser.deliveryAddress;
    existingUser.phoneNumbers =
      updatedUser.phoneNumbers || existingUser.phoneNumbers;

    const savedUser = await existingUser.save();

    // Không thể thay đổi email và tạm thời có cả password
    savedUser.password = undefined;
    savedUser.email = undefined;

    return res.status(200).json({
      message: "Cập nhật thông tin người dùng thành công",
      user: savedUser,
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Người dùng không tồn tại.",
      });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    const origin = req.headers.origin || PORT_CLIENT;
    const resetPasswordLink = `${origin}/reset-password?token=${resetToken}&email=${email}`;

    const mailOptions = {
      from: "your-email@example.com",
      to: email,
      subject: "Reset Password",
      text: `Click on the following link to reset your password: ${resetPasswordLink}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({
          message: "Gửi email thất bại." + error,
        });
      }
      return res.status(200).json({
        message: "Đã gửi email với hướng dẫn reset mật khẩu.",
      });
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    const user = await User.findOne({
      email,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Token không hợp lệ hoặc đã hết hạn.",
      });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    return res.status(200).json({
      message: "Mật khẩu đã được cập nhật.",
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndUpdate(id, { isDelete: true });

    if (!deletedUser) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng.",
      });
    }

    return res.status(200).json({
      message: "Đánh dấu người dùng đã bị xóa.",
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};
export const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndUpdate(id, { isDelete: false });

    if (!deletedUser) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng.",
      });
    }

    return res.status(200).json({
      message: "Đánh dấu người dùng đã được khôi phục.",
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};


export const deleteMoreUsers = async (req, res) => {
  try {
    const userIdsToDelete = req.body.userIds;
    if (!userIdsToDelete || userIdsToDelete.length === 0) {
      return res.status(400).json({
        message: "Vui lòng cung cấp ít nhất một ID người dùng để xoá.",
      });
    }

    // Lấy thông tin email và role của người dùng từ các IDs
    const usersToDelete = await User.find({ _id: { $in: userIdsToDelete } });
    const deletedUserEmails = usersToDelete.map((user) => user.email);

    // Loại bỏ người dùng có role là "admin" khỏi danh sách xoá
    const usersToDeleteFiltered = usersToDelete.filter(
      (user) => user.role !== "admin"
    );

    // Kiểm tra xem có người dùng có role là "admin" trong danh sách xoá không
    const hasAdminInList =
      usersToDelete.length !== usersToDeleteFiltered.length;

    if (hasAdminInList && currentUser.role !== "admin") {
      return res.status(403).json({
        message: "Bạn không có quyền xoá người dùng có role là admin.",
      });
    }

    // Thực hiện xoá người dùng
    const deletedUsers = await User.deleteMany({
      _id: { $in: usersToDeleteFiltered.map((user) => user._id) },
    });

    if (deletedUsers.deletedCount === 0) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng nào để xoá.",
      });
    }

    // // Xoá các comment có userId trùng với userId bị xoá
    // await Comment.deleteMany({ userId: { $in: userIdsToDelete } });

    // // Xoá các notification có userId trùng với userId bị xoá
    // await Notification.deleteMany({ userId: { $in: userIdsToDelete } });
    // Thêm thông báo cho admin
    await createNotificationForAdmin(
      `Người dùng có Email ${deletedUserEmails.join(", ")} đã bị xoá bởi ${
        req.user.email
      }`,
      "user",
      req.user._id,
      "admin"
    );
    return res.status(200).json({
      message: "Xoá người dùng thành công.",
      deletedCount: deletedUsers.deletedCount,
    });
  } catch (error) {
    return res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

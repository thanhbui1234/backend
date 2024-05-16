import User from "../models/User.js";
import voucher from "../models/voucher.js";
import { VoucherValidator } from "../validations/voucher.js";
import crypto from "crypto";
import cron from "node-cron";

const generateCode = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};

// Schedule a task to run every day at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const expiredVouchers = await voucher.find({
      $or: [{ expiration_date: { $lt: new Date() } }],
    });

    await Promise.all(
      expiredVouchers.map(async (vouchers) => {
        vouchers.isDelete = true;
        await vouchers.save();
      })
    );

    console.log("Cập nhật trường isDelete thành công cho các voucher hết hạn ");
  } catch (error) {
    console.error("Lỗi khi cập nhật trường isDelete:", error);
  }
});

export const createVoucher = async (req, res) => {
  try {
    const { error } = VoucherValidator.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({
        message: errors,
      });
    }

    let generatedCode = generateCode();
    const { _id } = req.user;
    const user = await User.findById(_id);
    const newVoucher = new voucher({
      ...req.body,
      Code: generatedCode,
      create_by: {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
    });

    const savedVoucher = await newVoucher.save();

    res.status(200).json({
      message: "Tạo Voucher thành công",
      data: savedVoucher,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const getVouchers = async (req, res) => {
  try {
    const vouchers = await voucher.find();
    res.status(200).json({ data: vouchers });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const getOneVoucher = async (req, res) => {
  try {
    const { code } = req.params;
    const currentDate = new Date();

    const vouchers = await voucher.findOne({ Code: code });

    if (!vouchers) {
      return res.status(404).json({
        message: "Không tìm thấy voucher",
      });
    }
    if (vouchers.isDelete) {
      return res.status(400).json({
        message: "Mã giảm giá đã hết hạn",
      });
    }
    if (vouchers.Quantity <= 0) {
      return res.status(400).json({
        message: "Mã giảm giá đã hết số lượng",
      });
    }
    const startDate = new Date(vouchers.start_date);
    const expirationDate = new Date(vouchers.expiration_date);

    if (currentDate < startDate || currentDate > expirationDate) {
      return res.status(400).json({
        message: "Mã giảm giá không hoạt động",
      });
    }
    res.status(200).json({
      message: "Lấy voucher thành công",
      data: vouchers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const useVoucher = async (req, res) => {
  try {
    const code = req.body.Code;
    const vouchers = await voucher.findOne({ Code: code });
    if (!vouchers) {
      return res.status(404).json({
        message: "Không tìm thấy voucher",
      });
    }
    if (vouchers.isDelete) {
      return res.status(400).json({
        message: "Mã giảm giá đã hết hạn",
      });
    }
    if (vouchers.Quantity <= 0) {
      return res.status(400).json({
        message: "Mã giảm giá đã hết số lượng",
      });
    }
    const currentDate = new Date();
    const startDate = new Date(vouchers.start_date);
    const expirationDate = new Date(vouchers.expiration_date);

    if (currentDate < startDate || currentDate > expirationDate) {
      return res.status(400).json({
        message: "Mã giảm giá không hoạt động",
      });
    }

    vouchers.Quantity -= 1;
    await vouchers.save();

    res.status(200).json({
      message: "Sử dụng voucher thành công",
      data: vouchers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = VoucherValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({
        message: errors,
      });
    }

    // Tìm voucher để kiểm tra xem ai đã tạo
    const vouchers = await voucher.findById(id);
    if (!vouchers) {
      return res.status(404).json({
        message: "Không tìm thấy voucher",
      });
    }

    // Kiểm tra xem người cập nhật có phải là người đã tạo voucher không
    if (vouchers.create_by._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật voucher này",
      });
    }

    // Cập nhật voucher nếu người dùng có quyền
    const updatedVoucher = await voucher.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    res.status(200).json({
      message: "Cập nhật voucher thành công",
      data: updatedVoucher,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedVoucher = await voucher.findByIdAndDelete(id);

    if (!deletedVoucher) {
      return res.status(404).json({
        message: "Không tìm thấy voucher",
      });
    }

    res.status(200).json({
      message: "Xóa voucher thành công",
      deletedVoucher,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

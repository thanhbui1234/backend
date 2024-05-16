import Product from "../models/Product.js";
import Sale from "../models/Sale.js";
import User from "../models/User.js";
import { SaleValidator } from "../validations/sale.js";

export const createSale = async (req, res) => {
  try {
    const { error } = SaleValidator.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({
        message: errors,
      });
    }

    const { _id } = req.user;
    const user = await User.findById(_id);
    const productIds = req.body.product;
    const existingProducts = await Product.find({ _id: { $in: productIds } });

    // Kiểm tra xem số lượng sản phẩm đã tìm thấy có bằng với số lượng sản phẩm gửi lên từ yêu cầu hay không
    if (existingProducts.length !== productIds.length) {
      return res.status(400).json({
        message: "Không tìm thấy tất cả sản phẩm trong cơ sở dữ liệu",
      });
    }

    // Tạo sale mới
    const newSale = new Sale({
      ...req.body,
      create_by: {
        _id: user._id,
        email: user.email,
        role: user.role,
      },
    });

    // Lưu sale mới vào cơ sở dữ liệu
    const savedSale = await newSale.save();

    await Product.updateMany({ _id: { $in: productIds } }, { $set: { sale: savedSale._id } });

    res.status(200).json({
      message: "Tạo Sale thành công",
      data: savedSale,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};


export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find();
    res.status(200).json({ data: sales });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = SaleValidator.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({
        message: errors,
      });
    }

    const sales = await Sale.findById(id);
    if (!sales) {
      return res.status(404).json({
        message: "Không tìm thấy sale",
      });
    }

    if (sales.create_by._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Bạn không có quyền cập nhật sale này",
      });
    }
    const productIds = req.body.product;
    const existingProducts = await Product.find({ _id: { $in: productIds } });

    if (existingProducts.length !== productIds.length) {
      return res.status(400).json({
        message: "Không tìm thấy tất cả sản phẩm trong cơ sở dữ liệu",
      });
    }
    // Cập nhật voucher nếu người dùng có quyền
    const updatedSale = await Sale.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    await Product.updateMany({ _id: { $in: productIds } }, { $set: { sale: updatedSale._id } });

    res.status(200).json({
      message: "Cập nhật Sale thành công",
      data: updatedSale,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedSale = await Sale.findByIdAndDelete(id);

    if (!deletedSale) {
      return res.status(404).json({
        message: "Không tìm thấy Sale",
      });
    }

    res.status(200).json({
      message: "Xóa Sale thành công",
      deletedSale,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

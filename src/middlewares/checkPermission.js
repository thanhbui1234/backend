import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";
dotenv.config();

const { SECRET_CODE } = process.env;
export const checkPermission = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(403).json({
        message: "Bạn chưa đăng nhập!",
      });
    }
    const decoded = jwt.verify(token, SECRET_CODE);
    if (!decoded) {
      throw new Error("Token Error!");
    }
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(404).json({
        message: "User không tồn tại trong hệ thống!",
      });
    }
    if (user.role !== "admin") {
      return res.status(400).json({
        message: "Bạn không có quyền làm việc này!",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(400).json({
      name: error.name,
      message: error.message,
    });
  }
};
export const checkPermissionManager = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(403).json({
        message: "Bạn chưa đăng nhập!",
      });
    }
    const decoded = jwt.verify(token, SECRET_CODE);
    if (!decoded) {
      throw new Error("Token Error!");
    }
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(404).json({
        message: "User không tồn tại trong hệ thống!",
      });
    }
    if (user.role !== "admin" && user.role !== "manager") {
      return res.status(400).json({
        message: "Bạn không có quyền làm việc này!",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(400).json({
      name: error.name,
      message: error.message,
    });
  }
};
export const checkPermissionMember = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(403).json({
        message: "Bạn chưa đăng nhập!",
      });
    }
    const decoded = jwt.verify(token, SECRET_CODE);
    if (!decoded) {
      throw new Error("Token Error!");
    }
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(404).json({
        message: "User không tồn tại trong hệ thống!",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(400).json({
      name: error.name,
      message: error.message,
    });
  }
};
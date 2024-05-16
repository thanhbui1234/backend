import Category from "../models/Category.js";
import { categorySchema } from "../validations/category.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { createNotificationForAdmin } from "./notification.js";
import { v2 as cloudinary } from 'cloudinary';
dotenv.config();

const { SECRET_CODE } = process.env;
export const getAllCategory = async (req, res) => {
    try {
        const options = { page: 1, limit: 10 };
        const { page, limit, keyword } = req.query;

        options.page = page ? parseInt(page) : options.page;
        options.limit = limit ? parseInt(limit) : options.limit;

        let query = {};
        if (keyword) {
            query = { name: { $regex: keyword, $options: "i" } };
        }

        const data = await Category.paginate(query, options);
        if (!data || data.docs.length === 0) {
            throw new Error("Không tìm thấy danh mục");
        }

        // Sắp xếp theo trường createdAt để đưa các danh mục mới nhất lên đầu
        // const sortedData = data.docs.sort((a, b) => b.createdAt - a.createdAt);

        return res.status(200).json({
            message: "Lấy danh sách danh mục thành công",
            totalDocs: data.totalDocs,
            limit: data.limit,
            totalPages: data.totalPages,
            page: data.page,
            pagingCounter: data.pagingCounter,
            hasPrevPage: data.hasPrevPage,
            hasNextPage: data.hasNextPage,
            prevPage: data.prevPage,
            nextPage: data.nextPage,
            data: data.docs,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi server",
            error: error.message,
        });
    }
};

export const getOneCategory = async (req, res) => {
    try {
        const id = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Id không hợp lệ!",
            });
        }
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({
                message: "Không tìm thấy danh mục!",
            });
        }

        return res.status(200).json({
            message: "Success",
            data: category,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi server",
            error: error.message,
        });
    }
};

export const createCategory = async (req, res) => {
    try {
        const body = req.body;
        const { error } = categorySchema.validate(req.body, { abortEarly: false });
        let imageCategoryUrl = { url: req.file.path, publicId: req.file.filename };
        if (error) {
            return res.status(400).json({
                message: error.details[0].message,
            });
        }
        // Kiểm tra xem tên đã tồn tại chưa
        const existingName = await Category.findOne({ name: body.name });
        if (existingName) {
            return res.status(400).json({
                message: "Danh mục đã tồn tại.",
            });
        }

        const newCategory = {
            name: body.name,
            description: body.description,
            imageUrl: imageCategoryUrl,
            status: body.status,
            viewCount: body.viewCount
        }
        const category = new Category(newCategory); 
        const data = await category.save();
        if (!data) {
            throw new Error("Failed to save category.");
        }

        return res.status(200).json({
            message: "Success",
            data: data, 
        });
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};
export const updateCategory = async (req, res) => {
    try {
        const body = req.body;
        const id = req.params.id;
        const { error } = categorySchema.validate(body);
        if (error) {
            return res.status(400).json({
                message: error.details[0].message,
            });
        }
        try {
            const data = await Category.findByIdAndUpdate(id, body, { new: true });
            if (!data) {
                return res.status(404).json({
                    message: "Cập nhật danh mục thất bại!",
                });
            }

            return res.status(200).json({
                message: "Cập nhật danh mục thành công!",
                datas: data,
            });
        } catch (error) {
            return res.status(500).json({
                message: error.message,
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: error.message,
        });
    }
};

export const removeCategory = async (req, res) => {
    try {
        const id = req.params.id;
        try {
            const data = await Category.findByIdAndDelete(id);
            if (!data) {
                return res.status(404).json({
                    message: "Xoá danh mục thất bại!",
                });
            }

            if (Category.imageUrl && Category.imageUrl.publicId) {
                await cloudinary.uploader.destroy(Category.imageUrl.publicId);
            }
            // Thêm thông báo cho admin
            await createNotificationForAdmin(`danh mục ${data.name} đã bị xoá bởi ${req.user.email}`, "category", req.user._id, "admin");
            return res.status(200).json({
                message: "Xoá danh mục thành công!",
                data,
            });
        } catch (error) {
            return res.status(500).json({
                message: "Xoá danh mục thấtbại!",
            });
        }
    } catch (error) {
        return res.status(500).json({
            message: "Xoá danh mục thất bại!",
        });
    }
};
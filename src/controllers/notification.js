import Notification from "../models/Notification.js";
import { validationResult } from "express-validator";
import io from "socket.io-client";
import User from "../models/User.js";
// Lấy tất cả thông báo
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({
      message: "Đã xảy ra lỗi khi lấy thông báo",
      error: error.message,
    });
  }
};
export const getSendMemberNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientType: "member" }).sort({ createdAt: -1 });
    const notificationsWithUser = await Promise.all(
      notifications.map(async (notification) => {
        const user = await User.findById(notification.userId);
        const userName = user ? user.userName : "N/A";
        const email = user ? user.email : "N/A";
        return {
          ...notification.toObject(),
          userId:{_id:notification.userId,userName,email}
        };
      })
    );

    res.status(200).json(notificationsWithUser);
  } catch (error) {
    res.status(500).json({
      message: "Đã xảy ra lỗi khi lấy thông báo",
      error: error.message,
    });
  }
};
export const getOneNotifications = async (req, res) => {
  try {
    const id = req.params.notificationId;
    const notifications = await Notification.findById(id);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({
      message: "Đã xảy ra lỗi khi lấy thông báo",
      error: error.message,
    });
  }
};

// Lấy thông báo theo role
export const getUserNotifications = async (req, res) => {
  try {
    const { role } = req.user;
    const { type } = req.query;
    if (role == "member") {
      const query = { recipientType: role };
      const notifications = await Notification.find(query).sort({
        createdAt: -1,
      });
      return res.status(200).json(notifications);
    } else {
      if (
        type &&
        ![
          "user",
          "admin",
          "manager",
          "order",
          "promotion",
          "product",
          "category",
        ].includes(type)
      ) {
        return res.status(400).json({ message: "Loại thông báo không hợp lệ" });
      }
      const query = { recipientType: role };
      if (type) {
        query.type = type;
      }
      const notifications = await Notification.find(query).sort({
        createdAt: -1,
      });
      res.status(200).json(notifications);
    }
  } catch (error) {
    res.status(500).json({
      message: "Đã xảy ra lỗi khi lấy thông báo",
      error: error.message,
    });
  }
};

export const createNotificationForAdmin = async (message, type, _id, role) => {
  try {
    const newNotification = new Notification({
      userId: _id,
      message,
      type,
      isRead: false,
      recipientType: role,
    });

    await newNotification.save();
    const socket = io("http://localhost:9000", { transports: ["websocket"] });
    socket.emit("newNotification", { message: `${newNotification.message}` });
  } catch (error) {
    return res.status(500).json({
      message: "Đã xảy ra lỗi khi tạo thông báo cho admin",
      error: error.message,
    });
  }
};
// Tạo mới thông báo
export const createNotification = async (req, res) => {
  const { message, type, recipientType } = req.body;

  try {
    // Validate dữ liệu
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const newNotification = new Notification({
      userId: req.user._id,
      message,
      type,
      isRead: false,
      recipientType,
    });

    const savedNotification = await newNotification.save();
    res.status(201).json(savedNotification);
  } catch (error) {
    res.status(500).json({
      message: "Đã xảy ra lỗi khi tạo mới thông báo",
      error: error.message,
    });
  }
};

// Xóa thông báo
export const deleteNotification = async (req, res) => {
  const notificationId = req.params.notificationId;

  try {
    const deletedNotification = await Notification.findByIdAndRemove(
      notificationId
    );
    if (!deletedNotification) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy thông báo để xóa" });
    }

    res
      .status(200)
      .json({ message: "Xóa thông báo thành công", deletedNotification });
  } catch (error) {
    res.status(500).json({
      message: "Đã xảy ra lỗi khi xóa thông báo",
      error: error.message,
    });
  }
};
export const updateNotification = async (req, res) => {
  const notificationId = req.params.notificationId;

  try {
    // Tìm thông báo theo ID
    const notification = await Notification.findById(notificationId);

    // Kiểm tra xem thông báo có tồn tại không
    if (!notification) {
      return res.status(404).json({ message: "Không tìm thấy thông báo" });
    }
    if (notification.isRead) {
      return res
        .status(400)
        .json({ message: "Thông báo đã được đọc trước đó" });
    }
    // Cập nhật trạng thái isRead thành true
    notification.isRead = true;

    // Lưu thông báo đã được cập nhật
    await notification.save();

    res
      .status(200)
      .json({
        message: "Cập nhật thông báo thành công",
        updatedNotification: notification,
      });
  } catch (error) {
    res.status(500).json({
      message: "Đã xảy ra lỗi khi cập nhật thông báo",
      error: error.message,
    });
  }
};

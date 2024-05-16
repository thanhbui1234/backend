import { Router } from "express";
import { createNotification, deleteNotification, getAllNotifications, getOneNotifications, getSendMemberNotifications, getUserNotifications, updateNotification } from "../controllers/notification.js";
import { checkPermission, checkPermissionMember } from "../middlewares/checkPermission.js";

const routerNotification = Router();

// Lấy tất cả thông báo
routerNotification.get("/all",checkPermission, getAllNotifications);
routerNotification.get("/all/sendMember",checkPermission, getSendMemberNotifications);
routerNotification.get("/one/:notificationId", getOneNotifications);
routerNotification.get("/role",checkPermissionMember, getUserNotifications);

// Tạo mới thông báo
// Giành cho admin khi muốn gửi thông báo cho user hoặc manager
routerNotification.post("/create",checkPermission,createNotification);

// Cập nhật thông báo
routerNotification.put("/update/:notificationId", updateNotification);

// Xóa thông báo
routerNotification.delete("/delete/:notificationId", deleteNotification);

export default routerNotification;

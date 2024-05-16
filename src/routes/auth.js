import { Router } from "express";
import {
  createUser,
  deleteMoreUsers,
  deleteUser,
  forgotPassword,
  getAllUsers,
  getOneUser,
  getOneUserAll,
  resetPassword,
  restoreUser,
  sendEmail,
  signIn,
  signUp,
  updateUser,
  verifyEmail,
} from "../controllers/auth.js";
import {
  checkPermission,
  checkPermissionManager,
  checkPermissionMember,
} from "../middlewares/checkPermission.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../configs/cloudinary.js";
import multer from "multer";

const routerAuth = Router();
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "avatar",
    format: async (req, file) => "png",
  },
});
const upload = multer({ storage: storage });
routerAuth.post("/create", upload.single("avt"),checkPermissionManager, createUser);
routerAuth.post("/signup", signUp);
routerAuth.post("/signin", signIn);

// người quản lý mới có thể xem tất cả user và cập nhật
routerAuth.get("/users",checkPermissionManager, getAllUsers);

routerAuth.put("/users/:userId",checkPermissionMember, upload.single("avt"), updateUser);

//xóa băng cách cập nhật isDelete=true
routerAuth.delete("/user/:id",checkPermission, deleteUser);
routerAuth.delete("/user/restore/:id",checkPermission, restoreUser);

//chỉ admin mới có quyền xoá hàng loạt
routerAuth.delete("/more-users",checkPermission, deleteMoreUsers);

// routerAuth.delete("/users/:userId", deleteUser);
routerAuth.get("/user/:userId?", checkPermissionMember, getOneUser);
routerAuth.get("/user/guest/:userId", checkPermissionMember, getOneUserAll);
routerAuth.post("/forgot-password", forgotPassword);
routerAuth.post("/reset-password", resetPassword);

routerAuth.post("/send-email", sendEmail);
routerAuth.post("/verify-email", verifyEmail);
export default routerAuth;

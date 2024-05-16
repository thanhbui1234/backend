import { Router } from "express";
import { registerChatUser, loginChatUser,getAllChatUsers, deleteChatUser ,getUserChatByEmail } from "../controllers/chat";
import User from '../models/User';
import { checkPermissionMember } from "../middlewares/checkPermission";
const routerChat = Router();
routerChat.post("/signup", checkPermissionMember, async (req, res) => {
    const { username, secret, email, first_name, last_name } = req.body;
    const { _id } = req.user;
    if (!req.body.username || req.body.username === "") {
        if (req.user.email) {
            req.body.username = req.user.email;
        }
    }
    if (req.user.email) {
        req.body.email = req.user.email;
    }
   
    // Kiểm tra xem userName có tồn tại trong req.user không và gán nó vào req.body.first_name nếu có
    if (req.user.userName) {
        req.body.first_name = req.user.userName;
    }

    // Kiểm tra xem role có tồn tại trong req.user không và gán nó vào req.body.last_name nếu có
    if (req.user.role) {
        req.body.last_name = `(${req.user.role})`;
    }

    try {
        const result = await registerChatUser(username, secret, email, first_name, last_name, _id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Route để đăng nhập tài khoản chat
routerChat.post("/login",checkPermissionMember, async (req, res) => {
    const { username, secret } = req.body;
    try {
        const result = await loginChatUser(username, secret);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Route để lấy tất cả người dùng chat
routerChat.get("/all", checkPermissionMember, async (req, res) => {
    try {
        const users = await getAllChatUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route để xóa người dùng chat
routerChat.delete("/delete/:userId", checkPermissionMember, async (req, res) => {
    const { userId } = req.params;
    try {
        await deleteChatUser(userId);
        res.status(200).json({ message: "Xóa người dùng thành công" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Thêm route để tìm userChat dựa trên email
routerChat.get("/userByEmail/:email", checkPermissionMember, async (req, res) => {
    const { email } = req.params;
    try {
        const userChat = await getUserChatByEmail(email);
        res.status(200).json(userChat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


export default routerChat;

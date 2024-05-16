import express from "express";
import http from "http"; // Import the 'http' module
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import router from "./routes/index.js";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import { createNotificationForAdmin } from "./controllers/notification.js";
import User from "./models/User.js";
import Product from "./models/Product.js";
import order from "./controllers/vnpay.js";
import path from "path";
import logger from "morgan";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
dotenv.config();
const { PORT, DB_URI, SECRET_CODE } = process.env;

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);
app.use(cors({ origin: true }));
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(
  session({
    secret: SECRET_CODE, // Thay thế bằng một chuỗi bí mật mạnh hơn trong môi trường thực tế
    resave: true,
    saveUninitialized: true,
  })
);

const __dirname = process.cwd();
app.set("views", path.join(__dirname, "src/views"));
app.set("view engine", ".jade");

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/order", order);

mongoose.connect(DB_URI).then(() => {
  console.log("Connected!");
});

app.use("/api", router);
let socket;
// Socket.io implementation
io.on("connection", (s) => {
  socket = s;
  socket.on("new_user_login", async (data) => {
    io.emit("new_user_login", { message: data.message, _id: data._id });
    await User.findByIdAndUpdate(data._id, { isActive: true });
    io.emit("update_user_status", { _id: data._id, isActive: true });
    socket.userId = data._id;
  });
  socket.on("newNotification", (data) => {
    io.emit("newNotification", { message: data.message });
    console.log("thong bao ne");
  });
  socket.on("realtimeBill", (data) => {
    io.emit("realtimeBill", { data: data });
  });
  socket.on("realtimeBillforAdmin", (data) => {
    io.emit("realtimeBillforAdmin", { data: data });
  });
  socket.on("client_add_product", async (data) => {
    io.emit("server_add_product", { data: data });
  });
  socket.on("client_update_product", async (data) => {
    io.emit('server_update_product', { data: data });
  });
  socket.on("client_delete_product", async (data) => {
    io.emit('server_delete_product', { data: data});
});


  socket.on("log_out", async (data) => {
    await User.findByIdAndUpdate(data.userId, { isActive: false });
    io.emit("update_user_status", { _id: data._id, isActive: false });
    console.log("hi2", data)

  });
  socket.on("check_active", async (data) => {
    socket.userId = data._id;
    await User.findByIdAndUpdate(data._id, { isActive: true });
    io.emit("update_user_status", { _id: data._id, isActive: true });
    console.log("log ok", data._id);
  });
  socket.on("disconnect", async () => {
    await User.findByIdAndUpdate(socket.userId, { isActive: false });
    io.emit("update_user_status", { _id: socket.userId, isActive: false });
    console.log("hi1", socket.userId);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

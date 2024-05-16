import dotenv from "dotenv";
import { Cart, CartItem } from "../models/Cart.js";
import { validateCart, validateCartItems } from "../validations/cart.js";
import nodemailer from "nodemailer";
import Product from "../models/Product.js";
import Bill from "../models/Bill.js";
import User from "../models/User.js";
import { createNotificationForAdmin } from "./notification.js";
import io from "socket.io-client";
import voucher from "../models/voucher.js";
dotenv.config();
const { GMAIL_ADMIN, PASS_ADMIN } = process.env;

// Tạo một giỏ hàng mới
const addCartItems = async (req, res) => {
  try {
    const quantity = 1;
    const size = req.body.size;
    const product = req.body.product;
    const productPrice = req.body.price;
    const userId = req.user?._id;
    const a = req.body;
    const { error } = validateCartItems(a);
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    let cart;

    if (userId) {
      // Người dùng đã đăng nhập
      cart = await Cart.findOne({ user: userId });

      if (!cart) {
        cart = new Cart({
          user: userId,
          cartItems: [],
          totalPrice: 0, // Thêm trường totalPrice vào cart
        });
      }
    } else {
      // Người dùng không đăng nhập, lưu vào session storage
      cart = req.session.cart;

      if (!cart) {
        cart = {
          cartItems: [],
          totalPrice: 0, // Thêm trường totalPrice vào cart
        };
      }
    }

    const productModel = await Product.findById(product);

    if (!productModel) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }

    const productImage = productModel.images;
    const productColor = productModel.color;

    const existingCartItem = cart.cartItems.find(
      (item) => item.product.toString() === product && item.size === size
    );
    console.log(existingCartItem);
    if (existingCartItem) {
      // Tăng số lượng nếu sản phẩm đã tồn tại trong giỏ hàng
      existingCartItem.quantity += quantity;
      existingCartItem.price = productPrice * existingCartItem.quantity;
    } else {
      // Thêm sản phẩm mới vào giỏ hàng
      const newCartItem = {
        product: product,
        quantity: quantity,
        price: productPrice * quantity,
        images: productImage,
        size: size,
        color: productColor,
      };
      cart.cartItems.push(newCartItem);
    }

    // Cập nhật tổng tiền trong giỏ hàng
    cart.totalPrice = 0;
    cart.cartItems.forEach((item) => {
      cart.totalPrice += item.price;
    });

    if (!userId) {
      // Lưu giỏ hàng vào session storage khi người dùng không đăng nhập
      req.session.cart = cart;
    } else {
      await cart.save();
    }

    res
      .status(200)
      .json({ message: "Sản phẩm đã được thêm vào giỏ hàng", cart });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Đã xảy ra lỗi khi thêm sản phẩm vào giỏ hàng" });
    console.log(error);
  }
};

const createOrder = async (req, res) => {
  try {
    const {
      shippingAddress,
      cartItems,
      payment_method,
      totalPrice,
      voucherr,
      voucherName,
    } = req.body;
    const userId = req.user?._id;
    const userEmail = shippingAddress.email;
    const userName = shippingAddress.fullname;
    let cart;
    console.log(voucherName);
    if (userId) {
      // Người dùng đã đăng nhập
      cart = await Cart.findOne({ user: userId }).populate("cartItems.product");
      if (!cart) {
        // Kiểm tra giỏ hàng có sản phẩm không
        cart = { cartItems };
      }
    } else {
      // Người dùng không đăng nhập
      // Người dùng không đăng nhập
      const cookieHeader = req.sessionID;
      if (!cookieHeader) {
        return res.status(400).json({ error: "Header 'Cookie' không tồn tại" });
      }

      cart = req.body;
    }

    const generateTrackingNumber = () => {
      // Triển khai logic để tạo mã vận đơn
      // Ví dụ: tạo mã ngẫu nhiên từ các ký tự và số
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let trackingNumber = "";
      for (let i = 0; i < 10; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        trackingNumber += characters[randomIndex];
      }
      return trackingNumber;
    };

    const order = new Bill({
      user: userId,
      cartItems: [
        ...cart.cartItems.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          images: item.images,
          size: item.size,
          color: item.color,
        })),
      ],
      payment_method: payment_method,
      isDelivered: "Chờ xác nhận",
      isPaid: false,
      shippingAddress,
      totalPrice: totalPrice,
      voucher: voucherName,
      trackingNumber: generateTrackingNumber(),
    });

    for (const item of order.cartItems) {
      // Tìm sản phẩm trong cơ sở dữ liệu và cập nhật số lượng
      await Product.updateOne(
        { _id: item.product, "sizes.name": item.size },
        { $inc: { "sizes.$.quantity": -item.quantity } }
      );
      await Product.updateMany(
        { _id: { $in: item.product } },
        { $inc: { quantity: -item.quantity } }
      );
    }

    const voucherToUpdate = await voucher.findOne({ Code: voucherr });
    if (voucherToUpdate) {
      voucherToUpdate.Quantity -= 1;
      await voucherToUpdate.save();
    }

    if (userEmail) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: GMAIL_ADMIN,
          pass: PASS_ADMIN,
        },
      });

      const mailOptions = {
        from: GMAIL_ADMIN,
        to: userEmail,
        subject: "Bạn đã đặt hàng thành công",
        text: `"Đơn hàng của bạn đã được đặt thành công !Mã vận đơn: ${order.trackingNumber}"`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log("Gửi email thất bại:", error);
        } else {
          console.log("Gửi email thành công:", info.response);
        }
      });
    }

    await order.save();
    // Thêm thông báo cho admin
    if (userId) {
      await createNotificationForAdmin(
        `Bạn có đơn hàng ${order.trackingNumber}, được đặt bởi khách hàng ${userName}`,
        "order",
        req.user._id,
        "admin"
      );
    } else {
      await createNotificationForAdmin(
        `Bạn có đơn hàng ${order.trackingNumber}, được đặt bởi Khách`,
        "order",
        "660684abfe2c726b51e28e4c",
        "admin"
      );
    }

    // Xóa giỏ hàng sau khi tạo đơn hàng thành công
    if (userId) {
      await Cart.findByIdAndDelete(cart._id);
    } else {
      req.session.cart = {
        cartItems: [],
        order: order,
      };
    }

    res.status(200).json({
      message: "Đơn hàng đã được tạo thành công",
      data: order,
    });
  } catch (error) {
    res.status(500).json({ error: "Đã xảy ra lỗi khi tạo đơn hàng" });
    console.log(error);
  }
};
const deleteCart = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    console.log(id);
    if (userId) {
      await Cart.findByIdAndDelete(id);
    } else {
      req.session.cart = {
        cartItems: [],
        order: order,
      };
    }
    return res.status(200).json({
      message: "Cart deleted successfully",
    });
  } catch (error) {
    console.error(error);
  }
};
// Lấy tất cả giỏ hàng của một người dùng
const getCartItems = async (req, res) => {
  try {
    const userId = req.user?._id;

    let cart;

    if (userId) {
      // Người dùng đã đăng nhập
      cart = await Cart.findOne({ user: userId });

      if (!cart) {
        return res.status(404).json({ error: "Giỏ hàng không tồn tại" });
      }
    } else {
      // Người dùng không đăng nhập, lấy từ session storage
      cart = req.session.cart;
      if (!cart) {
        return res.status(404).json({ error: "Giỏ hàng không tồn tại" });
      }
    }

    res.status(200).json({ cart: cart });
  } catch (error) {
    res.status(500).json({ error: "Đã xảy ra lỗi khi lấy thông tin giỏ hàng" });
    console.log(error);
  }
};
const removeCartItem = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user?._id;
    let cart;

    if (userId) {
      // Người dùng đã đăng nhập
      cart = await Cart.findOne({ user: userId });

      if (!cart) {
        return res.status(404).json({ error: "Giỏ hàng không tồn tại" });
      }
    } else {
      // Người dùng không đăng nhập, lấy từ session storage
      cart = req.body;
      console.log(cart);
      if (!cart) {
        return res.status(404).json({ error: "Giỏ hàng không tồn tại" });
      }
    }

    // Tìm vị trí của sản phẩm trong giỏ hàng
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId
    );

    if (productIndex === -1) {
      // Không tìm thấy sản phẩm trong giỏ hàng
      return res
        .status(404)
        .json({ error: "Không tìm thấy sản phẩm trong giỏ hàng" });
    }

    // Xóa sản phẩm khỏi giỏ hàng
    cart.cartItems.splice(productIndex, 1);
    if (cart.cartItems.length === 0) {
      // Nếu không còn sản phẩm nào trong giỏ hàng, xóa cả giỏ hàng
      if (userId) {
        // Xóa giỏ hàng từ cơ sở dữ liệu
        await Cart.findByIdAndDelete(cart._id);
      } else {
        // Xóa giỏ hàng từ session storage
        req.session.cart = null;
      }
      return res
        .status(200)
        .json({ message: "Sản phẩm đã được xóa khỏi giỏ hàng" });
    }
    if (userId) {
      // Lưu giỏ hàng vào cơ sở dữ liệu nếu người dùng đã đăng nhập
      let totalPrice = 0;
      for (const item of cart.cartItems) {
        const product = await Product.findById(item.product);
        totalPrice += item.quantity * product.price;
      }

      // Cập nhật totalPrice trong giỏ hàng
      cart.totalPrice = totalPrice;
      await cart.save();
    } else {
      // Lưu giỏ hàng vào session storage nếu người dùng không đăng nhập
      req.session.cart = cart;
    }

    res.status(200).json({ message: "Sản phẩm đã được xóa khỏi giỏ hàng" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Đã xảy ra lỗi khi xóa sản phẩm khỏi giỏ hàng" });
    console.log(error);
  }
};
const updateCart = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user?._id;
    const { index, size, quantity } = req.body;
    let cart;
    if (userId) {
      cart = await Cart.findOne({ user: userId });
      cart.cartItems[index].size = size;
      console.log("size", (cart.cartItems[index].size = size));
      if (quantity !== undefined) {
        cart.cartItems[index].quantity = quantity;
      }
    }

    if (!cart) {
      return res.status(404).json({ error: "Giỏ hàng không tồn tại" });
    }

    const productIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === productId
    );

    if (productIndex === -1) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy sản phẩm trong giỏ hàng" });
    }

    const updatedCartItems = [];
    for (const item of cart.cartItems) {
      const existingItemIndex = updatedCartItems.findIndex(
        (updatedItem) =>
          updatedItem.product.toString() === item.product.toString() &&
          updatedItem.size === item.size
      );
      if (existingItemIndex !== -1) {
        // Nếu đã có mục trùng, cộng thêm quantity
        updatedCartItems[existingItemIndex].quantity += item.quantity;
      } else {
        // Nếu không, thêm mục mới vào mảng updatedCartItems
        updatedCartItems.push(item);
      }
    }
    // Gán lại mảng cartItems với các mục đã được hợp nhất
    cart.cartItems = updatedCartItems;
    let totalPrice = 0;
    for (const item of cart.cartItems) {
      console.log(item);
      const product = await Product.findById(item.product);
      console.log("price", product.price);
      console.log("quantity", item.quantity);
      totalPrice += item.quantity * product.price;
    }

    cart.totalPrice = totalPrice;

    await cart.save();

    return res.json({
      message: "Cập nhật sản phẩm trong giỏ hàng thành công",
      cart,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
};
const updateIsDeliveredOrder = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    req.params;
    const { isDelivered } = req.body;

    console.log(isDelivered);
    const updatedCart = await Bill.findByIdAndUpdate(
      { _id: id },
      { isDelivered: isDelivered },
      { new: true }
    );

    if (!updatedCart) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (updatedCart.isDelivered == "Đã hủy") {
      createNotificationForAdmin(
        `Đơn hàng ${updatedCart.trackingNumber}, đã hủy bởi người dùng`,
        "order",
        req.user._id,
        "admin"
      );
    }
    const socket = io("http://localhost:9000", { transports: ["websocket"] });
    socket.emit("realtimeBillforAdmin", {
      data: "thanh cong",
    });
    res.json({ message: "Update order complete", updatedCart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const findUserOrders = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { page = 1, limit = 10, start, end, search } = req.query;
    console.log(page);
    let query = {};
    console.log(search);
    if (!userId) {
      return res.status(400).json({ error: "Người dùng chưa đăng nhập" });
    }

    if (start && end) {
      const startDate = new Date(`${start}T00:00:00.000Z`);
      const endDate = new Date(`${end}T23:59:59.999Z`);

      query.createdAt = { $gte: startDate, $lte: endDate };
    }
    if (search) {
      query.$or = [{ trackingNumber: { $regex: search, $options: "i" } }];
    }
    const totalOrders = await Bill.countDocuments({ user: userId, ...query });

    const ordersUser = await Bill.find({ user: userId, ...query })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(totalOrders);

    res.json({
      ordersUser,
      pagination: {
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: parseInt(page),
        limit: parseInt(totalOrders),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Đã xảy ra lỗi khi tìm kiếm đơn hàng đã tạo" });
    console.log(error);
  }
};
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { search } = req.query;
    let query = {};

    // Chỉ tạo query nếu biến search không rỗng
    if (search && search.trim() !== "") {
      // Kiểm tra xem search có rỗng hay không
      query.$or = [{ trackingNumber: { $regex: search, $options: "i" } }];
    }

    let data = {};
    // Kiểm tra nếu có truy vấn, thực hiện tìm kiếm và gán kết quả vào biến data
    if (Object.keys(query).length !== 0) {
      const order = await Bill.find({ ...query });
      data = order;
    }

    // Nếu không có kết quả tìm kiếm và biến search rỗng, trả về lỗi 404
    if (!data.length && (!search || search.trim() === "")) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
const getOrderByIdAdmin = async (req, res) => {
  try {
    const { search } = req.query;
    console.log(search);
    let query = {};

    // Chỉ tạo query nếu biến search không rỗng
    if (search && search.trim() !== "") {
      // Kiểm tra xem search có rỗng hay không
      query.$or = [{ trackingNumber: { $regex: search, $options: "i" } }];
    }

    let data = {};
    // Kiểm tra nếu có truy vấn, thực hiện tìm kiếm và gán kết quả vào biến data
    if (Object.keys(query).length !== 0) {
      const order = await Bill.find({ ...query });
      data = order;
    }

    // Nếu không có kết quả tìm kiếm và biến search rỗng, trả về lỗi 404
    if (!data.length && (!search || search.trim() === "")) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
const getAllOrderAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, start, end, search, key } = req.query;
    let query = {};
    if (start && end) {
      const startDate = new Date(`${start}T00:00:00.000Z`);
      const endDate = new Date(`${end}T23:59:59.999Z`);

      query.createdAt = { $gte: startDate, $lte: endDate };
    }
    if (search) {
      query.$or = [
        { payment_method: { $regex: search, $options: "i" } },
        { isDelivered: { $regex: search, $options: "i" } },
        { "shippingAddress.fullname": { $regex: search, $options: "i" } },
        { "shippingAddress.email": { $regex: search, $options: "i" } },
        { "shippingAddress.address": { $regex: search, $options: "i" } },
        { "shippingAddress.phone": { $regex: search, $options: "i" } },
        { trackingNumber: { $regex: search, $options: "i" } },
      ];
    }
    const totalOrders = await Bill.countDocuments(query);
    const orders = await Bill.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(search || key !== "0" ? totalOrders : 10);

    res.json({
      orders,
      pagination: {
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: parseInt(page),
        limit: search || key !== "0" ? totalOrders : 10,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
// Lấy một giỏ hàng theo ID của user

// Lấy một giỏ hàng theo ID của user dành cho admin

const getCartByIdAdmin = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const order = await Bill.findById({ _id: orderId });
    if (!order) {
      return res.status(404).json({ error: "order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
// Cập nhật một đơn hàng theo ID
const updateOrder = async (req, res) => {
  try {
    // const { _id: userId } = req.user;
    const { id } = req.params;
    const updatedCartData = req.body;
    const order = await Bill.findOne({ _id: id });
    let isPaid = order.isPaid;
    if (updatedCartData.isDelivered === "Đã giao hàng") {
      isPaid = true;
    }
    const updatedCart = await Bill.findByIdAndUpdate(
      { _id: id },
      { ...updatedCartData, isPaid: isPaid }, // Thêm isPaid vào dữ liệu cập nhật
      { new: true }
    );

    if (!updatedCart) {
      return res.status(404).json({ error: "Order not found" });
    }
    const socket = io("http://localhost:9000", { transports: ["websocket"] });
    socket.emit("realtimeBill", {
      data: "thanh cong",
    });
    res.json({ message: "Update order complete", updatedCart });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const updateIsPaidOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCartData = req.body;
    const userId = req.user?._id;
    const userInfo = await User.findOne({ _id: userId });

    const updatedCart = await Bill.findOneAndUpdate(
      { trackingNumber: id },
      updatedCartData, // Thêm isPaid vào dữ liệu cập nhật
      { new: true }
    );
    console.log("updatedCart", updatedCart);
    if (!updatedCart) {
      return res.status(404).json({ error: "Order not found" });
    }
    const socket = io("http://localhost:9000", { transports: ["websocket"] });
    socket.emit("realtimeBill", {
      data: "thanh cong",
    });
    if (userId) {
      await createNotificationForAdmin(
        `Đơn hàng ${id}, đã được khách hàng ${userInfo.userName} thanh toán`,
        "order",
        req.user._id,
        "admin"
      );
    } else {
      await createNotificationForAdmin(
        `Đơn hàng ${id}, đã được khách thanh toán`,
        "order",
        "660684abfe2c726b51e28e4c",
        "admin"
      );
    }
    res.json({
      message: `Đơn hàng ${updatedCart.trackingNumber} đã được thanh toán`,
      updatedCart,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const updateManyOrder = async (req, res) => {
  const { ids, isDelivered } = req.body;
  const idList = await Bill.find({ _id: { $in: ids } });
  try {
    const result = await Bill.updateMany(
      { _id: { $in: idList } },
      {
        $set: {
          isDelivered,
          isPaid: isDelivered === "Đã giao hàng" ? true : idList.isPaid,
        },
      }
    );

    // Kiểm tra kết quả cập nhật
    if (result.nModified === 0) {
      // Nếu không có đơn hàng nào được cập nhật, trả về lỗi 404 Not Found
      return res.status(404).json({ error: "Không tìm thấy đơn hàng" });
    }
    const data = { ids, isDelivered };

    const billWithIdUser = [];

    for (const orders of idList) {
      if (orders.user) {
        billWithIdUser.push(orders.user);
      }
    }
    const socket = io("http://localhost:9000", { transports: ["websocket"] });
    socket.emit("realtimeBill", {
      data: "thanh cong",
    });

    res.json({
      message: `Cập nhật ${result.modifiedCount} đơn hàng thành công`,
      updates: data,
    });
  } catch (error) {
    // Xử lý lỗi nếu có
    console.error("Lỗi khi cập nhật đơn hàng:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi khi cập nhật đơn hàng" });
  }
};
// Xóa một giỏ hàng theo ID
const deleteOrder = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    console.log(orderId);
    const order = await Bill.findById(orderId);
    console.log(order);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const deleteOrder = await Bill.findByIdAndDelete(orderId);

    res.json({ message: "Order deleted", deleteOrder });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export {
  addCartItems,
  getCartItems,
  removeCartItem,
  createOrder,
  getOrderById,
  updateOrder,
  updateManyOrder,
  deleteOrder,
  getAllOrderAdmin,
  getCartByIdAdmin,
  findUserOrders,
  updateCart,
  updateIsDeliveredOrder,
  getOrderByIdAdmin,
  deleteCart,
  updateIsPaidOrder,
};

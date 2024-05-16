import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: false,
  },
  images: {
    type: Array,
    required: false,
  },
  size: {
    type: String,
  },
  color: {
    type: String,
  },
});

const cartSchema = mongoose.Schema(
  {
    cartItems: [cartItemSchema],

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    totalPrice: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const CartItem = mongoose.model("CartItem", cartItemSchema);
const Cart = mongoose.model("Cart", cartSchema);

export { CartItem, Cart };

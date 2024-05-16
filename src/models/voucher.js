import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const voucherSchema = new mongoose.Schema(
  {
    Name: {
      type: String,
      required: true,
    },
    Code: {
      type: String,
      required: true,
    },
    Quantity: {
      type: Number,
      required: true,
    },
    reduced_amount: {
      type: Number,
      default: true,
    },
    price_order: {
      type: Number,
      default: true,
    },
    description: {
      type: String,
      required: true,
    },
    create_by: {
      type: Object,
      required: false,
    },
    start_date: {
      type: Date,
      required: true,
    },
    expiration_date: {
      type: Date,
      required: true,
    },
    isDelete: {
      type: Boolean,
      required: false,
      default:"false"
    },
  },
  { timestamps: true }
);

voucherSchema.plugin(mongoosePaginate);

export default mongoose.model("Voucher", voucherSchema);

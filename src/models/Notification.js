import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["user", "admin", "manager", "order", "promotion","product","category"],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    recipientType: {
      type: String,
      enum: ["member", "manager", "admin"],
      required: true,
    },
  },
  { timestamps: true }
);

notificationSchema.plugin(mongoosePaginate);

export default mongoose.model("Notification", notificationSchema);

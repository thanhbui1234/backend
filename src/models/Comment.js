import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const commentSchema = new mongoose.Schema(
  {
    shoeId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "products",
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
    rating: {
      type: Number,
    },
    content: {
      type: String,
      required: true,
    },
    images: {
      // type: String,
      // required: true,
      url: String,
      publicId: String,
    },
    likes: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    parentId: {
      type: mongoose.Schema.ObjectId,
      ref: "Comment",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
commentSchema.plugin(mongoosePaginate);
export default mongoose.model("Comment", commentSchema);

import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const listSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
        type: String,
        required: true,
      },
  },
  { timestamps: true }
);

listSchema.plugin(mongoosePaginate);

export default mongoose.model("ListModel", listSchema);

import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
           
        },
        description: {
            type: String,
        },
        imageUrl: {
            type: Object,
            default: {
              "publicId":"0",
              "url":"https://res.cloudinary.com/dxspp5ba5/image/upload/v1708917933/Old_Nike_logo_ofhr9m.jpg"
            }
          },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
        viewCount: {
            type: Number,
            default: 0,
        },
        products: {
            type: Array,
            default: [],
            required: false
        }
    },
    { versionKey: false, timestamps: true }
);

categorySchema.plugin(mongoosePaginate);

export default mongoose.model("Category", categorySchema);
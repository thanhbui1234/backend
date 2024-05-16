import mongoose from "mongoose"
import mongoosePaginate from "mongoose-paginate-v2";
const userSchema = new mongoose.Schema({
    userName: {
      type: String,
      required: true,
    },
    email: {
        type: String, 
        required: true
    },
    emailVerified: {
        type: Boolean,
        default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpiry: Date,
    resetToken: String,
    resetTokenExpiry: Date,
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "member",
    },
    avt: {
      type: Object,
      default: {
        "publicId":"0",
        "url":"https://res.cloudinary.com/lamnt/image/upload/v1710477395/book/fdokwbvx5zxrxrqvdrtj.png"
      }
    },
    deliveryAddress: {
      type: String,
    },
    gender: {
      type: String,
    },
    dateOfBirth: {
      type: String,
    },
    phoneNumbers: {
        type: String
    },
    lastActivity: {
        type: Date,
        default: null,
    },
    isDelete: {
      type: Boolean,
      default: false,
  },
    isActive: {
      type: Boolean,
      default: false,
    },
}, { versionKey: false, timestamps: true})

//Tạm thời check bằng lần cuối người dùng làm 1 tác vụ
userSchema.pre('save', function (next) {
    this.lastActivity = new Date();
    next();
});
userSchema.plugin(mongoosePaginate);
export default mongoose.model('User', userSchema)
import { Router } from "express";
import { createCategory, getAllCategory, removeCategory, updateCategory, getOneCategory } from "../controllers/category.js";
import { checkPermission } from "../middlewares/checkPermission.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dxspp5ba5',
  api_key: '134991839275134',
  api_secret: "SMtt3hatMMwDY2pEuxnZSQt48qI"
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "category",
    format: (req, file) => "png",
    upload_preset: "category" 
  },
});
const upload = multer({ storage: storage });
const routerCategory = Router();

routerCategory.get("/", getAllCategory);
routerCategory.get("/:id", getOneCategory);
routerCategory.post("/", upload.single("imageUrl"), createCategory);
routerCategory.put("/:id",upload.single("imageUrl"), updateCategory);
routerCategory.delete("/:id", checkPermission, removeCategory);

export default routerCategory;

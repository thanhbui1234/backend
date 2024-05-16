import express from "express";
import { checkPermission } from "../middlewares/checkPermission.js";
import {
  addProduct,
  getAllProduct,
  getDetailProduct,
  updateProduct,
  deleteProduct,
  RestoreProduct,
  tryDeleteProduct,
  fetchMaterial,
  fetchColor,
  fetchSize,
  fetchTechSpec,
  updateField,
  updateSoldCount,
} from "../controllers/product.js";

const routerProduct = express.Router();

routerProduct.post("/", addProduct);
routerProduct.get("/", getAllProduct);
routerProduct.get("/material", fetchMaterial);
routerProduct.get("/color", fetchColor);
routerProduct.get("/size", fetchSize);
routerProduct.get("/tech_spec", fetchTechSpec);
routerProduct.put("/:id", updateProduct);
routerProduct.patch("/:id/field", updateField);
routerProduct.patch("/:id/sold_count", updateSoldCount); 
routerProduct.patch("/:id/delete", tryDeleteProduct);
routerProduct.patch("/:id/restore", RestoreProduct);
routerProduct.delete("/:id", checkPermission, deleteProduct);
routerProduct.get("/:id", getDetailProduct);

export default routerProduct;

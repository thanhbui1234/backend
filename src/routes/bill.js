import { Router } from "express";
import {
  createBill,
  deleteBill,
  getAllBill,
  getBillById,
  updateBill,
} from "../controllers/bill.js";

const routerBill = Router();

routerBill.post("/", createBill);
routerBill.get("/:id", getBillById);
routerBill.get("/", getAllBill);
routerBill.delete("/:id", deleteBill);
routerBill.patch("/:id", updateBill);

export default routerBill;

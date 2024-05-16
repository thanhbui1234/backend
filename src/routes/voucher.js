import { Router } from "express";
import {
  createVoucher,
  deleteVoucher,
  getOneVoucher,
  getVouchers,
  updateVoucher,
  useVoucher,
} from "../controllers/voucher";
import { checkPermission } from "../middlewares/checkPermission";

const routerVoucher = Router();

routerVoucher.get("/", checkPermission, getVouchers);
routerVoucher.get("/one/:code", getOneVoucher);
routerVoucher.get("/use", useVoucher);
routerVoucher.post("/", checkPermission, createVoucher);
routerVoucher.put("/:id", checkPermission, updateVoucher);
routerVoucher.delete("/:id", checkPermission, deleteVoucher);
export default routerVoucher;

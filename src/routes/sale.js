import { Router } from "express"
import { checkPermission, checkPermissionMember } from "../middlewares/checkPermission";
import { createSale, deleteSale, getSales, updateSale } from "../controllers/sale";

const routerSale = Router()

routerSale.get("/",checkPermission, getSales);
routerSale.post("/",checkPermission, createSale);
routerSale.put("/:id",checkPermission, updateSale);
routerSale.delete("/:id",checkPermission, deleteSale);
export default routerSale
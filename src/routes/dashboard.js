import { Router } from "express"
import { checkPermission } from "../middlewares/checkPermission";
import { getDataChart, getList, postList } from "../controllers/dashboard";

const routerDashboard = Router()

routerDashboard.get("/list",checkPermission, getList);
routerDashboard.get("/data/:id",checkPermission, getDataChart);
routerDashboard.post("/list",checkPermission, postList);
// routerDashboard.put("/list/:id",checkPermission, updateList);
// routerDashboard.delete("/list/:id",checkPermission, deleteList);
export default routerDashboard
import { Router } from "express";
import { checkPermission } from "../middlewares/checkPermission";
import { analyticController } from "../controllers/analytic";

const routerAnalytic = Router();

/* order */
routerAnalytic.get("/countOrder", analyticController.countOrder);
routerAnalytic.get("/countOrderWeek", analyticController.countOrderWeek);

/* đếm số order theo sản phẩm */
routerAnalytic.get(
  "/countOrderDayByProduct",
  analyticController.countOrderDayByProduct
);
/* đếm số lượng người dùng */
routerAnalytic.get("/countUser", analyticController.countUser);

routerAnalytic.get("/analytics", analyticController.analytics);
routerAnalytic.get("/analyst", analyticController.analysticTotal);
routerAnalytic.post("/analyst-fillter", analyticController.analysticFillter);
routerAnalytic.get("/analytics-month", analyticController.analyticMonth);

export default routerAnalytic;

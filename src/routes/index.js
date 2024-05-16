import express from "express";
import routerAuth from "./auth";
import routerCategory from "./category";
import routerProduct from "./product";
import routerBill from "./bill";
import routerCart from "./cart";
import routerComment from "./comment";
import routerNotification from "./notification";
import routerFavourite from "./fav";
import routerVoucher from "./voucher";
import routerSale from "./sale";
import routerAnalytic from "./analytic";
import routerDashboard from "./dashboard";
import routerChat from "./chat";

const router = express.Router();
router.use("/auth", routerAuth);
router.use("/bill", routerBill);

router.use("/product", routerProduct);
router.use("/chat",routerChat);
router.use("/categories", routerCategory);
router.use("/comments", routerComment);
router.use("/order", routerCart);
router.use("/notification", routerNotification);
router.use("/fav", routerFavourite);
router.use("/voucher", routerVoucher);
router.use("/sale", routerSale);
router.use("/analytics", routerAnalytic)
router.use("/dashboard", routerDashboard)

export default router;

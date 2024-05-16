import { Router } from "express";
import { addFavItems, getFavItems, removeFavItem } from "../controllers/Fav";
import { authenticateToken } from "../middlewares/checkOrders";
const routerFav = Router();

routerFav.post("/favourite", authenticateToken, addFavItems); // Thêm một mục hàng vào yêu thích
routerFav.get("/favourite", authenticateToken, getFavItems); // Lấy danh sách các mục hàng trong yêu thích
routerFav.delete("/favourite/:id", authenticateToken, removeFavItem); // Xóa một mục hàng khỏi yêu thích
export default routerFav;

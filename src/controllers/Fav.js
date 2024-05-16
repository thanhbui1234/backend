import { Fav } from "../models/Favourite";
import Product from "../models/Product";

export const addFavItems = async (req, res) => {
  try {
    const product = req.body.product;
    const userId = req.user?._id;
    console.log(product);
    let fav;
    console.log(Fav);
    if (userId) {
      // Người dùng đã đăng nhập
      fav = await Fav.findOne({ user: userId });
      console.log(fav);
      if (fav === null) {
        fav = new Fav({
          user: userId,
          favItems: [],
        });
        await Fav.findByIdAndDelete("661e71a9b5ab5a7ff109eda5");

        console.log(fav);
      }
    } else {
      // Người dùng không đăng nhập, lưu vào session storage
      fav = req.session.fav;

      if (!fav) {
        fav = {
          favItems: [],
        };
      }
    }

    const productModel = await Product.findById(product);
    console.log(productModel);
    if (!productModel) {
      return res.status(404).json({ error: "Không tìm thấy sản phẩm" });
    }

    const productPrice = productModel.price;
    const productImage = productModel.images;
    const productColor = productModel.color;

    // Thêm sản phẩm mới vào yêu thích
    const newFavItem = {
      product: product,
      price: productPrice,
      images: productImage,
      color: productColor,
    };
    fav.favItems.push(newFavItem);

    if (!userId) {
      // Lưu yêu thích vào session storage khi người dùng không đăng nhập
      req.session.fav = fav;
    } else {
      await fav.save();
    }

    res
      .status(200)
      .json({ message: "Sản phẩm đã được thêm vào yêu thích", fav });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Đã xảy ra lỗi khi thêm sản phẩm vào yêu thích" });
    console.log(error);
  }
};
export const getFavItems = async (req, res) => {
  try {
    const userId = req.user?._id;

    let fav;

    if (userId) {
      // Người dùng đã đăng nhập
      fav = await Fav.findOne({ user: userId });

      if (!fav) {
        return res.status(404).json({ error: "yêu thích không tồn tại" });
      }
    } else {
      // Người dùng không đăng nhập, lấy từ session storage
      fav = req.session.fav;

      if (!fav) {
        return res.status(404).json({ error: "yêu thích không tồn tại" });
      }
    }

    res.status(200).json({ fav: fav });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Đã xảy ra lỗi khi lấy thông tin yêu thích" });
    console.log(error);
  }
};
export const removeFavItem = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user?._id;
    let fav;

    if (userId) {
      // Người dùng đã đăng nhập
      fav = await Fav.findOne({ user: userId });

      if (!fav) {
        return res.status(404).json({ error: "yêu thích không tồn tại" });
      }
    } else {
      // Người dùng không đăng nhập, lấy từ session storage
      fav = req.session.fav;

      if (!fav) {
        return res.status(404).json({ error: "yêu thích không tồn tại" });
      }
    }

    // Tìm vị trí của sản phẩm trong yêu thích
    const productIndex = fav.favItems.findIndex(
      (item) => item.product.toString() === productId
    );

    if (productIndex === -1) {
      // Không tìm thấy sản phẩm trong yêu thích
      return res
        .status(404)
        .json({ error: "Không tìm thấy sản phẩm trong yêu thíc" });
    }

    // Xóa sản phẩm khỏi yêu thích
    fav.favItems.splice(productIndex, 1);

    if (userId) {
      // Lưu yêu thích vào cơ sở dữ liệu nếu người dùng đã đăng nhập
      await fav.save();
    } else {
      // Lưu yêu thích vào session storage nếu người dùng không đăng nhập
      req.session.fav = fav;
    }

    res.status(200).json({ message: "Sản phẩm đã được xóa khỏi yêu thích" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Đã xảy ra lỗi khi xóa sản phẩm khỏi yêu thích" });
    console.log(error);
  }
};

import Bill from "../models/Bill.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Voucher from "../models/voucher.js";

export const analyticController = {
  /* số lượng order 1 ngày */
  countOrder: async (req, res) => {
    try {
      const countOrders =
        await Bill.countDocuments(); /* lấy hết order đang có */

      // const countOrderActive = await Bill.countDocuments({ isActive: true });
      // const countOrderInActive = await Bill.countDocuments({ isActive: false });
      // const countOrderExpiration = await Bill.countDocuments({
      //   isActive: true,
      //   endDate: { $gte: new Date() }, // Chỉ lấy các order chưa hết hạn
      // });
      // const countOrderNotExpiration = await Bill.countDocuments({
      //   isActive: true,
      //   endDate: { $lt: new Date() }, // Chỉ lấy các order đã hết hạn
      // });

      /* order có trạng thái là pending */
      const countOrderPending = await Bill.countDocuments({
        isDelivered: "Chờ xác nhận",
      });
      /* order có trạng thái là confirmed */
      const countOrderConfirmed = await Bill.countDocuments({
        isDelivered: "Chờ lấy hàng",
      });
      /* order có trạng thái là delivered */
      const countOrderDelivered = await Bill.countDocuments({
        isDelivered: "Đang giao hàng",
      });
      /* order có trạng thái là done */
      const countOrderDone = await Bill.countDocuments({
        isDelivered: "Đã giao hàng",
      });
      /* order có trạng thái là canceled */
      const countOrderCanceled = await Bill.countDocuments({
        isDelivered: "Đã hủy",
      });
      /* order có trạng thái là pending và đã hết hạn */
      const countOrderPendingExpiration = await Bill.countDocuments({
        isDelivered: "Chờ xác nhận",
        endDate: { $gte: new Date() }, // Chỉ lấy các order chưa hết hạn
      });
      return res.status(200).json({
        countOrders,
        // countOrderActive,
        // countOrderInActive,
        // countOrderExpiration,
        // countOrderNotExpiration,
        countOrderPending,
        countOrderConfirmed,
        countOrderDelivered,
        countOrderDone,
        countOrderCanceled,
        // countOrderPendingExpiration,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  /* số lượng order 1 tuần */
  countOrderWeek: async (req, res) => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const counts = await Bill.aggregate([
        { $match: { createdAt: { $gte: oneWeekAgo } } },
        { $group: { _id: "$isDelivered", count: { $sum: 1 } } },
      ]);
      const countOrderWeek = {
        total: 0,
        // pending: 0,
        // confirmed: 0,
        // delivered: 0,
        // done: 0,
        // canceled: 0,
      };
      counts.forEach((item) => {
        countOrderWeek.total += item.count;
        if (item._id) {
          countOrderWeek[item._id] = item.count;
        }
      });
      return res.status(200).json(countOrderWeek);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  /* số lượng order 1 ngày theo từng sản phẩm */

  countOrderDayByProduct: async (req, res) => {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const counts = await Bill.aggregate([
        { $match: { createdAt: { $gte: oneDayAgo } } },
        { $unwind: "$cartItems" },
        {
          $group: {
            _id: "$cartItems.product",
            count: { $sum: "$cartItems.quantity" },
          },
        },
      ]);
      const countOrderDayByProduct = {};
      counts.forEach((item) => {
        countOrderDayByProduct[item._id] = item.count;
      });
      return res.status(200).json(countOrderDayByProduct);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  /* số lượng order 1 tuần theo từng sản phẩm */
  // countOrderWeekByCategory: async (req, res) => {}
  /* số lượng order 1 tháng theo từng trạng thái */

  /* thống kế về doanh thu */
  analyticPrice: async (req, res) => {
    try {
      const analyticPrices = await Bill.find({
        isDelivered: "Đã giao hàng",
      }).select("totalPrice");

      const analyticPrice = analyticPrices.reduce(
        (a, b) => a + b.totalPrice,
        0
      );
      return res.status(200).json({ analyticPrice });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  /* thống kê về số lượng sản phẩm đã bán */
  /* thống kê về số lượng sản phẩm đã bán theo tháng */
  /* thống kê về số lượng sản phẩm đã bán theo năm */
  /* thống kê về số lượng sản phẩm đã bán theo ngày */
  /* thống kê về số lượng sản phẩm đã bán theo tuần */
  /* thống kê về số lượng sản phẩm đã bán theo quý */
  /* số lượng người dùng */
  countUser: async (req, res) => {
    try {
      const countUsers = await User.countDocuments(); /* lấy hết user đang có */
      // const countUserActive = await User.countDocuments({ isActive: true });
      // const countUserInActive = await User.countDocuments({ isActive: false });
      return res.status(200).json({
        countUsers,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
  /* số lượng người dùng đang hoạt động */
  // countUserIsActive: async (req, res) => {
  //   try {
  //     const countUserIsActive = await User.countDocuments({ is: true });
  //     return res.status(200).json({ countUserIsActive });
  //   } catch (error) {
  //     return res.status(500).json({ message: error.message });
  //   }
  // },
  /* số lượng người dùng đã bị khóa */
  /* số lượng người dùng đã bị ẩn */
  /* số lượng người dùng đã bị xóa */
  /* số lượng người dùng đã đăng ký */
  /* thống kê sản phẩm đang hoạt động */
  /* thống kê sản phẩm đã bị xóa */
  /* thống kê sản phẩm đã bị ẩn */

  /* tổng số tiền thu được trong ngày này */
  totalMoneys: async (_, res) => {
    try {
      /* get total day */
      const totalMoneyDays = await Bill.find({
        isDelivered: "Đã giao hàng",
        createdAt: {
          $gte: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            new Date().getDate()
          ),
        },
      }).select("totalPrice");

      /* số tiền thu được trong tuần */
      const totalMoneyWeeks = await Bill.find({
        isDelivered: "Đã giao hàng",
        createdAt: {
          $gte: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            new Date().getDate() - 7
          ),
        },
      }).select("totalPrice");

      /* get total month */
      const totalMoneyMonths = await Bill.find({
        isDelivered: "Đã giao hàng",
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }).select("totalPrice");
      const totalMoneyDay = totalMoneyDays.reduce((a, b) => a + b.total, 0);
      const totalMoneyWeek = totalMoneyWeeks.reduce((a, b) => a + b.total, 0);
      const totalMoneyMonth = totalMoneyMonths.reduce((a, b) => a + b.total, 0);

      /* số lượng order 1 tuần */

      return res
        .status(200)
        .json({ totalMoneyDay, totalMoneyWeek, totalMoneyMonth });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  /* tổng số tiền thu theo từng ngày */
  totalMoneyDay: async (req, res) => {
    try {
      const thongKe = await Bill.aggregate([
        { $match: { isDelivered: "Đã giao hàng" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: "$totalPrice" },
          },
        },
      ])
        .sort({ _id: -1 })
        .limit(7);
      const totalMoneyDay = {};
      thongKe.forEach((item) => {
        totalMoneyDay[item._id] = item.total;
      });
      return res.status(200).json(totalMoneyDay);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  // date -> y/m/d
  // filter order folow day
  // fn dùng chung call truyền params
  fillterOrderByCalendar: async (status, date) => {
    const currentDate = new Date();
    let year1 = currentDate.getFullYear();
    const month = ("0" + (currentDate.getMonth() + 1)).slice(-2);
    const day = ("0" + currentDate.getDate()).slice(-2);

    const isDate = `${year1}-${month}-${day}`;
    const fillterDate = date ? new Date(date) : new Date(isDate);
    const thongKe = await Bill.aggregate([
      { $match: { isDelivered: status, createdAt: { $lte: fillterDate } } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$totalPrice" },
          count: { $sum: 1 },
        },
      },
    ])
      .sort({ _id: -1 })
      .limit(7);
    return thongKe;
  },

  // fn dùng chung call truyền params
  /* tổng số tiền doanh thu theo tuần 52 tuần */
  getWeeklyRevenueByStatus: async (isDelivered) => {
    try {
      const currentYear = new Date().getFullYear();
      let weeklyRevenue = [];

      // Lặp qua 52 tuần trong năm
      for (let week = 1; week <= 52; week++) {
        // Xác định ngày đầu tiên và cuối cùng của tuần
        const startOfWeek = new Date(currentYear, 0, (week - 1) * 7);
        const endOfWeek = new Date(currentYear, 0, week * 7);

        const ordersInWeek = await Bill.find({
          isDelivered,
          createdAt: { $gte: startOfWeek, $lte: endOfWeek },
        });

        const totalRevenueInWeek = ordersInWeek.reduce(
          (total, order) => total + order.totalPrice,
          0
        );

        weeklyRevenue.push({
          week: week,
          totalRevenue: totalRevenueInWeek,
        });
      }

      return weeklyRevenue;
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  getWeeklyRevenueByStatusAndCurrentMonth: async (isDelivered) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // Lấy tháng hiện tại (bắt đầu từ 0)

    // Xác định ngày đầu tiên và cuối cùng của tháng hiện tại
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Lấy số tuần trong tháng
    const totalWeeks = Math.ceil(
      (lastDayOfMonth.getDate() - firstDayOfMonth.getDate() + 1) / 7
    );

    let weeklyRevenue = [];

    // Lặp qua các tuần trong tháng
    for (let week = 1; week < totalWeeks; week++) {
      // Xác định ngày đầu tiên và cuối cùng của tuần
      const startOfWeek = new Date(
        currentYear,
        currentMonth,
        (week - 1) * 7 + 1
      );
      const endOfWeek = new Date(currentYear, currentMonth, week * 7);

      // Đảm bảo rằng endOfWeek không vượt quá ngày cuối cùng của tháng
      if (endOfWeek > lastDayOfMonth) {
        endOfWeek.setDate(lastDayOfMonth.getDate());
      }

      const ordersInWeek = await Bill.find({
        isDelivered,
        createdAt: { $gte: startOfWeek, $lte: endOfWeek },
      });

      const totalRevenueInWeek = ordersInWeek.reduce(
        (total, order) => total + order.totalPrice,
        0
      );

      weeklyRevenue.push({
        week: week,
        totalRevenue: totalRevenueInWeek,
      });
    }

    return weeklyRevenue;
  },

  /* tổng số tiền thu theo từng tháng */
  countOrderByStatusAndMonth: async (isDelivered) => {
    const currentYear = new Date().getFullYear();
    let monthlyRevenue = [];

    for (let month = 1; month <= 12; month++) {
      const startOfMonth = new Date(currentYear, month - 1, 1);
      const endOfMonth = new Date(currentYear, month, 0, 23, 59, 59, 999);

      const ordersInMonth = await Bill.find({
        isDelivered,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      });

      const totalRevenueInMonth = ordersInMonth.reduce(
        (total, order) => total + order.totalPrice,
        0
      );

      monthlyRevenue.push({
        month: month,
        totalRevenue: totalRevenueInMonth,
      });
    }

    return monthlyRevenue;
  },

  analytics: async (_, res) => {
    try {
      /* đếm số lượng khách hàng */
      const countUsers = await User.countDocuments(); /* lấy hết user đang có */
      const countUserActive = await User.countDocuments({ isActive: true });
      const countUserInActive = await User.countDocuments({
        isActive: false,
      });

      /* đếm số lượng sản phẩm */
      const countProducts =
        await Product.countDocuments(); /* lấy hết product đang có */
      const countProductActive = await Product.countDocuments({
        delete: false,
      });
      const countProductInActive = await Product.countDocuments({
        delete: true,
      });
      const countProductDeleted = await Product.countDocuments({
        delete: true,
      });
      const countProductNotDeleted = await Product.countDocuments({
        delete: true,
      });

      /* đếm số lượng voucher hiện có */
      const countVouchers =
        await Voucher.countDocuments(); /* lấy hết voucher đang có */
      const countVoucherActive = await Voucher.countDocuments({
        isDelete: false,
      });
      const countVoucherInActive = await Voucher.countDocuments({
        isDelete: true,
      });
      const countVoucherExpiration = await Voucher.countDocuments({
        isDelete: false,
        expiration_date: { $gte: new Date() }, // Chỉ lấy các voucher chưa hết hạn
      });

      const countVoucherNotExpiration = await Voucher.countDocuments({
        isDelete: false,
        expiration_date: { $lt: new Date() }, // Chỉ lấy các voucher đã hết hạn
      });

      /* category */
      const countCategorys =
        await Category.countDocuments(); /* lấy hết category đang có */
      const countCategoryActive = await Category.countDocuments({
        status: "active",
      });
      const countCategoryInActive = await Category.countDocuments({
        status: "inactive",
      });

      /* get total day */
      const totalMoneyDays = await Bill.find({
        isDelivered: "Đã giao hàng",
        createdAt: {
          $gte: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            new Date().getDate()
          ),
        },
      }).select("totalPrice");
      /* số tiền thu được trong tuần */

      const totalMoneyWeeks = await Bill.find({
        isDelivered: "Đã giao hàng",
        createdAt: {
          $gte: new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            new Date().getDate() - 7
          ),
        },
      }).select("totalPrice");

      /* get total month */
      const totalMoneyMonths = await Bill.find({
        isDelivered: "Đã giao hàng",
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }).select("totalPrice");
      const totalMoneyDay = totalMoneyDays.reduce(
        (a, b) => a + b.totalPrice,
        0
      );
      const totalMoneyWeek = totalMoneyWeeks.reduce(
        (a, b) => a + b.totalPrice,
        0
      );
      const totalMoneyMonth = totalMoneyMonths.reduce(
        (a, b) => a + b.totalPrice,
        0
      );

      /* số lượng order 1 ngayf */
      const countOrders =
        await Bill.countDocuments(); /* lấy hết order đang có */
      // const countOrderActive = await Bill.countDocuments({ isActive: true });
      // const countOrderInActive = await Bill.countDocuments({
      //   isActive: false,
      // });
      // const countOrderExpiration = await Bill.countDocuments({
      //   isActive: true,
      //   endDate: { $gte: new Date() }, // Chỉ lấy các order chưa hết hạn
      // });
      // const countOrderNotExpiration = await Bill.countDocuments({
      //   isActive: true,
      //   endDate: { $lt: new Date() }, // Chỉ lấy các order đã hết hạn
      // });
      /* order có trạng thái là Chờ xác nhận */
      const countOrderPending = await Bill.countDocuments({
        isDelivered: "Chờ xác nhận",
      });
      /* số tiến có trạng thái là Chờ xác nhận */
      const countOrderPendingMoneys = await Bill.find({
        isDelivered: "Chờ xác nhận",
      }).select("totalPrice");
      /* order có trạng thái là confirmed */
      const countOrderConfirmed = await Bill.countDocuments({
        isDelivered: "Chờ lấy hàng",
      });
      /* số tiến có trạng thái là confirmed */
      const countOrderConfirmedMoneys = await Bill.find({
        isDelivered: "Chờ lấy hàng",
      }).select("totalPrice");
      /* order có trạng thái là delivered */
      const countOrderDelivered = await Bill.countDocuments({
        isDelivered: "Đang giao hàng",
      });
      /* số tiến có trạng thái là delivered */
      const countOrderDeliveredMoneys = await Bill.find({
        isDelivered: "Đang giao hàng",
      });
      /* số tiến có trạng thái là done */
      const countOrderDoneMoneys = await Bill.find({
        isDelivered: "Đã giao hàng",
      }).select("totalPrice");
      /* order có trạng thái là done */
      const countOrderDone = await Bill.countDocuments({
        isDelivered: "Đã giao hàng",
      });
      /* order có trạng thái là canceled */
      const countOrderCanceled = await Bill.countDocuments({
        isDelivered: "Đã hủy",
      });
      /* tổng số tiền có trạng thái là cancalled */
      const countOrderCanceledMoneys = await Bill.find({
        isDelivered: "Đã hủy",
      }).select("totalPrice");
      /* order có trạng thái là pending và đã hết hạn */
      const countOrderPendingExpiration = await Bill.countDocuments({
        isDelivered: "Chờ xác nhận",
        endDate: { $gte: new Date() }, // Chỉ lấy các order chưa hết hạn
      });

      return res.status(200).json({
        /* voucher */
        vouchers: [
          { name: "total", value: countVouchers },
          { name: "active", value: countVoucherActive },
          { name: "inActive", value: countVoucherInActive },
          { name: "expiration", value: countVoucherExpiration },
          { name: "notExpiration", value: countVoucherNotExpiration },
        ],
        countOrderDay: [
          { name: "total", value: countOrders },
          // { name: "active", value: countOrderActive },
          // { name: "inActive", value: countOrderInActive },
          // { name: "expiration", value: countOrderExpiration },
          // { name: "notExpiration", value: countOrderNotExpiration },
        ],
        countOrderStatus: [
          { name: "pending", value: countOrderPending },
          { name: "confirmed", value: countOrderConfirmed },
          { name: "delivered", value: countOrderDelivered },
          { name: "done", value: countOrderDone },
          { name: "canceled", value: countOrderCanceled },
          // { name: 'pendingExpiration', value: countOrderPendingExpiration },
        ],
        moneys: [
          {
            name: "totalMoneyDay",
            value: totalMoneyDay,
          },
          {
            name: "totalMoneyWeek",
            value: totalMoneyWeek,
          },
          {
            name: "totalMoneyMonth",
            value: totalMoneyMonth,
          },
        ],

        /* money order status */
        moneyOrderStatus: [
          {
            name: "pending",
            value: countOrderPendingMoneys.reduce(
              (a, b) => a + b.totalPrice,
              0
            ),
          },
          {
            name: "confirmed",
            value: countOrderConfirmedMoneys.reduce(
              (a, b) => a + b.totalPrice,
              0
            ),
          },
          {
            name: "delivered",
            value: countOrderDeliveredMoneys.reduce(
              (a, b) => a + b.totalPrice,
              0
            ),
          },
          {
            name: "done",
            value: countOrderDoneMoneys.reduce((a, b) => a + b.totalPrice, 0),
          },
          {
            name: "canceled",
            value: countOrderCanceledMoneys.reduce(
              (a, b) => a + b.totalPrice,
              0
            ),
          },
        ],

        /* users */
        users: [
          { name: "total", value: countUsers },
          { name: "active", value: countUserActive },
          { name: "inActive", value: countUserInActive },
        ],

        /* products */
        products: [
          { name: "total", value: countProducts },
          { name: "active", value: countProductActive },
          { name: "inActive", value: countProductInActive },
          { name: "deleted", value: countProductDeleted },
          { name: "notDeleted", value: countProductNotDeleted },
        ],

        /* category */
        categorys: [
          { name: "total", value: countCategorys },
          { name: "active", value: countCategoryActive },
          { name: "inActive", value: countCategoryInActive },
        ],
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  //
  analyticMonth: async (req, res) => {
    try {
      /* order có trạng thái là pending theo tháng */
      const countOrderPendingMonth =
        await analyticController.countOrderByStatusAndMonth("Chờ xác nhận");
      /* order có trạng thái là confirmed theo tháng */
      const countOrderConfirmedMonth =
        await analyticController.countOrderByStatusAndMonth("Chờ lấy hàng");
      /* order có trạng thái là deivered theo tháng */
      const countOrderDeliveredMonth =
        await analyticController.countOrderByStatusAndMonth("Đang giao hàng");
      /* order có trạng thái là done theo tháng */
      const countOrderDoneMonth =
        await analyticController.countOrderByStatusAndMonth("Đã giao hàng");
      /* order có trạng thái là canceled theo tháng */
      const countOrderCanceledMonth =
        await analyticController.countOrderByStatusAndMonth("Đã hủy");

      /* số tiền thu được theo tuần */
      const totalMoneyWeeksPending =
        await analyticController.getWeeklyRevenueByStatusAndCurrentMonth(
          "Chờ xác nhận"
        );
      const totalMoneyWeeksConfirmed =
        await analyticController.getWeeklyRevenueByStatusAndCurrentMonth(
          "Chờ lấy hàng"
        );
      const totalMoneyWeeksDelivered =
        await analyticController.getWeeklyRevenueByStatusAndCurrentMonth(
          "Đang giao hàng"
        );
      const totalMoneyWeeksDone =
        await analyticController.getWeeklyRevenueByStatusAndCurrentMonth(
          "Đã giao hàng"
        );
      const totalMoneyWeeksCanceled =
        await analyticController.getWeeklyRevenueByStatusAndCurrentMonth(
          "Đã hủy"
        );

      return res.status(200).json({
        orders: [
          {
            name: "weeks",
            analytics: [
              {
                name: "pending",
                analytics: totalMoneyWeeksPending,
              },
              {
                name: "confirmed",
                analytics: totalMoneyWeeksConfirmed,
              },
              {
                name: "delivered",
                analytics: totalMoneyWeeksDelivered,
              },
              {
                name: "done",
                analytics: totalMoneyWeeksDone,
              },
              {
                name: "canceled",
                analytics: totalMoneyWeeksCanceled,
              },
            ],
          },
          {
            name: "months",
            analytics: [
              {
                pending: countOrderPendingMonth,
                confirmed: countOrderConfirmedMonth,
                delivered: countOrderDeliveredMonth,
                done: countOrderDoneMonth,
                canceled: countOrderCanceledMonth,
              },
            ],
          },
        ],
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  analysticTotal: async (req, res) => {
    var doanh_thu = 0;
    const currentDate = new Date();

    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const result = await Bill.find({
      $expr: {
        $and: [
          { $eq: [{ $year: "$createdAt" }, currentYear] },
          { $eq: [{ $month: "$createdAt" }, currentMonth] },
        ],
      },
    }).populate({
      path: "cartItems",
      populate: {
        path: "product",
      },
    });
    // return res.json(result);
    const vvv = await Bill.aggregate([
      {
        $project: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          total: "$totalPrice",
          status: "$isDelivered",
        },
      },
    ]);

    var list_doanhthu = {};
    for (const v of vvv) {
      if (v.isDelivered == "Đã hủy") continue;
      if (list_doanhthu["tháng " + v.month] == undefined)
        list_doanhthu = {
          ...list_doanhthu,
          ...{ ["tháng " + v.month]: { count: 1, money: v.total } },
        };
      else
        list_doanhthu["tháng " + v.month] = {
          count: list_doanhthu["tháng " + v.month].count + 1,
          money: list_doanhthu["tháng " + v.month].money + v.total,
        };
    }
    var all_dth = 0;
    const all_dt = await Bill.find({})
      .populate("cartItems.product", "user")
      .sort({ createdAt: -1 });
    // return res.json(all_dt);
    for (const v of all_dt)
      if (v.isDelivered != "Đã hủy") all_dth += v.totalPrice;
    var sold_product = {};
    var m_product = { count: 0, product: "", _id: "", images: [] };
    //
    for (const v of result) {
      if (v.isDelivered != "Đã hủy") doanh_thu += v.totalPrice; //doanh thu
      for (const c of v.cartItems) {
        // console.log(c, ":::cartItem");
        if (!sold_product[c?.product?.name]) {
          sold_product[c?.product?.name] = {
            count: 1,
            _id: c._id,
            images: [c.images],
            price: c.price,
          };
        } else {
          // if (!sold_product[c?.product?.name].images.includes(c.images)) {
          //   sold_product[c?.product?.name].images.push(c.image);
          // }
          sold_product[c?.product?.name].count++;
          sold_product[c?.product?.name]._id = c._id;
        }
        if (m_product.count < sold_product[c?.product?.name].count) {
          m_product.count = sold_product[c?.product?.name].count;
          m_product.product = c?.product?.name;
          m_product._id = c._id;
          m_product.images = sold_product[c?.product?.name].images;
        }
      }
    }

    //số user mới
    const nUs = await User.find({
      $expr: {
        $and: [
          { $eq: [{ $year: "$createdAt" }, currentYear] },
          { $eq: [{ $month: "$createdAt" }, currentMonth] },
        ],
      },
    });
    const all_nUs = await User.find({});
    //
    //vùng ngày
    const { fromDate, toDate, selectDate } = req.query;
    var AnaZone = [];
    if (fromDate && toDate) {
      var res1 = await Bill.find({
        createdAt: {
          $gte: new Date(fromDate),
          $lte: new Date(toDate),
        },
      });
      if (selectDate)
        res1 = await Bill.find({ createdAt: new Date(selectDate) });
      //doanh thu tuần tự
      var dt_toDate = 0;
      var cancel_order_toDate = 0;
      var done_order_toDate = 0;
      var vnpay_toDate = 0;
      for (const value of res1) {
        dt_toDate += value.totalPrice; //dt
        if (value.isDelivered == "Đã hủy") cancel_order_toDate += 1;
        if (value.isDelivered == "Đã giao hàng") done_order_toDate += 1;
        if (value.payment_method != "Thanh toán tiền mặt") vnpay_toDate += 1;
      }
      AnaZone = {
        "doanh thu vùng này": dt_toDate,
        "đơn hàng đã huỷ": cancel_order_toDate,
        "đơn hàng thành công": done_order_toDate,
        "trả tiền bằng vnpay": vnpay_toDate,
        "trả tiền bằng tiền mặt": res1.length - vnpay_toDate,
      };
    }
    //voucher
    const Vouchers = await Voucher.find({});
    var total_voucher_money = 0;
    for (const v1 of Vouchers) total_voucher_money += v1.price_order;
    //user mua 2 đơn
    var userMap = {};
    var cUser2_Order = [];
    var c_ssUser2_Order = 0;
    var dt_ssUser2_Order = 0;
    for (const v of all_dt) {
      //lưu user mua  vào 1 map
      if (v.user == undefined) {
        dt_ssUser2_Order += v.totalPrice;
        c_ssUser2_Order++;
      } else if (userMap[v.user] == undefined && v.user != undefined)
        userMap = { ...userMap, ...{ [v.user]: 1 } };
      else userMap[v.user] = userMap[v.user] + 1;
    }
    for (const [key, value] of Object.entries(userMap))
      if (value >= 2) {
        const ass1_b = await User.findOne({ _id: key });
        cUser2_Order.push(ass1_b);
      }
    const { TopSell } = req.query;
    if (!TopSell) {
      res.json({
        "*theo thời gian tuỳ ý": AnaZone,
        voucher: {
          "số lượng": Vouchers.length,
          "tổng tiền": total_voucher_money,
        },
        "doanh thu tháng này": {
          "tháng này": doanh_thu,
          "tổng doanh thu": all_dth,
          "số đơn": list_doanhthu,
          "doanh thu khách vãng lai ": dt_ssUser2_Order,
        },

        "số user tham gia": {
          "tháng này": nUs.length,
          "tổng ": all_nUs.length,
          "khách vãn lai": c_ssUser2_Order,
        },
        TopSell: {
          "sản phẩm bán nhiều nhất": m_product,
          List: [sold_product],
        },
        "user mua 2 đơn trở lên": cUser2_Order,
      });
    } else {
      var newArr = [];
      for (const [key, value] of Object.entries(sold_product)) {
        newArr.push({ ...value, name: key });
      }
      return res.json(newArr);
    }
  },

  //Fillter theo lịch âm
  analysticFillter: async (req, res) => {
    try {
      //date -> y/m/d
      const canceled = await analyticController.fillterOrderByCalendar(
        "Đã hủy",
        req.body.date
      );
      const done = await analyticController.fillterOrderByCalendar(
        "Đã giao hàng",
        req.body.date
      );
      const delivered = await analyticController.fillterOrderByCalendar(
        "Đang giao hàng",
        req.body.date
      );
      const confirmed = await analyticController.fillterOrderByCalendar(
        "Chờ lấy hàng",
        req.body.date
      );
      const pending = await analyticController.fillterOrderByCalendar(
        "Chờ xác nhận",
        req.body.date
      );
      const data = {
        canceled,
        done,
        delivered,
        confirmed,
        pending,
      };
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
};

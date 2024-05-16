import Bill from "../models/Bill";
import ListModel from "../models/dashboard";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { DashboardValidator } from "../validations/dashboard";
// Hàm tính tổng theo tháng
function aggregateByMonth(dailyTotal) {
  const aggregatedTotal = {};
  for (const [date, value] of Object.entries(dailyTotal)) {
    const month = date.split("-").slice(0, 2).join("-");
    if (!aggregatedTotal[month]) {
      aggregatedTotal[month] = 0;
    }
    aggregatedTotal[month] += value;
  }
  return aggregatedTotal;
}

// Hàm tính tổng theo năm
function aggregateByYear(dailyTotal) {
  const aggregatedTotal = {};
  for (const [date, value] of Object.entries(dailyTotal)) {
    const year = date.split("-")[0];
    if (!aggregatedTotal[year]) {
      aggregatedTotal[year] = 0;
    }
    aggregatedTotal[year] += value;
  }
  return aggregatedTotal;
}

export const getList = async (req, res) => {
  try {
    const lists = await ListModel.find();
    res.status(200).json({ data: lists });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const postList = async (req, res) => {
  try {
    const { error } = DashboardValidator.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errors = error.details.map((err) => err.message);
      return res.status(400).json({
        message: errors,
      });
    }
    const { name, type } = req.body;
    const newList = new ListModel({ name, type });
    const savedList = await newList.save();
    res.status(201).json(savedList);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

export const getDataChart = async (req, res) => {
  try {
    const { startTime, endTime, type } = req.query; // Thêm type vào đây
    const { id } = req.params;
    const list = await ListModel.findById(id);
    if (!list) {
      return res.status(404).json({ message: "Không tìm thấy danh sách" });
    } else if (list.name === "Doanh số") {
      const config = {
        name: list.name,
        type: list.type,
      };

      const bills = await Bill.find({
        updatedAt: {
          $gte: new Date(startTime),
          $lt: new Date(endTime + "T23:59:59.999Z"),
        },
        isDelivered: "Đã giao hàng",
      });
      const dailyTotal = {};
      bills.forEach((bill) => {
        const date = new Date(bill.updatedAt).toISOString().split("T")[0];
        if (!dailyTotal[date]) {
          dailyTotal[date] = 0;
        }
        dailyTotal[date] += bill.totalPrice;
      });
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const currentDateISO = currentDate.toISOString().split("T")[0];
        if (!dailyTotal[currentDateISO]) {
          dailyTotal[currentDateISO] = 0;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Tính tổng theo loại (ngày, tháng, năm)
      let aggregatedTotal = {};
      if (type === "day" || !type) {
        aggregatedTotal = dailyTotal;
      } else if (type === "month") {
        aggregatedTotal = aggregateByMonth(dailyTotal, startTime, endTime);
      } else if (type === "year") {
        aggregatedTotal = aggregateByYear(dailyTotal);
      }

      const sortedData = Object.entries(aggregatedTotal)
        .map(([time, value]) => ({ time, value }))
        .sort((a, b) => new Date(a.time) - new Date(b.time));

      const data = {
        data: sortedData,
      };

      return res.status(200).json({
        data: [
          {
            config: config,
            data: data,
          },
        ],
      });
    } else if (list.name === "Đơn hàng") {
      const config = {
        name: list.name,
        type: list.type,
      };

      const bills = await Bill.find({
        createdAt: {
          $gte: new Date(startTime),
          $lt: new Date(endTime + "T23:59:59.999Z"),
        },
      });
      console.log(bills);
      const dailyTotal = {};
      bills.forEach((bill) => {
        const date = new Date(bill.createdAt).toISOString().split("T")[0];
        if (!dailyTotal[date]) {
          dailyTotal[date] = 0;
        }
        dailyTotal[date]++;
      });

      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const currentDateISO = currentDate.toISOString().split("T")[0];
        if (!dailyTotal[currentDateISO]) {
          dailyTotal[currentDateISO] = 0;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      let aggregatedTotal = {};
      if (type === "day" || !type) {
        aggregatedTotal = dailyTotal;
      } else if (type === "month") {
        aggregatedTotal = aggregateByMonth(dailyTotal, startTime, endTime);
      } else if (type === "year") {
        aggregatedTotal = aggregateByYear(dailyTotal);
      }

      const sortedData = Object.entries(aggregatedTotal)
        .map(([time, value]) => ({ time, value }))
        .sort((a, b) => new Date(a.time) - new Date(b.time));

      const data = {
        data: sortedData,
      };

      return res.status(200).json({
        data: [
          {
            config: config,
            data: data,
          },
        ],
      });
    } else if (list.name === "Tất cả") {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      yesterday.setUTCHours(0, 0, 0, 0);

      const billstoday = await Bill.aggregate([
        {
          $match: {
            updatedAt: {
              $gte: today,
              $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
            },
            isDelivered: "Đã giao hàng",
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$totalPrice" },
          },
        },
      ]);

      const billsyesterday = await Bill.aggregate([
        {
          $match: {
            updatedAt: {
              $gte: yesterday,
              $lt: today,
            },
            isDelivered: "Đã giao hàng",
          },
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$totalPrice" },
          },
        },
      ]);
      const billsyesterday2 = await Bill.aggregate([
        {
          $match: {
            updatedAt: {
              $gte: today,
              $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
            },
            isDelivered: "Đã giao hàng",
          },
        },{
          $group: {
            _id: null,
            totalAmount: { $sum: "$totalPrice" },
          },
        },
      ]);
      let percentageChange=0
      if(billsyesterday.length>0 & billstoday.length>0){
        percentageChange = ((billstoday[0].totalAmount - billsyesterday[0].totalAmount)/billsyesterday[0].totalAmount)  * 100;
      }else{
        if(billsyesterday.length=0){
          percentageChange = 0
        }else if(billstoday.length=0){
          percentageChange = 0
        }
      }
      console.log(percentageChange);
      console.log(billstoday);
      console.log(billsyesterday2);
      const config = {
        name: list.name,
        type: list.type,
      };

      const Bills = await Bill.find();
      const billCountGuest = await Bill.countDocuments({
        user: { $exists: false },
      });
      const user = await User.find();
      const product = await Product.find();
      const statusOrder = [
        "Chờ xác nhận",
        "Chờ lấy hàng",
        "Đang giao hàng",
        "Đã giao hàng",
        "Đã hủy",
      ];
      const totalByStatus = await Bill.aggregate([
        {
          $group: {
            _id: "$isDelivered",
            total: { $sum: 1 },
          },
        },
      ]);

      const totalRevenue = await Bill.aggregate([
        {
          $match: { isDelivered: "Đã giao hàng" },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPrice" },
          },
        },
      ]);

      const sortedTotalByStatus = statusOrder.map((status) => ({
        [status]: totalByStatus.find((item) => item._id === status)?.total || 0,
      }));
      const expectedRevenue = await Bill.aggregate([
        {
          $match: {
            isDelivered: { $in: ["Chờ xác nhận", "Chờ lấy hàng", "Đang giao hàng"] }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$totalPrice" }
          }
        }
      ]);
      
      const expectedRevenueTotal = expectedRevenue.length > 0 ? expectedRevenue[0].totalAmount : 0;
      
      const data = {
        totalAllBill: Bills.length,
        totalByStatus: Object.assign({}, ...sortedTotalByStatus),
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        totalUser: user.length,
        totalGuest: billCountGuest,
        totalProduct: product.length,
        billstoday: billsyesterday2.length>0? billsyesterday2[0].totalAmount:0,
        percentageChange:percentageChange!=0? percentageChange.toFixed(2):0,
        expectedRevenueTotal
      };

      return res.status(200).json({
        data: [
          {
            config: config,
            data: data,
          },
        ],
      });
    } else if (list.name === "Top") {
      const config = {
        name: list.name,
        type: list.type,
      };
      const topProducts = await Product.find({})
        .sort({ sold_count: -1 })
        .limit(5);
      const data2 = topProducts.map((product) => {
        return {
          name: product.name,
          price: product.price,
          quantity: product.quantity,
          sold_count: product.sold_count,
          image: product.images,
        };
      });
      const data = {
        top5product: data2,
      };
      return res.status(200).json({
        data: [
          {
            config: config,
            data: data,
          },
        ],
      });
    } else {
      res.status(500).json({
        message: "Chưa có dạng này",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      name: error.name,
      message: error.message,
    });
  }
};

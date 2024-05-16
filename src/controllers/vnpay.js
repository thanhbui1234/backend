import express from "express";
const router = express.Router();
import querystring from "qs";
import crypto from "crypto";
import dotenv from "dotenv";
import dateFormat from "dateformat";
dotenv.config();
const { vnp_TmnCode, vnp_HashSecret, vnp_Url, vnp_Returnurl, vnp_apiUrl } =
  process.env;
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
router.post("/create_payment_url", (req, res, next) => {
  const ipAddr =
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;
  let tmnCode = "YW0J1STH";
  let secretKey = "TLITJIILYWMLJKDRGIERRHKYIQPYJEDD";
  let vnpUrl = vnp_Url;
  let returnUrl = vnp_Returnurl;
  const date = new Date();
  const createDate = dateFormat(date, "yyyymmddHHmmss");
  const orderId = req.body.orderId;
  const amount = req.body.amount;
  const bankCode = req.body.bankCode;
  const orderInfo = req.body.orderDescription;
  const orderType = req.body.orderType;
  let locale = req.body.language;
  if (locale === null || locale === "") {
    locale = "vn";
  }
  const currCode = "VND";
  let vnp_Params = {};
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = locale;
  vnp_Params["vnp_CurrCode"] = currCode;
  vnp_Params["vnp_TxnRef"] = orderId;
  vnp_Params["vnp_OrderInfo"] = "Thanh toan cho ma GD:" + orderId;
  vnp_Params["vnp_OrderType"] = "other";
  vnp_Params["vnp_Amount"] = amount * 100;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;
  if (bankCode !== null && bankCode !== "") {
    vnp_Params["vnp_BankCode"] = bankCode;
  }
  vnp_Params = sortObject(vnp_Params);
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(new Buffer(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;
  vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });
  return res
    .status(200)
    .json({ message: "thành công", data: vnpUrl, return: vnp_Url });
});

router.get("/vnpay_return", (req, res, next) => {
  const vnp_Params = req.query;

  const { vnp_SecureHash: secureHash, ...paramsWithoutHash } = vnp_Params;
  const sortedParams = Object.fromEntries(
    Object.entries(paramsWithoutHash).sort()
  );
  let tmnCode = "RLE42FCR";
  let secretKey = "OQPUUZRVSSJASOQVUQHHURHBXGDIMBTU";

  const signData = querystring.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (secureHash === signed) {
    // Kiểm tra xem dữ liệu trong db có hợp lệ hay không và thông báo kết quả
    res.status(200).json({ code: vnp_Params["vnp_ResponseCode"] });
  } else {
    res.status(200).json({ code: "97" });
  }
});

export default router;

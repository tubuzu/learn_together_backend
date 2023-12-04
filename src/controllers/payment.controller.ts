import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CoinPackageModel } from "../models/coinPackage.model.js";
import {
  errorResponse,
  pageResponse,
  successResponse,
} from "../utils/response.util.js";
import { vnpConfig } from "../config/vnp.config.js";
import moment from "moment";
import { createTransaction } from "../service/paymentTransaction.service.js";
import querystring from "qs";
import crypto from "crypto";
import { PaymentTransactionModel } from "../models/paymentTransaction.model.js";
import { UserModel } from "../models/user.model.js";
import { addCoinToUser } from "../service/user.service.js";
import { PaymentTransactionState } from "../utils/const.js";

export const createPaymentUrl = async (req: Request, res: Response) => {
  const userId = res.locals.userData.user;
  const { packageId, ipAddr } = req.body;

  const coinPackage = await CoinPackageModel.findById(packageId);

  var tmnCode = vnpConfig.vnp_TmnCode;
  var secretKey = vnpConfig.vnp_HashSecret;
  var vnpUrl = vnpConfig.vnp_Url;
  var returnUrl = vnpConfig.vnp_ReturnUrl;

  var date = new Date();

  var createDate = moment(date).format("YYYYMMDDHHmmss");
  var orderId = moment(date).format("HHmmss");
  var expireDate = moment(date).add(15, "minutes").format("YYYYMMDDHHmmss");
  var amount = coinPackage.priceInVND * 100;

  var orderInfo = req.body.orderDescription;
  if (orderInfo === null) orderInfo = "";
  var orderType = req.body.orderType;
  if (orderType === null) orderType = 260000;
  var locale = req.body.language;
  // if (locale === null || locale === "") {
  //   locale = "vn";
  // }
  var currCode = "VND";
  var vnp_Params = {} as any;
  vnp_Params["vnp_Version"] = "2.1.0";
  vnp_Params["vnp_Command"] = "pay";
  vnp_Params["vnp_TmnCode"] = tmnCode;
  vnp_Params["vnp_Locale"] = locale;
  vnp_Params["vnp_CurrCode"] = currCode;
  vnp_Params["vnp_TxnRef"] = orderId;
  vnp_Params["vnp_OrderInfo"] = orderInfo;
  vnp_Params["vnp_OrderType"] = orderType;
  vnp_Params["vnp_Amount"] = amount;
  vnp_Params["vnp_ReturnUrl"] = returnUrl;
  vnp_Params["vnp_IpAddr"] = ipAddr;
  vnp_Params["vnp_CreateDate"] = createDate;
  // vnp_Params["vnp_ExpireDate"] = expireDate;

  vnp_Params = sortObject(vnp_Params);

  var signData = querystring.stringify(vnp_Params, { encode: false });
  var hmac = crypto.createHmac("sha512", secretKey);
  var signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  // vnp_Params["vnp_SecureHash"] = signed;
  signData += "&vnp_SecureHash=" + signed;
  // vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });
  vnpUrl += "?" + signData;

  const paymentTransaction = await createTransaction({
    package: packageId,
    orderId,
    user: userId,
  });
  //   res.redirect(vnpUrl);
  res.status(StatusCodes.OK).json(
    successResponse({
      data: {
        paymentTransactionId: paymentTransaction._id,
        packageId,
        url: vnpUrl,
      },
    })
  );
};

export const vnpUrlIpn = async (req: Request, res: Response) => {
  var vnp_Params = req.query;
  var secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);
  var secretKey = vnpConfig.vnp_HashSecret;
  var signData = querystring.stringify(vnp_Params, { encode: false });
  var hmac = crypto.createHmac("sha512", secretKey);
  var signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (secureHash === signed) {
    var orderId = vnp_Params["vnp_TxnRef"];
    var responseCode = vnp_Params["vnp_ResponseCode"];
    paymentTransaction.responseCode = responseCode;
    await paymentTransaction.Save();
    if (responseCode == "00") {
      var paymentTransaction = await PaymentTransactionModel.findOneAndUpdate(
        { orderId },
        { state: PaymentTransactionState.SUCCESS },
        { new: true }
      ).populate("package");
      await addCoinToUser({
        userId: paymentTransaction.user,
        amountOfCoin: paymentTransaction.package.amountOfCoin,
      });
    } else {
      await PaymentTransactionModel.findOneAndUpdate(
        { orderId },
        { state: PaymentTransactionState.FAILED }
      );
    }
    res.status(200).json({ RspCode: "00", Message: "success" });
  } else {
    await PaymentTransactionModel.findOneAndUpdate(
      { orderId },
      { state: PaymentTransactionState.FAILED }
    );
    res.status(200).json({ RspCode: "97", Message: "Fail checksum" });
  }
};

export const vnpUrlReturn = async (req: Request, res: Response) => {
  var vnp_Params = req.query;

  var secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);

  var tmnCode = vnpConfig.vnp_TmnCode;
  var secretKey = vnpConfig.vnp_HashSecret;

  var signData = querystring.stringify(vnp_Params, { encode: false });
  var hmac = crypto.createHmac("sha512", secretKey);
  var signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (secureHash === signed) {
    res.status(StatusCodes.OK).json(successResponse({ message: "Success" }));
  } else {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json(errorResponse({ message: "Failed" }));
  }
};

function sortObject(obj: any) {
  let sorted = {} as any;
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

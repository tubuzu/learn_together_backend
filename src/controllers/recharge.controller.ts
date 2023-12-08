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
import {
  createRechargeOrder,
  findRechargeOrderPaginate,
} from "../service/recharge.service.js";
import querystring from "qs";
import crypto from "crypto";
import { RechargeOrderModel } from "../models/rechargeOrder.model.js";
import { UserModel } from "../models/user.model.js";
import { addCoinToUser } from "../service/user.service.js";
import { PaymentTransactionState } from "../utils/const.js";
import { appSettings } from "../settings/app.setting.js";

export const createPaymentUrl = async (req: Request, res: Response) => {
  const userId = res.locals.userData.user;
  const { packageId, ipAddr } = req.body;

  const coinPackage = await CoinPackageModel.findById(packageId);

  var tmnCode = vnpConfig.vnp_TmnCode;
  var secretKey = vnpConfig.vnp_HashSecret;
  var vnpUrl = vnpConfig.vnp_Url;
  var returnUrl = vnpConfig.vnp_ReturnUrl;

  var date = new Date();

  var createDate = moment(date).utcOffset("+07:00").format("YYYYMMDDHHmmss");
  var orderId = moment(date).format("HHmmss");
  var expireDate = moment(date)
    .add(5, "minutes")
    .utcOffset("+07:00")
    .format("YYYYMMDDHHmmss");
  var amount = coinPackage.priceInVND * (100 - coinPackage.discount);

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
  vnp_Params["vnp_ExpireDate"] = expireDate;

  vnp_Params = sortObject(vnp_Params);

  var signData = querystring.stringify(vnp_Params, { encode: false });
  var hmac = crypto.createHmac("sha512", secretKey);
  var signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;
  // signData += "&vnp_SecureHash=" + signed;
  vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });
  // vnpUrl += "?" + signData;

  const rechargeOrder = await createRechargeOrder({
    package: packageId,
    orderId,
    user: userId,
  });
  //   res.redirect(vnpUrl);
  res.status(StatusCodes.OK).json(
    successResponse({
      data: {
        rechargeOrderId: rechargeOrder._id,
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

  var orderId = vnp_Params["vnp_TxnRef"];
  var responseCode = vnp_Params["vnp_ResponseCode"];
  var rechargeOrder = await RechargeOrderModel.findOne({ orderId }).populate(
    "package"
  );

  var orderNeedToBeHandle =
    rechargeOrder.state === PaymentTransactionState.PENDING;

  if (secureHash === signed) {
    if (orderNeedToBeHandle) {
      if (responseCode == "00") {
        rechargeOrder.state = PaymentTransactionState.SUCCESS;
        await addCoinToUser({
          userId: rechargeOrder.user,
          amountOfCoin: rechargeOrder.package.amountOfCoin,
        });
        console.log(rechargeOrder.package.amountOfCoin);
      } else {
        rechargeOrder.state = PaymentTransactionState.FAILED;
      }
    }
    res.status(200).json({ RspCode: "00", Message: "success" });
  } else {
    if (orderNeedToBeHandle) {
      rechargeOrder.state = PaymentTransactionState.FAILED;
    }
    res.status(200).json({ RspCode: "97", Message: "Fail checksum" });
  }

  if (orderNeedToBeHandle) {
    rechargeOrder.responseCode = responseCode;
    await rechargeOrder.save();
  }
};

export const vnpUrlReturn = async (req: Request, res: Response) => {
  var vnp_Params = req.query;

  var secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  vnp_Params = sortObject(vnp_Params);

  // var tmnCode = vnpConfig.vnp_TmnCode;
  var secretKey = vnpConfig.vnp_HashSecret;

  var signData = querystring.stringify(vnp_Params, { encode: false });
  var hmac = crypto.createHmac("sha512", secretKey);
  var signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  // var responseCode = vnp_Params["vnp_ResponseCode"];
  if (secureHash === signed) {
    // res.status(StatusCodes.OK).json(successResponse({ message: "Success" }));
    let returnURL = appSettings.CLIENT_VNP_RETURN_URL;
    returnURL += "?" + querystring.stringify(vnp_Params, { encode: false });
    return res.redirect(returnURL);
  } else {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(errorResponse({ message: "Failed checksum!" }));
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

export const searchRechargeOrder = async (req: Request, res: Response) => {
  const { state } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;

  const keyword: any = {
    isDeleted: false,
  };

  if (state) {
    let stateArray: string[] = (state as string).split(",");
    keyword.state = { $in: stateArray };
  }

  const orders = await findRechargeOrderPaginate(keyword, page, perPage);

  return res
    .status(StatusCodes.OK)
    .json(successResponse({ data: pageResponse(orders) }));
};

export const searchUserRechargeOrder = async (req: Request, res: Response) => {
  const { state } = req.query;
  const userId = res.locals.userData.user;
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;

  const keyword: any = {
    user: userId,
    isDeleted: false,
  };

  if (state) {
    let stateArray: string[] = (state as string).split(",");
    keyword.state = { $in: stateArray };
  }

  const orders = await findRechargeOrderPaginate(keyword, page, perPage);

  return res
    .status(StatusCodes.OK)
    .json(successResponse({ data: pageResponse(orders) }));
};

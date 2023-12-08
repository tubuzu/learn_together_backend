import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import mongoosePackage from "mongoose";
import { DonateOrderModel } from "../models/donateOrder.model.js";
import { UserModel } from "../models/user.model.js";
import {
  createDonateOrder,
  findDonateOrderPaginate,
  suspendDonateOrder,
} from "../service/donate.service.js";
import { addCoinToUser, deductCoinFromUser } from "../service/user.service.js";
import { PaymentTransactionState } from "../utils/const.js";
import { sendEmail } from "../utils/emailSender.js";
import { generateOTP } from "../utils/generateOtp.js";
import {
  errorResponse,
  pageResponse,
  successResponse,
} from "../utils/response.util.js";
import schedule from "node-schedule";
import moment from "moment";

const { startSession } = mongoosePackage;

const OTP_EXPIRE_TIME_MINUTE = 5;
const OTP_RESET_TIME_MINUTE = 1;

const scheduledTasks: any = [];

export const createDonateOrderAndSendOTP = async (
  req: Request,
  res: Response
) => {
  const senderId = res.locals.userData.user;
  const { receiverId, amountOfCoin } = req.body;

  // check sender have enough credit
  const sender = await UserModel.findById(senderId).select("+currentCredit");
  if (sender.currentCredit < amountOfCoin)
    return res.status(StatusCodes.BAD_REQUEST).json(
      errorResponse({
        message: "Your balance don't have enough coin for this donation",
      })
    );

  // check receiver exists
  const receiver = await UserModel.findById(receiverId);
  if (!receiver)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(errorResponse({ message: "Receiver not found!" }));

  // generate otp and create donate order
  var otpCode = generateOTP();
  const donateOrder = await createDonateOrder({
    sender: senderId,
    receiver: receiverId,
    amountOfCoin,
    otpCode,
  });
  let fifteenMinutesLater = moment().add(OTP_EXPIRE_TIME_MINUTE, "minutes");
  let expireTime = fifteenMinutesLater.toDate();
  const expireTask = schedule.scheduleJob(expireTime, async () => {
    await suspendDonateOrder(donateOrder._id);
  });
  scheduledTasks[donateOrder._id] = expireTask;

  // send email with token link
  const to = sender.email;
  const subject = "Donation OTP Code";
  const body = `
            <p> Hello ${sender.firstName} ${sender.lastName},</p>
            <p>Here is your donation details:</p>
            <p>Receiver: ${receiver.firstName} ${receiver.lastName}</p>
            <p>Coin amount: ${donateOrder.amountOfCoin}</p>
            
            <p>Your OTP is: ${otpCode}</p>
            <p>Regards,</p>
            <p>Team Learn Together</p>
        `;
  // <p>Price in VND: ${donateOrder.amountOfCoin * 1000}</p>
  await sendEmail(to, subject, body);

  res.status(StatusCodes.OK).json(
    successResponse({
      data: {
        donateOrderId: donateOrder._id,
      },
    })
  );
};

export const resendDonationOTP = async (req: Request, res: Response) => {
  const senderId = res.locals.userData.user;
  const { donateOrderId } = req.params;
  const sender = await UserModel.findById(senderId).select("+currentCredit");
  const donateOrder = await DonateOrderModel.findOne({
    _id: donateOrderId,
    state: PaymentTransactionState.PENDING,
  }).populate("receiver");

  if (!donateOrder)
    return res.status(StatusCodes.NOT_FOUND).json(
      errorResponse({
        message: "Donate order not found!",
      })
    );

  if (donateOrder.otpRequestLeft <= 0) {
    return res.status(StatusCodes.BAD_REQUEST).json(
      errorResponse({
        message: "Can not resend more than 3 times",
      })
    );
  }

  let now = moment();
  let lastOtpUpdateTime = moment(donateOrder.lastOtpUpdateTime);
  let difference = now.diff(lastOtpUpdateTime, "minutes");
  // console.log(now.format("HHmmss"));
  // console.log(lastOtpUpdateTime.format("HHmmss"));
  if (difference < OTP_RESET_TIME_MINUTE) {
    return res.status(StatusCodes.BAD_REQUEST).json(
      errorResponse({
        message:
          "You have requested OTP code too many times. Please wait at least one minute before requesting again.",
      })
    );
  }

  if (sender.currentCredit < donateOrder.amountOfCoin)
    return res.status(StatusCodes.BAD_REQUEST).json(
      errorResponse({
        message: "Your balance don't have enough coin for this donation",
      })
    );

  var otpCode = generateOTP();
  donateOrder.otpCode = otpCode;
  donateOrder.otpRequestLeft = donateOrder.otpRequestLeft - 1;
  await donateOrder.save();
  // send email with token link
  const to = sender.email;
  const subject = "Donation OTP Code";
  const body = `
            <p> Hello ${sender.firstName} ${sender.lastName},</p>
            <p>Here is your donation details:</p>
            <p>Receiver: ${donateOrder.receiver.firstName} ${donateOrder.receiver.lastName}</p>
            <p>Coin amount: ${donateOrder.amountOfCoin}</p>
            <p>Your OTP is: ${otpCode}</p>
            <p>Regards,</p>
            <p>Team Learn Together</p>
        `;
  await sendEmail(to, subject, body);

  res.status(StatusCodes.OK).json(
    successResponse({
      data: {
        donateOrderId: donateOrder._id,
      },
    })
  );
};

export const comfirmOTPAndDonate = async (req: Request, res: Response) => {
  const { otpCode, donateOrderId } = req.body;
  const donateOrder = await DonateOrderModel.findOne({
    _id: donateOrderId,
    state: PaymentTransactionState.PENDING,
  });

  if (!donateOrder)
    return res.status(StatusCodes.NOT_FOUND).json(
      errorResponse({
        message: "Donate order not found!",
      })
    );

  // check otp match
  if (otpCode !== donateOrder.otpCode) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json(errorResponse({ message: "OTP wrong!" }));
  }

  // check user have enough credit
  const sender = await UserModel.findById(donateOrder.sender).select(
    "+currentCredit"
  );
  if (sender.currentCredit < donateOrder.amountOfCoin) {
    return res.status(StatusCodes.BAD_REQUEST).json(
      errorResponse({
        message: "Your balance don't have enough coin for this donation",
      })
    );
  }

  // donate
  const session = await startSession();
  try {
    session.startTransaction();

    await deductCoinFromUser(
      {
        userId: donateOrder.sender,
        amountOfCoin: donateOrder.amountOfCoin,
      },
      { session }
    );
    await addCoinToUser(
      {
        userId: donateOrder.receiver,
        amountOfCoin: donateOrder.amountOfCoin,
      },
      { session }
    );
    donateOrder.state = PaymentTransactionState.SUCCESS;
    if (scheduledTasks[donateOrder._id])
      scheduledTasks[donateOrder._id].cancel();
    await donateOrder.save();

    await session.commitTransaction();
    res
      .status(StatusCodes.OK)
      .json(successResponse({ message: "Donate success!" }));
  } catch (err: any) {
    await session.abortTransaction();
    res
      .status(StatusCodes.BAD_REQUEST)
      .json(errorResponse({ message: err.message }));
  } finally {
    session.endSession();
  }
};

export const searchDonateOrder = async (req: Request, res: Response) => {
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

  const orders = await findDonateOrderPaginate(keyword, page, perPage);

  return res
    .status(StatusCodes.OK)
    .json(successResponse({ data: pageResponse(orders) }));
};

export const searchUserDonateOrder = async (req: Request, res: Response) => {
  const { state } = req.query;
  const userId = res.locals.userData.user;
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.perPage as string) || 10;

  const keyword: any = {
    $or: [{ sender: userId }, { receiver: userId }],
    isDeleted: false,
  };

  if (state) {
    let stateArray: string[] = (state as string).split(",");
    keyword.state = { $in: stateArray };
  }

  const orders = await findDonateOrderPaginate(keyword, page, perPage);

  return res
    .status(StatusCodes.OK)
    .json(successResponse({ data: pageResponse(orders) }));
};

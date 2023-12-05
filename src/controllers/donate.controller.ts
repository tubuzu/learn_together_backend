import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { startSession } from "mongoose";
import { DonateOrderModel } from "../models/donateOrder.model.js";
import { UserModel } from "../models/user.model.js";
import { createDonateOrder } from "../service/donate.service.js";
import { addCoinToUser, deductCoinFromUser } from "../service/user.service.js";
import { PaymentTransactionState } from "../utils/const.js";
import { sendEmail } from "../utils/emailSender.js";
import { generateOTP } from "../utils/generateOtp.js";
import { errorResponse, successResponse } from "../utils/response.util.js";

const OTP_EXPIRE_TIME_MINUTE = 15 * 60 * 1000;

export const createDonateOrderAndSendOTP = async (
  req: Request,
  res: Response
) => {
  const senderId = res.locals.userData.user;
  const { receiverId, amountOfCoin } = req.body;
  const sender = await UserModel.findById(senderId).select("+currentCredit");
  if (sender.currentCredit < amountOfCoin)
    res.status(StatusCodes.BAD_REQUEST).json(
      errorResponse({
        message: "Your balance don't have enough coin for this donation",
      })
    );
  const receiver = await UserModel.findById(receiverId);
  if (!receiver)
    res
      .status(StatusCodes.BAD_REQUEST)
      .json(errorResponse({ message: "Receiver not found!" }));
  var otpCode = generateOTP();
  const donateOrder = await createDonateOrder({
    sender: senderId,
    receiver: receiverId,
    amountOfCoin,
    otpCode,
  });
  // send email with token link
  const to = sender.email;
  const from = process.env.EMAIL_USER as string;
  const subject = "Donation OTP Code";
  const body = `Your OTP is: ${otpCode}`;
  await sendEmail(to, from, subject, body);

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
  const donateOrder = await DonateOrderModel.findById(donateOrderId);
  if (otpCode !== donateOrder.otpCode) {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json(errorResponse({ message: "OTP wrong!" }));
  }
  var lastOtpUpdateTime = new Date(donateOrder.lastOtpUpdateTime);
  if (Date.now() - lastOtpUpdateTime.getTime() > OTP_EXPIRE_TIME_MINUTE) {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json(errorResponse({ message: "OTP expired!" }));
  }
  const sender = await UserModel.findById(donateOrder.sender).select(
    "+currentCredit"
  );
  if (sender.currentCredit < donateOrder.amountOfCoin) {
    res.status(StatusCodes.BAD_REQUEST).json(
      errorResponse({
        message: "Your balance don't have enough coin for this donation",
      })
    );
  }

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
    await donateOrder.save();

    await session.commitTransaction();
    res
      .status(StatusCodes.OK)
      .json(successResponse({ message: "Donate success!" }));
  } catch (err: any) {
    await session.abortTransaction();
    res
      .status(StatusCodes.BAD_REQUEST)
      .json(errorResponse({ message: "Something went wrong!" }));
  } finally {
    session.endSession();
  }
};

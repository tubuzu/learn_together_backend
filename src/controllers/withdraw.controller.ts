import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { UserModel } from "../models/user.model.js";
import { WithdrawOrderModel } from "../models/withdrawOrder.model.js";
import {
  createWithdrawOrderService,
  findWithdrawOrderPaginate,
} from "../service/withdraw.service.js";
import { PaymentTransactionState } from "../utils/const.js";
import {
  errorResponse,
  pageResponse,
  successResponse,
} from "../utils/response.util.js";
import {
  createWithdrawRequestAcceptedNoti,
  createWithdrawRequestCanceledNoti,
  createWithdrawRequestRejectedNoti,
  createWithdrawRequestSubmittedNoti,
} from "../service/notification.service.js";

export const createWithdrawOrder = async (req: Request, res: Response) => {
  const { amountOfCoin, bankName, bankAccountCode, bankAccountName } = req.body;
  const userId = res.locals.userData.user;
  const user = await UserModel.findById(userId).select("+currentCredit");
  if (user.currentCredit < amountOfCoin) {
    res.status(StatusCodes.BAD_REQUEST).json(
      errorResponse({
        message:
          "Amount of coin you want to withdraw is greater than your current credit!",
      })
    );
  }

  const order = await createWithdrawOrderService({
    user: userId,
    amountOfCoin,
    bankName,
    bankAccountCode,
    bankAccountName,
  });

  await UserModel.findByIdAndUpdate(userId, {
    $inc: {
      currentCredit: -amountOfCoin,
    },
  });

  await createWithdrawRequestSubmittedNoti({
    originUserId: userId,
    targetUserId: userId,
    orderId: order._id,
    amountOfCoin: order.amountOfCoin,
  });

  res.status(StatusCodes.OK).json(
    successResponse({
      data: order,
      message: "Create withdraw order successfully!",
    })
  );
};

export const cancelWithdrawOrder = async (req: Request, res: Response) => {
  const { orderId } = req.body;
  const userId = res.locals.userData.user;

  const withdrawOrder = await WithdrawOrderModel.findOne({
    _id: orderId,
    state: PaymentTransactionState.PENDING,
  });

  if (!withdrawOrder) {
    res.status(StatusCodes.BAD_REQUEST).json(
      errorResponse({
        message: "WithdrawOrder not found!",
      })
    );
  }

  withdrawOrder.state = PaymentTransactionState.FAILED;
  await withdrawOrder.save();

  await UserModel.findByIdAndUpdate(userId, {
    $inc: {
      currentCredit: withdrawOrder.amountOfCoin,
    },
  });

  await createWithdrawRequestCanceledNoti({
    originUserId: userId,
    targetUserId: userId,
    orderId: withdrawOrder._id,
    amountOfCoin: withdrawOrder.amountOfCoin,
  });

  res.status(StatusCodes.OK).json(
    successResponse({
      message: "Cancel withdraw order successfully!",
    })
  );
};

export const acceptWithdrawOrder = async (req: Request, res: Response) => {
  const { orderId } = req.body;
  const userId = res.locals.userData.user;

  const withdrawOrder = await WithdrawOrderModel.findOne({
    _id: orderId,
    state: PaymentTransactionState.PENDING,
  });

  if (!withdrawOrder) {
    res.status(StatusCodes.BAD_REQUEST).json(
      errorResponse({
        message: "WithdrawOrder not found!",
      })
    );
  }

  withdrawOrder.state = PaymentTransactionState.SUCCESS;
  await withdrawOrder.save();

  await createWithdrawRequestAcceptedNoti({
    originUserId: userId,
    targetUserId: withdrawOrder.user,
    orderId: withdrawOrder._id,
    amountOfCoin: withdrawOrder.amountOfCoin,
  });

  res.status(StatusCodes.OK).json(
    successResponse({
      message: "Accept withdraw order successfully!",
    })
  );
};

export const rejectWithdrawOrder = async (req: Request, res: Response) => {
  const { orderId } = req.body;
  const userId = res.locals.userData.user;

  const withdrawOrder = await WithdrawOrderModel.findOne({
    _id: orderId,
    state: PaymentTransactionState.PENDING,
  });

  if (!withdrawOrder) {
    res.status(StatusCodes.BAD_REQUEST).json(
      errorResponse({
        message: "WithdrawOrder not found!",
      })
    );
  }

  withdrawOrder.state = PaymentTransactionState.FAILED;
  await withdrawOrder.save();

  await UserModel.findByIdAndUpdate(withdrawOrder.user, {
    $inc: {
      currentCredit: withdrawOrder.amountOfCoin,
    },
  });

  await createWithdrawRequestRejectedNoti({
    originUserId: userId,
    targetUserId: withdrawOrder.user,
    orderId: withdrawOrder._id,
    amountOfCoin: withdrawOrder.amountOfCoin,
  });

  res.status(StatusCodes.OK).json(
    successResponse({
      message: "Reject withdraw order successfully!",
    })
  );
};

export const searchWithdrawOrder = async (req: Request, res: Response) => {
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

  const orders = await findWithdrawOrderPaginate(keyword, page, perPage);

  return res
    .status(StatusCodes.OK)
    .json(successResponse({ data: pageResponse(orders) }));
};

export const searchUserWithdrawOrder = async (req: Request, res: Response) => {
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

  const orders = await findWithdrawOrderPaginate(keyword, page, perPage);

  return res
    .status(StatusCodes.OK)
    .json(successResponse({ data: pageResponse(orders) }));
};

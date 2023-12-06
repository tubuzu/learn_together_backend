import { WithdrawOrderModel } from "src/models/withdrawOrder.model.js";
import { PaymentTransactionState } from "../utils/const.js";
import { CreateWithdrawOrderParams } from "src/interfaces/withdrawOrder.interface.js";

export const createWithdrawOrder = async (request: CreateWithdrawOrderParams) => {
  return await WithdrawOrderModel.create(request);
};

export const suspendWithdrawOrder = async (id: string) => {
  return await WithdrawOrderModel.findByIdAndUpdate(
    id,
    {
      state: PaymentTransactionState.FAILED,
    },
    { new: true }
  );
};

export const findWithdrawOrderPaginate = async (
  keyword: any,
  page: number,
  perPage: number
) => {
  const classrooms = await WithdrawOrderModel.find(keyword)
    .sort({ "createdAt": -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);
  return classrooms;
};

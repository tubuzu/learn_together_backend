import { PaymentTransactionState } from "../utils/const.js";
import { CreateDonateOrderParams } from "../interfaces/donateOrder.interface.js";
import { DonateOrderModel } from "../models/donateOrder.model.js";

export const createDonateOrder = async (request: CreateDonateOrderParams) => {
  return await DonateOrderModel.create(request);
};

export const suspendDonateOrder = async (id: string) => {
  return await DonateOrderModel.findByIdAndUpdate(
    id,
    {
      state: PaymentTransactionState.FAILED,
    },
    { new: true }
  );
};

export const findDonateOrderPaginate = async (
  keyword: any,
  page: number,
  perPage: number
) => {
  const classrooms = await DonateOrderModel.find(keyword)
    .sort({ created_at: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage);
  return classrooms;
};

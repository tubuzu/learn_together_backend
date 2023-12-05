import { CreateRechargeOrderParams } from "../interfaces/rechargeOrder.interface.js";
import { RechargeOrderModel } from "../models/rechargeOrder.model.js";

export const createTransaction = async (
  request: CreateRechargeOrderParams
) => {
  return await RechargeOrderModel.create(request);
};

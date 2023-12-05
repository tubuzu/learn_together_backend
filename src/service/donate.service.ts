import { CreateDonateOrderParams } from "../interfaces/donateOrder.interface.js";
import { DonateOrderModel } from "../models/donateOrder.model.js";

export const createDonateOrder = async (request: CreateDonateOrderParams) => {
  return await DonateOrderModel.create(request);
};

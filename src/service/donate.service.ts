import { CreateDonateOrderParams } from "src/interfaces/donateOrder.interface.js";
import { DonateOrderModel } from "src/models/donateOrder.model.js";

export const createDonateOrder = async (request: CreateDonateOrderParams) => {
  return await DonateOrderModel.create(request);
};

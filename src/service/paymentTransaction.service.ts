import { CreatePaymentTransactionParams } from "../interfaces/paymentTransaction.interface.js";
import { PaymentTransactionModel } from "../models/paymentTransaction.model.js";

export const createTransaction = async (
  request: CreatePaymentTransactionParams
) => {
  return await PaymentTransactionModel.create(request);
};

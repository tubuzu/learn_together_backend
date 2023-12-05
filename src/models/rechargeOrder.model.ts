import mongoose, { Document } from "mongoose";
import { PaymentTransactionState } from "../utils/const.js";

const rechargeOrderSchema =
  new mongoose.Schema<RechargeOrderDocument>(
    {
      package: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CoinPackage",
        required: true,
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      orderId: { type: String, required: true },
      responseCode: { type: String },
      state: {
        type: String,
        enum: Object.values(PaymentTransactionState),
        default: PaymentTransactionState.PENDING,
      },

      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
  );

rechargeOrderSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

export const RechargeOrderModel = mongoose.model(
  "RechargeOrder",
  rechargeOrderSchema
);

export interface RechargeOrderDocument extends Document {
  amountOfCoin: number;
  priceInVND: number;
  description: string;
  discount: number;

  isDeleted: boolean;
  deletedAt?: Date;
}

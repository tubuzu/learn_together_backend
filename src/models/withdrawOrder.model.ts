import mongoose, { Document } from "mongoose";
import { PaymentTransactionState } from "../utils/const.js";

const withdrawOrderSchema = new mongoose.Schema<WithdrawOrderDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amountOfCoin: { type: Number, required: true },
    bankName: { type: String, required: true },
    bankAccountCode: { type: String, required: true },
    bankAccountName: { type: String, required: true },
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

withdrawOrderSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

export const WithdrawOrderModel = mongoose.model(
  "WithdrawOrder",
  withdrawOrderSchema
);

export interface WithdrawOrderDocument extends Document {
  user: string;
  amountOfCoin: number;
  bankName: string;
  bankAccountCode: string;
  bankAccountName: string;
  state: string;

  isDeleted: boolean;
  deletedAt?: Date;
}

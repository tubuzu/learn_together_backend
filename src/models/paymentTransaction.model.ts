import mongoose, { Document } from "mongoose";
import { PaymentTransactionState } from "../utils/const.js";

const paymentTransactionSchema =
  new mongoose.Schema<PaymentTransactionDocument>(
    {
      package: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
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

paymentTransactionSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

export const PaymentTransactionModel = mongoose.model(
  "PaymentTransaction",
  paymentTransactionSchema
);

export interface PaymentTransactionDocument extends Document {
  amountOfCoin: number;
  priceInVND: number;
  description: string;
  discount: number;

  isDeleted: boolean;
  deletedAt?: Date;

  matchPassword: (pw: string) => Promise<boolean>;
  createAccessToken: (sessionId: string) => string;
  createRefreshToken: (sessionId: string) => string;
}

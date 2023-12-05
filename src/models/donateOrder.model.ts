import mongoose, { Document } from "mongoose";
import { PaymentTransactionState } from "../utils/const.js";

const donateOrderSchema = new mongoose.Schema<DonateOrderDocument>(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amountOfCoin: { type: Number, required: true },
    otpCode: { type: String, required: true },
    lastOtpUpdateTime: { type: Date, default: Date.now() },
    otpRequestLeft: { type: Number, default: 3 },
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

donateOrderSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

export const DonateOrderModel = mongoose.model(
  "DonateOrder",
  donateOrderSchema
);

donateOrderSchema.pre("save", async function (next) {
  let order = this as DonateOrderDocument;

  if (!order.isModified("otpCode")) {
    return next();
  }

  order.lastOtpUpdateTime = new Date();

  return next();
});

export interface DonateOrderDocument extends Document {
  sender: string;
  receiver: string;
  amountOfCoin: number;
  otpCode: string;
  lastOtpUpdateTime: Date;
  otpRequestLeft: number;
  state: string;

  isDeleted: boolean;
  deletedAt?: Date;
}

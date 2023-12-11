import mongoose, { Document } from "mongoose";

const coinPackageSchema = new mongoose.Schema<CoinPackageDocument>(
  {
    amountOfCoin: { type: Number, required: true },
    priceInVND: { type: Number, required: true },
    description: { type: String, default: null },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount must be at least 0, got {VALUE}"],
      max: [100, "Discount must be at most 100, got {VALUE}"],
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

coinPackageSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

export const CoinPackageModel = mongoose.model(
  "CoinPackage",
  coinPackageSchema
);

export interface CoinPackageDocument extends Document {
  amountOfCoin: number;
  priceInVND: number;
  description: string;
  discount: number;

  isDeleted: boolean;
  deletedAt?: Date;
}

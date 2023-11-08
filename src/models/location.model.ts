import mongoose, { Document } from "mongoose";

const locationSchema = new mongoose.Schema<LocationDocument>(
  {
    locationName: { type: String, required: true },
    longtitude: { type: Number, required: true },
    latitude: { type: Number, required: true },
    address: { type: String, required: true },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const LocationModel = mongoose.model("Location", locationSchema);

export interface LocationDocument extends Document {
  locationName: string;
  longtitude: number;
  latitude: number;
  address: string;

  isDeleted: boolean;
  deletedAt: Date;
}

locationSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

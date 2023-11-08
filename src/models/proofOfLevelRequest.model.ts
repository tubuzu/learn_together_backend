import mongoose, { Document } from "mongoose";
import { RequestState } from "../utils/const.js";

const proofOfLevelRequestSchema =
  new mongoose.Schema<ProofOfLevelRequestDocument>(
    {
      subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true,
      },
      documentURLs: { type: [String], required: true },
      state: {
        type: String,
        enum: Object.values(RequestState),
        default: RequestState.WAITING,
      },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      noteOfSender: { type: String },
      reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      noteOfReviewer: { type: String },

      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date },
    },
    { timestamps: true }
  );

export const ProofOfLevelRequestModel = mongoose.model(
  "ProofOfLevelRequest",
  proofOfLevelRequestSchema
);

export interface ProofOfLevelRequestDocument extends Document {
  subject: mongoose.Schema.Types.ObjectId;
  documentURLs: string[];
  state: string;
  sender: mongoose.Schema.Types.ObjectId;
  noteOfSender?: string;
  reviewer?: mongoose.Schema.Types.ObjectId;
  noteOfReviewer?: string;

  isDeleted: boolean;
  deletedAt: Date;
}

proofOfLevelRequestSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

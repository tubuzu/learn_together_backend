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
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      noteOfSender: { type: String, default: null },
      reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      noteOfReviewer: { type: String, default: null },

      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date, default: null },
    },
    { timestamps: true }
  );

export const ProofOfLevelRequestModel = mongoose.model(
  "ProofOfLevelRequest",
  proofOfLevelRequestSchema
);

export interface ProofOfLevelRequestDocument extends Document {
  subject: string;
  documentURLs: string[];
  state: string;
  sender: string;
  noteOfSender?: string;
  reviewer?: string;
  noteOfReviewer?: string;

  isDeleted: boolean;
  deletedAt: Date;
}

proofOfLevelRequestSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

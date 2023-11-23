import mongoose, { Document } from "mongoose";

const proofOfLevelSchema = new mongoose.Schema<ProofOfLevelDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    documentURLs: { type: [String], required: true },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProofOfLevelRequest",
      required: true,
    },
    noteOfSender: { type: String, default: null },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const ProofOfLevelModel = mongoose.model(
  "ProofOfLevel",
  proofOfLevelSchema
);

export interface ProofOfLevelDocument extends Document {
  subject: string;
  documentURLs: string[];
  request: string;
  noteOfSender?: string;

  isDeleted: boolean;
  deletedAt: Date;
}

proofOfLevelSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

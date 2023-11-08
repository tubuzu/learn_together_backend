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
    noteOfSender: { type: String },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const ProofOfLevelModel = mongoose.model(
  "ProofOfLevel",
  proofOfLevelSchema
);

export interface ProofOfLevelDocument extends Document {
  subject: mongoose.Schema.Types.ObjectId;
  documentURLs: string[];
  request: mongoose.Schema.Types.ObjectId;
  noteOfSender?: string;

  isDeleted: boolean;
  deletedAt: Date;
}

proofOfLevelSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

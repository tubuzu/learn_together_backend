import mongoose, { Document } from "mongoose";
import { RequestState } from "../utils/const.js";

const participantRequestSchema =
  new mongoose.Schema<ParticipantRequestDocument>(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true,
      },
      noteOfSender: { type: String },
      state: {
        type: String,
        enum: Object.values(RequestState),
        default: RequestState.WAITING,
      },
      reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      noteOfReviewer: { type: String },

      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date },
    },
    { timestamps: true }
  );

export const ParticipantRequestModel = mongoose.model(
  "ParticipantRequest",
  participantRequestSchema
);

export interface ParticipantRequestDocument extends Document {
  user: string;
  room: string;
  noteOfSender: string;
  state: string;
  reviewer: string;
  noteOfReviewer: string;

  isDeleted: boolean;
  deletedAt: Date;
}

participantRequestSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

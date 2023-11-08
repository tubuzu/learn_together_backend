import mongoose, { Document } from "mongoose";
import { ParticipantRole } from "../utils/const.js";

const participantSchema = new mongoose.Schema<ParticipantDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    role: {
      type: String,
      enum: Object.values(ParticipantRole),
      default: ParticipantRole.MEMBER,
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const ParticipantModel = mongoose.model(
  "Participant",
  participantSchema
);

export interface ParticipantDocument extends Document {
  user: string;
  room: string;
  role: string;

  isDeleted: boolean;
  deletedAt: Date;
}

participantSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

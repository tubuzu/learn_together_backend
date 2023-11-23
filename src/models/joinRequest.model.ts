import mongoose, { Document } from "mongoose";
import { ClassroomMemberRole, RequestState } from "../utils/const.js";

const joinRequestSchema = new mongoose.Schema<JoinRequestDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(ClassroomMemberRole),
      default: ClassroomMemberRole.STUDENT,
    },
    state: {
      type: String,
      enum: Object.values(RequestState),
      default: RequestState.WAITING,
    },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const JoinRequestModel = mongoose.model(
  "JoinRequest",
  joinRequestSchema
);

export interface JoinRequestDocument extends Document {
  user: string;
  classroom: string;
  state: string;
  reviewer: string;

  isDeleted: boolean;
  deletedAt: Date;
}

joinRequestSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

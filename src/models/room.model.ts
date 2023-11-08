import mongoose, { Document } from "mongoose";
import { RoomState } from "../utils/const.js";

const roomSchema = new mongoose.Schema<RoomDocument>(
  {
    roomName: { type: String, required: true },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hostUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    tutor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Participant" },
    ],
    maxParticipants: { type: Number, required: true },
    registers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    roomState: {
      type: String,
      enum: Object.values(RoomState),
      default: RoomState.WAITING,
    },

    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    tuitionFee: { type: Number },
    description: { type: String },
    courseDocumentList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseDocument",
      },
    ],

    isPublicRoom: { type: Boolean, default: false },
    ownerApprovalRequired: { type: Boolean, default: false },
    roomKey: { type: String },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const RoomModel = mongoose.model("Room", roomSchema);

export interface RoomDocument extends Document {
  roomName: string;
  subject: mongoose.Schema.Types.ObjectId;
  creator: mongoose.Schema.Types.ObjectId;
  hostUser?: mongoose.Schema.Types.ObjectId;

  tutor?: mongoose.Schema.Types.ObjectId;
  participants: mongoose.Schema.Types.ObjectId[];
  maxParticipants: number;
  registers: mongoose.Schema.Types.ObjectId[];
  roomState: string;

  location: mongoose.Schema.Types.ObjectId;
  startTime: Date;
  endTime: Date;
  tuitionFee: number;
  description: string;
  courseDocumentList: mongoose.Schema.Types.ObjectId[];

  isPublicRoom: boolean;
  ownerApprovalRequired: boolean;
  roomKey: string;

  isDeleted: boolean;
  deletedAt: Date;
}

roomSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

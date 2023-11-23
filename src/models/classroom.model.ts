import mongoose, { Document } from "mongoose";
import { ClassroomState } from "../utils/const.js";

const classroomSchema = new mongoose.Schema<ClassroomDocument>(
  {
    classroomName: { type: String, required: true },
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
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    tutor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    currentParticipants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    historyParticipants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    maxParticipants: {
      type: Number,
      required: true,
      min: [2, "Min participants must be at least 2"], // Set your minimum constraint
      max: [30, "Max participants cannot exceed 30"],
    },
    state: {
      type: String,
      enum: Object.values(ClassroomState),
      default: ClassroomState.WAITING,
    },
    available: { type: Boolean, default: true },
    terminated: { type: Boolean, default: false },
    joinRequests: [
      { type: mongoose.Schema.Types.ObjectId, ref: "JoinRequest" },
    ],

    // longitude: { type: String, required: true },
    // latitude: { type: String, required: true },
    location: {
      type: {
        type: String,
        default: "Point",
      },
      coordinates: [Number], // [22.2475, 14.2547]  [longitude, latitude]
    },
    address: { type: String, required: true },
    description: { type: String, default: null },

    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },

    isPublic: { type: Boolean, default: false },
    ownerApprovalRequired: { type: Boolean, default: false },
    secretKey: { type: String },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);
classroomSchema.index({ location: "2dsphere" });

export const ClassroomModel = mongoose.model("Classroom", classroomSchema);

export interface ClassroomDocument extends Document {
  classroomName: string;
  subject: string;
  creator: string;
  owner: string;

  tutor?: string;
  currentParticipants: string[];
  maxParticipants: number;
  state: string;
  available: boolean;
  terminated: boolean;

  // longitude: string;
  // latitude: string;
  location: {
    type: string;
    coordinates: [number];
  };
  address: string;
  description: string;

  startTime: Date;
  endTime: Date;

  isPublic: boolean;
  ownerApprovalRequired: boolean;
  secretKey: string;

  isDeleted: boolean;
  deletedAt: Date;
}

classroomSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

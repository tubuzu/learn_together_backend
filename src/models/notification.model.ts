import mongoose, { Document } from "mongoose";
import { NotificationCode } from "../utils/const.js";

const notificationSchema = new mongoose.Schema<NotificationDocument>(
  {
    originUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hasRead: { type: Boolean, default: false },
    notificationCode: {
      type: String,
      enum: Object.values(NotificationCode),
      required: true,
    },
    extraData: { type: Object },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const NotificationModel = mongoose.model(
  "Notification",
  notificationSchema
);

export interface NotificationDocument extends Document {
  originUser: string;
  targetUser: string;
  notificationCode: string;
  hasRead: boolean;
  extraData: object;

  isDeleted: boolean;
  deletedAt: Date;
}

notificationSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

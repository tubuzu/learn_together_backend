import mongoose, { Document } from "mongoose";
import { NotificationType } from "../utils/const.js";

const notificationSchema = new mongoose.Schema<NotificationDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    notificationType: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.GENERAL,
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const NotificationModel = mongoose.model(
  "Notification",
  notificationSchema
);

export interface NotificationDocument extends Document {
  user: mongoose.Schema.Types.ObjectId;
  content: string;
  isRead: boolean;
  notificationType: string;

  isDeleted: boolean;
  deletedAt: Date;
}

notificationSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

import mongoose, { Document } from "mongoose";

const classroomMessageSchema = new mongoose.Schema<ClassroomMessageDocument>(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
    attachments: { type: [String], required: true },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

classroomMessageSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

export const ClassroomMessageModel = mongoose.model(
  "ClassroomMessage",
  classroomMessageSchema
);

export interface ClassroomMessageDocument extends Document {
  sender: string;
  content: string;
  classroom: string;
  attachments: string[];

  isDeleted: boolean;
  deletedAt?: Date;
}

import mongoose, { Document } from "mongoose";

const courseDocumentSchema = new mongoose.Schema<CourseDocumentDocument>(
  {
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    relatedSubjects: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    ],
    documentURLs: { type: [String], required: true },
    noteOfUploader: { type: String },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseDocumentRequest",
      required: true,
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const CourseDocumentModel = mongoose.model(
  "CourseDocument",
  courseDocumentSchema
);

courseDocumentSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

export interface CourseDocumentDocument extends Document {
  uploader: string;
  relatedSubjects: string[];
  documentURLs: string[];
  noteOfUploader?: string;
  request: string;

  isDeleted: boolean;
  deletedAt: Date;
}
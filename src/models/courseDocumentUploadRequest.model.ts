import mongoose, { Document } from "mongoose";
import { RequestState } from "../utils/const.js";

const courseDocumentRequestSchema =
  new mongoose.Schema<CourseDocumentRequestDocument>(
    {
      uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      relatedSubjects: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },
      ],
      documentURLs: { type: [String], required: true },
      noteOfUploader: { type: String },
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

export const CourseDocumentRequestModel = mongoose.model(
  "CourseDocumentRequest",
  courseDocumentRequestSchema
);

export interface CourseDocumentRequestDocument extends Document {
  uploader: string;
  relatedSubjects: string[];
  documentURLs: string[];
  noteOfUploader?: string;
  state: string;
  reviewer?: string;
  noteOfReviewer?: string;

  isDeleted: boolean;
  deletedAt: Date;
}

courseDocumentRequestSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

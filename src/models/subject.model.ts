import mongoose, { Document } from "mongoose";

const subjectSchema = new mongoose.Schema<SubjectDocument>(
  {
    subjectName: { type: String, required: true },
    numberOfCredits: { type: Number, required: true },
    isElectiveCourse: { type: Boolean, required: true },
    isDepartmentCourse: { type: Boolean, required: true },

    description: { type: String, default: null },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const SubjectModel = mongoose.model("Subject", subjectSchema);

export interface SubjectDocument extends Document {
  subjectName: string;
  numberOfCredits: number;
  isElectiveCourse: boolean;
  isDepartmentCourse: boolean;

  description: string;

  isDeleted: boolean;
  deletedAt?: Date;
}

subjectSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};
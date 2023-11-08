import mongoose, { Document } from "mongoose";

const studentSchema = new mongoose.Schema<StudentDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    studentCode: { type: String, trim: true },
    activityClass: { type: String },
    schoolName: { type: String },
    studyHardPoint: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const StudentModel = mongoose.model<StudentDocument>(
  "Student",
  studentSchema
);

studentSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

export interface StudentDocument extends Document {
  user: mongoose.Types.ObjectId;

  studentCode: string;
  activityClass: string;
  schoolName: string;
  studyHardPoint?: number;

  isDeleted: boolean;
  deletedAt?: Date;
}

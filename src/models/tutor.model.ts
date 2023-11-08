import mongoose, { Document } from "mongoose";

const tutorSchema = new mongoose.Schema<TutorDocument>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    proofsOfLevel: [
      { type: mongoose.Schema.Types.ObjectId, ref: "ProofOfLevel" },
    ],

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const TutorModel = mongoose.model("Tutor", tutorSchema);

export interface TutorDocument extends Document {
  user: mongoose.Schema.Types.ObjectId;

  proofsOfLevel?: mongoose.Schema.Types.ObjectId[];

  isDeleted: boolean;
  deletedAt?: Date;
}

tutorSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

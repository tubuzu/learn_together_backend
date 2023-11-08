import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import { UserType } from "../utils/const.js";

const adminSchema = new mongoose.Schema<AdminDocument>(
  {
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 5,
      select: false,
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

adminSchema.methods.createAccessToken = function (sessionId: string) {
  return jwt.sign(
    { user: this._id, userType: UserType.ADMIN, session: sessionId },
    process.env.ACCESS_TOKEN_SECRET as Secret,
    {
      expiresIn: process.env.ACCESS_LIFETIME,
    }
  );
};

adminSchema.methods.createRefreshToken = function (sessionId: string) {
  return jwt.sign(
    { user: this._id, userType: UserType.ADMIN, session: sessionId },
    process.env.REFRESH_TOKEN_SECRET as Secret,
    {
      expiresIn: process.env.REFRESH_LIFETIME,
    }
  );
};

adminSchema.pre("save", async function (next) {
  if (!this.isModified) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

adminSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

export const AdminModel = mongoose.model("Admin", adminSchema);

export interface AdminDocument extends Document {
  email: string;
  password: string;

  isDeleted: boolean;
  deletedAt?: Date;

  matchPassword: (pw: string) => Promise<boolean>;
  createAccessToken: (sessionId: string) => string;
  createRefreshToken: (sessionId: string) => string;
}

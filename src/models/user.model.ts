import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import { GenderType, UserType } from "../utils/const.js";

const userSchema = new mongoose.Schema<UserDocument>(
  {
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    firstName: {
      type: String,
      required: [true, "Please provide a first name"],
      maxLength: 20,
    },
    lastName: {
      type: String,
      required: [true, "Please provide a last name"],
      maxLength: 20,
    },
    address: {
      type: String,
    },
    phoneNumber: {
      type: String,
      match: [
        /^[9]+[7-8]+\d{8}$/,
        "Please provide a valid phone number: eg 9800000000",
      ],
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: {
        values: Object.values(GenderType),
        default: GenderType.MALE,
        message: "{VALUE} is not supported",
      },
    },
    avatar: { type: String, default: "", trim: true },
    background: { type: String, default: "", trim: true },
    about: { type: String },

    //student
    studentCode: { type: String, trim: true },
    activityClass: { type: String },
    schoolName: { type: String },
    studyHardPoint: { type: Number, default: 0 },

    // notifications: {
    //   type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notification" }],
    //   select: false,
    // },

    passwordResetToken: {
      type: String,
      select: false,
    },
    accountStatus: {
      type: Boolean,
      default: false,
      select: false,
    },
    accountVerificationToken: {
      type: String,
      select: false,
    },

    password: {
      type: String,
      // required: [true, "Please provide a password"],
      minlength: 5,
      select: false,
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.createAccessToken = function (sessionId: string) {
  return jwt.sign(
    { user: this._id, userType: UserType.USER, session: sessionId },
    process.env.ACCESS_TOKEN_SECRET as Secret,
    {
      expiresIn: process.env.ACCESS_LIFETIME,
    }
  );
};

userSchema.methods.createRefreshToken = function (sessionId: string) {
  return jwt.sign(
    { user: this._id, userType: UserType.USER, session: sessionId },
    process.env.REFRESH_TOKEN_SECRET as Secret,
    {
      expiresIn: process.env.REFRESH_LIFETIME,
    }
  );
};

userSchema.pre("save", async function (next) {
  let user = this as UserDocument;

  if (!user.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);

  user.password = await bcrypt.hashSync(user.password, salt);

  return next();
});

userSchema.methods.delete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

export const UserModel = mongoose.model("User", userSchema);

export interface UserDocument extends Document {
  email: string;
  password: string;

  firstName: string;
  lastName: string;
  address: string;
  phoneNumber: string;
  dateOfBirth: Date;
  gender: string;
  avatar?: string;
  background?: string;
  about?: string;

  //student
  studentCode: string;
  activityClass: string;
  schoolName: string;
  studyHardPoint?: number;

  // notifications?: string[];

  passwordResetToken?: string;
  accountStatus: boolean;
  accountVerificationToken?: string;

  isDeleted: boolean;
  deletedAt?: Date;

  matchPassword: (pw: string) => Promise<boolean>;
  createAccessToken: (sessionId: string) => string;
  createRefreshToken: (sessionId: string) => string;
}

import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import { GenderType, UserType } from "../utils/const.js";
import { appSettings } from "../settings/app.setting.js";

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
      default: null,
    },
    phoneNumber: {
      type: String,
      match: [
        /^[9]+[7-8]+\d{8}$/,
        "Please provide a valid phone number: eg 9800000000",
      ],
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: {
        values: Object.values(GenderType),
        default: GenderType.MALE,
        message: "{VALUE} is not supported",
      },
    },
    avatar: { type: String, default: null, trim: true },
    background: { type: String, default: null, trim: true },
    about: { type: String, default: null },

    //student
    studentCode: { type: String, trim: true },
    activityClass: { type: String, default: null },
    schoolName: { type: String, default: null },
    studyHardPoint: { type: Number, default: 0 },

    currentCredit: { type: Number, default: 0, select: false },

    // notifications: {
    //   type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Notification" }],
    //   select: false,
    // },

    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },
    accountStatus: {
      type: Boolean,
      default: false,
      select: false,
    },
    accountVerificationToken: {
      type: String,
      default: null,
      select: false,
    },

    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 5,
      select: false,
    },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.createAccessToken = function (sessionId: string) {
  return jwt.sign(
    { user: this._id, userType: UserType.USER, session: sessionId },
    appSettings.ACCESS_TOKEN_SECRET as Secret,
    {
      expiresIn: appSettings.ACCESS_LIFETIME,
    }
  );
};

userSchema.methods.createRefreshToken = function (sessionId: string) {
  return jwt.sign(
    { user: this._id, userType: UserType.USER, session: sessionId },
    appSettings.REFRESH_TOKEN_SECRET as Secret,
    {
      expiresIn: appSettings.REFRESH_LIFETIME,
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

  currentCredit: number;

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

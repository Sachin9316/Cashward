import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  coins: number;
  referralCode: string;
  referredBy?: string;
  otp?: string;
  otpExpiry?: Date;
  lastDailyBonus?: Date;
  lastSpin?: Date;
  lastAdWatch?: Date;
  dailyAdCount: number;
  adResetDate?: Date;
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  coins: { type: Number, default: 0 },
  referralCode: { type: String, required: true, unique: true },
  referredBy: { type: String, default: null },
  otp: { type: String },
  otpExpiry: { type: Date },
  lastDailyBonus: { type: Date },
  lastSpin: { type: Date },
  lastAdWatch: { type: Date },
  dailyAdCount: { type: Number, default: 0 },
  adResetDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>('User', UserSchema);

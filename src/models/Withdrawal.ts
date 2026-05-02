import mongoose, { Schema, Document } from 'mongoose';

export interface IWithdrawal extends Document {
  userId: mongoose.Types.ObjectId;
  upiId: string;
  amount: number; // In INR
  coinsDeducted: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  upiId: { type: String, required: true },
  amount: { type: Number, required: true },
  coinsDeducted: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema);

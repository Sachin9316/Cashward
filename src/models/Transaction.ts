import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'earn' | 'withdraw';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  source: string; // e.g., 'ad', 'offerwall', 'referral', 'withdrawal'
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['earn', 'withdraw'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' },
  source: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);

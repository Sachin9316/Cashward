import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description: string;
  coins: number;
  icon: string;
  type: 'game' | 'survey' | 'app' | 'ad';
  link?: string;
  isActive: boolean;
  createdAt: Date;
}

const TaskSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  coins: { type: Number, required: true },
  icon: { type: String, default: '🎮' },
  type: { type: String, enum: ['game', 'survey', 'app', 'ad'], default: 'game' },
  link: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ITask>('Task', TaskSchema);

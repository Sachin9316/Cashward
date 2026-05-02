import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cashward';
    console.log('Connecting to MongoDB with URI:', mongoURI.substring(0, 25) + '...');
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

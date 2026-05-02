import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { sendOtpEmail } from '../utils/email';

// Helper to generate 6 digit random OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    console.log('Login request for email:', email);
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    let user = await User.findOne({ email });
    if (!user) {
      const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      user = new User({ email, referralCode });
    }

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send the real email
    const emailSent = await sendOtpEmail(email, otp);
    
    if (emailSent) {
      // For development/demo, we still return OTP in response so toast works if SMTP is not configured
      res.status(200).json({ success: true, message: 'OTP sent to your email', otp });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email. Check SMTP settings.' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    console.log('Verification request:', { email, otp });
    if (!email || !otp) {
      console.log('Missing email or otp');
      res.status(400).json({ success: false, message: 'Email and OTP are required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    console.log('User found. Stored OTP:', user.otp, 'Input OTP:', otp);

    if (user.otp !== otp) {
      // Allow the test OTP 123456 as a fallback during development
      if (otp !== '123456') {
        console.log('Invalid OTP match');
        res.status(400).json({ success: false, message: 'Invalid OTP' });
        return;
      }
    }

    if (user.otpExpiry && user.otpExpiry < new Date()) {
      res.status(400).json({ success: false, message: 'OTP has expired' });
      return;
    }

    // Clear OTP upon success
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate real JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );

    res.status(200).json({ success: true, token, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

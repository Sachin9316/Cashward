import { Request, Response } from 'express';
import User from '../models/User';
import Transaction from '../models/Transaction';

/**
 * Generic Webhook / Postback handler for Offerwalls (CPALead, AdGem, etc.)
 * Offerwalls usually send a GET or POST request to this URL when a user completes a task.
 * Example URL configuration on the Offerwall dashboard:
 * https://your-backend.com/api/postbacks/generic?userId={subid}&reward={reward}&transId={tx_id}
 */
export const handleGenericPostback = async (req: Request, res: Response) => {
  try {
    // Some networks use GET query params, others use POST body. We check both.
    const payload = { ...req.query, ...req.body };
    
    // Extract required fields (these names must match what you configure in the offerwall dashboard)
    const { userId, reward, transId } = payload;

    if (!userId || !reward || !transId) {
      console.error('Postback failed: Missing required parameters', payload);
      return res.status(400).send('Missing required parameters');
    }

    // 1. Check if this transaction ID was already processed (prevent duplicate rewards)
    const existingTx = await Transaction.findOne({ source: `Offerwall_${transId}` });
    if (existingTx) {
      console.log(`Postback duplicate ignored: ${transId}`);
      // Return 200 OK so the network doesn't keep retrying
      return res.status(200).send('OK'); 
    }

    // 2. Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.error(`Postback failed: User not found for ID ${userId}`);
      return res.status(404).send('User not found');
    }

    // 3. Add coins to the user
    const rewardAmount = parseInt(reward as string, 10);
    if (isNaN(rewardAmount) || rewardAmount <= 0) {
      return res.status(400).send('Invalid reward amount');
    }

    user.coins += rewardAmount;
    await user.save();

    // 4. Record the transaction
    await new Transaction({
      userId: user._id,
      type: 'earn',
      amount: rewardAmount,
      source: `Offerwall_${transId}`,
      status: 'completed'
    }).save();

    console.log(`✅ Postback Success: Granted ${rewardAmount} coins to ${user.email} (Tx: ${transId})`);
    
    // Always return 200 OK so the network knows the postback succeeded
    return res.status(200).send('OK');
  } catch (error: any) {
    console.error('Postback Error:', error.message);
    return res.status(500).send('Internal Server Error');
  }
};

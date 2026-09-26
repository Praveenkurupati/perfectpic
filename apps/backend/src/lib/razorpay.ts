import Razorpay from "razorpay";

// We create an instance conditionally to allow dev without keys
let instance: any = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  // Mock instance for dev
  instance = {
    orders: {
      create: async (opts: any) => ({
        id: "mock_order_id",
        entity: "order",
        amount: opts.amount,
        currency: opts.currency,
        receipt: opts.receipt,
        status: "created"
      })
    }
  };
}

export default instance;

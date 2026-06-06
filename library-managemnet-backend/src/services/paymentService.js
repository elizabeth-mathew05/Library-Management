import Stripe from 'stripe';

const createStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const createPaymentIntent = async ({ amount, currency = 'usd', metadata = {} }) => {
  const stripe = createStripeClient();

  if (!stripe) {
    return {
      id: 'mock_payment_intent',
      client_secret: 'mock_client_secret'
    };
  }

  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    metadata
  });
};

export { createPaymentIntent };

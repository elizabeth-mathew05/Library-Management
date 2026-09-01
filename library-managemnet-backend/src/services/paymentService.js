import Stripe from 'stripe';

const createStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY || '';

  if (!secretKey || /replace|changeme|your[-_]?key/i.test(secretKey)) {
    return null;
  }

  return new Stripe(secretKey);
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

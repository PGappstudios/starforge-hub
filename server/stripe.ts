import Stripe from 'stripe';

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_your_secret_key_here';

if (!stripeSecretKey) {
  console.warn('Warning: STRIPE_SECRET_KEY not set. Stripe functionality will be limited.');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

// Credit packages configuration - using custom amounts instead of Price IDs
export const CREDIT_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    credits: 100,
    bonus: 0,
    price: 4.99,
    description: 'Perfect for casual players',
    popular: false,
  },
  gamer: {
    id: 'gamer', 
    name: 'Gamer Pack',
    credits: 250,
    bonus: 50,
    price: 9.99,
    description: 'Best value for dedicated gamers',
    popular: true,
  },
  champion: {
    id: 'champion',
    name: 'Champion Pack',
    credits: 500,
    bonus: 100,
    price: 19.99,
    description: 'For the ultimate gaming experience',
    popular: false,
  },
} as const;

export type PackageId = keyof typeof CREDIT_PACKAGES;

// Helper function to validate package
export const getPackageById = (packageId: string) => {
  if (packageId in CREDIT_PACKAGES) {
    return CREDIT_PACKAGES[packageId as PackageId];
  }
  return null;
};

// Helper function to calculate total credits
export const getTotalCredits = (packageId: string) => {
  const pkg = getPackageById(packageId);
  if (!pkg) return 0;
  return pkg.credits + pkg.bonus;
};

// Stripe webhook endpoint signature verification
export const constructEvent = (body: string | Buffer, signature: string) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!endpointSecret) {
    throw new Error('Stripe webhook secret not configured');
  }
  
  return stripe.webhooks.constructEvent(body, signature, endpointSecret);
};
import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/contexts/CreditsContext';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  bonus: number;
  price: number;
  popular?: boolean;
}

interface StripeCheckoutProps {
  package: CreditPackage;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CheckoutForm = ({ package: pkg, onSuccess, onCancel }: StripeCheckoutProps) => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { addCredits } = useCredits();

  const handlePayment = async () => {
    if (!user) {
      setError('Please log in to purchase credits');
      return;
    }

    setLoading(true);
    setPaymentStatus('processing');
    setError(null);

    try {
      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          packageId: pkg.id,
          amount: Math.round(pkg.price * 100), // Convert to cents
          credits: pkg.credits + pkg.bonus,
          currency: 'usd',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Payment failed');
      }

      if (data.requiresAction) {
        // For now, we'll handle this as a success for test mode
        // In production, you'd handle 3D Secure here
        setPaymentStatus('succeeded');
        
        // Add credits immediately for test mode
        const totalCredits = pkg.credits + pkg.bonus;
        await addCredits(totalCredits, `Purchased ${pkg.name} via Stripe`);
        
        onSuccess?.();
      } else if (data.success) {
        setPaymentStatus('succeeded');
        onSuccess?.();
      } else {
        throw new Error('Payment processing failed');
      }

    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  if (paymentStatus === 'succeeded') {
    return (
      <Card className="bg-green-500/10 border-green-500/20">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-futuristic text-white mb-2">Payment Successful!</h3>
          <p className="text-green-400 mb-4">
            {pkg.credits + pkg.bonus} credits have been added to your account.
          </p>
          <Button onClick={onSuccess} className="bg-green-600 hover:bg-green-700">
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <Card className="bg-red-500/10 border-red-500/20">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-futuristic text-white mb-2">Payment Failed</h3>
          <p className="text-red-400 mb-4">{error}</p>
          <div className="space-x-3">
            <Button
              onClick={() => {
                setPaymentStatus('idle');
                setError(null);
              }}
              variant="outline"
            >
              Try Again
            </Button>
            <Button onClick={onCancel} variant="ghost">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/20 backdrop-blur-md border border-white/20">
      <CardContent className="p-6">
        {/* Package Details */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-futuristic text-white mb-2">{pkg.name}</h3>
          {pkg.popular && (
            <Badge className="bg-primary text-primary-foreground mb-4">
              MOST POPULAR
            </Badge>
          )}
          
          <div className="text-4xl font-futuristic font-bold text-primary mb-2">
            {pkg.credits}
            {pkg.bonus > 0 && (
              <span className="text-lg text-green-400 ml-2">+{pkg.bonus} Bonus</span>
            )}
          </div>
          <div className="text-sm text-white/70 mb-4">
            Total: {pkg.credits + pkg.bonus} Credits
          </div>
          
          <div className="text-3xl font-futuristic font-bold text-white">
            ${pkg.price.toFixed(2)}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Payment Button */}
        <div className="space-y-4">
          <Button
            onClick={handlePayment}
            disabled={loading || paymentStatus === 'processing'}
            className="w-full bg-primary hover:bg-primary/80 font-futuristic"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Purchase for ${pkg.price.toFixed(2)}
              </>
            )}
          </Button>
          
          <Button
            onClick={onCancel}
            variant="ghost"
            className="w-full"
            disabled={loading}
          >
            Cancel
          </Button>
        </div>

        {/* Test Mode Notice */}
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">
              Test Mode: No real payments will be processed
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const StripeCheckout = ({ package: pkg, onSuccess, onCancel }: StripeCheckoutProps) => {
  const [stripePromise] = useState(() => getStripe());

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm package={pkg} onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
};

export default StripeCheckout;
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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

export default function StripeCheckout({ package: pkg, onSuccess, onCancel }: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();

  const handleCheckout = async () => {
    if (!user) {
      setError('Please log in to purchase credits');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating checkout session for package:', pkg.id);
      
      // Create Stripe Checkout Session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          packageId: pkg.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error instanceof Error ? error.message : 'Payment failed');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {pkg.name}
              {pkg.popular && <Badge variant="secondary">Popular</Badge>}
            </h3>
            <p className="text-sm text-muted-foreground">
              {pkg.credits} credits{pkg.bonus > 0 && ` + ${pkg.bonus} bonus`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">${pkg.price}</p>
            <p className="text-sm text-muted-foreground">USD</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {!user ? (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">Please log in to purchase credits</span>
          </div>
        ) : null}

        <Button 
          onClick={handleCheckout}
          disabled={loading || !user}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating checkout...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Buy Now
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground mt-3 text-center">
          Secure payment powered by Stripe
        </p>
      </CardContent>
    </Card>
  );
}
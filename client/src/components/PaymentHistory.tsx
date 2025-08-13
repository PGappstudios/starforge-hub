import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  Coins,
  RefreshCw
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  packageName: string;
  amount: number;
  credits: number;
  status: 'succeeded' | 'failed' | 'pending';
  date: string;
  stripePaymentId?: string;
}

export const PaymentHistory = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPaymentHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stripe/payment-history', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      } else {
        console.error('Failed to load payment history');
        // For now, show mock data in development
        setPayments([
          {
            id: '1',
            packageName: 'Gamer Pack',
            amount: 9.99,
            credits: 300,
            status: 'succeeded',
            date: new Date().toLocaleDateString(),
          },
          {
            id: '2', 
            packageName: 'Starter Pack',
            amount: 4.99,
            credits: 100,
            status: 'succeeded',
            date: new Date(Date.now() - 86400000).toLocaleDateString(),
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/20 backdrop-blur-md border border-white/20">
        <CardContent className="p-6 text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-white/70">Loading payment history...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/20 backdrop-blur-md border border-white/20">
      <CardHeader>
        <CardTitle className="font-futuristic text-xl flex items-center gap-3">
          <History className="w-5 h-5 text-primary" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/70 mb-2">No payment history</p>
            <p className="text-white/50 text-sm">Your purchases will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div 
                key={payment.id}
                className="flex items-center justify-between p-4 bg-black/10 rounded-lg border border-white/10 hover:bg-black/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    {getStatusIcon(payment.status)}
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium">{payment.packageName}</h4>
                    <p className="text-white/70 text-sm">{payment.date}</p>
                    {payment.stripePaymentId && (
                      <p className="text-white/50 text-xs">ID: {payment.stripePaymentId}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-white/70" />
                    <span className="text-white font-medium">${payment.amount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-primary" />
                    <span className="text-primary font-medium">{payment.credits} credits</span>
                  </div>
                  
                  <Badge className={`mt-2 text-xs ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t border-white/10">
              <Button
                onClick={loadPaymentHistory}
                variant="ghost"
                size="sm"
                className="w-full text-white/70 hover:text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh History
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentHistory;
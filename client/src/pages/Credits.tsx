import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Coins, 
  ShoppingCart, 
  Zap, 
  Star, 
  Crown, 
  Gift,
  History,
  AlertCircle,
  CheckCircle,
  CreditCard,
  X
} from "lucide-react";
import { useCredits } from "@/contexts/CreditsContext";
import StripeCheckout from "@/components/StripeCheckout";
import PaymentHistory from "@/components/PaymentHistory";

const Credits = () => {
  const { credits, transactions } = useCredits();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [packageError, setPackageError] = useState<string | null>(null);

  // Load available packages from backend with error handling
  useEffect(() => {
    const loadPackages = async () => {
      setLoadingPackages(true);
      setPackageError(null);
      
      try {
        const response = await fetch('/api/stripe/packages', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const packages = await response.json();
          setAvailablePackages(packages);
        } else {
          throw new Error(`Failed to load packages: ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to load packages:', error);
        setPackageError('Failed to load credit packages. Using fallback options.');
        
        // Use fallback packages
        setAvailablePackages([
          {
            id: "starter",
            name: "Starter Pack", 
            credits: 100,
            price: 4.99,
            bonus: 0,
            popular: false
          },
          {
            id: "gamer",
            name: "Gamer Pack",
            credits: 250,
            price: 9.99,
            bonus: 50,
            popular: true
          }
        ]);
      } finally {
        setLoadingPackages(false);
      }
    };

    loadPackages();
  }, []);

  const formatTransactionForDisplay = (transaction: any) => {
    return {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.type === 'earned' ? transaction.amount : -transaction.amount,
      cost: null,
      date: transaction.timestamp.toLocaleDateString(),
      game: transaction.description
    };
  };

  const recentTransactions = transactions.slice(0, 5).map(formatTransactionForDisplay);

  const handlePurchase = (packageId: string) => {
    setSelectedPackage(packageId);
    setShowCheckout(true);
  };

  const handlePaymentSuccess = () => {
    setShowCheckout(false);
    setSelectedPackage(null);
    // The credits are added by the Stripe component
  };

  const handlePaymentCancel = () => {
    setShowCheckout(false);
    setSelectedPackage(null);
  };

  const getSelectedPackage = () => {
    return availablePackages.find(pkg => pkg.id === selectedPackage);
  };

  return (
    <div className="min-h-screen cosmic-bg">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-futuristic font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent neon-text mb-4">
            COSMIC CREDITS
          </h1>
          <p className="text-xl text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] font-medium">
            Fuel your galactic adventures across the cosmos
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Current Credits & Info */}
            <div className="lg:col-span-1">
              {/* Current Balance */}
              <Card className="bg-black/20 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 hover:bg-black/30 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 mb-6">
                <CardHeader>
                  <CardTitle className="font-futuristic text-2xl flex items-center gap-3">
                    <Coins className="w-6 h-6 text-primary" />
                    Your Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-6xl font-futuristic font-bold text-primary mb-2">
                      {credits}
                    </div>
                    <p className="text-white/70 font-medium">Credits Available</p>
                  </div>
                </CardContent>
              </Card>

              {/* How Credits Work */}
              <Card className="bg-black/20 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 hover:bg-black/30 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
                <CardHeader>
                  <CardTitle className="font-futuristic text-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-secondary" />
                    How Credits Work
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">1 Credit = 1 Game Session</p>
                      <p className="text-white/70 text-sm">Each game requires 1 credit to start</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Credits consumed on Game Over</p>
                      <p className="text-white/70 text-sm">Only lost when you fail, not when you win</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Keep playing while winning</p>
                      <p className="text-white/70 text-sm">Level up and continue without losing credits</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Credit Packages */}
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h2 className="text-3xl font-futuristic font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] mb-6 text-center">
                  CREDIT PACKAGES
                </h2>
                
                {/* Error Message */}
                {packageError && (
                  <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{packageError}</span>
                    </div>
                  </div>
                )}
                
                {/* Loading State */}
                {loadingPackages && (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/70">Loading credit packages...</p>
                  </div>
                )}
                
                {!loadingPackages && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {availablePackages
                      .filter((pkg) => pkg.id !== 'pro' && !/\bpro\b/i.test(pkg.name || ''))
                      .map((pkg) => (
                    <Card 
                      key={pkg.id} 
                      className={`relative cursor-pointer bg-black/20 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 hover:scale-105 ${
                        selectedPackage === pkg.id 
                          ? 'ring-2 ring-primary hover:bg-black/30 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/30' 
                          : 'hover:bg-black/30 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/30'
                      }`}
                      onClick={() => setSelectedPackage(pkg.id)}
                    >
                      {pkg.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-primary text-primary-foreground font-futuristic">
                            <Star className="w-3 h-3 mr-1" />
                            MOST POPULAR
                          </Badge>
                        </div>
                      )}
                      
                      <CardHeader>
                        <CardTitle className="font-futuristic text-xl text-center">
                          {pkg.name}
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="text-center">
                        <div className="mb-4">
                          <div className="text-4xl font-futuristic font-bold text-primary mb-1">
                            {pkg.credits}
                          </div>
                          {pkg.bonus > 0 && (
                            <div className="text-sm text-green-400 font-medium">
                              +{pkg.bonus} Bonus Credits
                            </div>
                          )}
                          <div className="text-lg text-white/70">
                            Total: {pkg.credits + pkg.bonus} Credits
                          </div>
                        </div>
                        
                        <Separator className="mb-4" />
                        
                        <div className="text-3xl font-futuristic font-bold text-white mb-4">
                          ${pkg.price}
                        </div>
                        
                        <Button 
                          className={`w-full font-futuristic ${
                            selectedPackage === pkg.id 
                              ? 'bg-primary hover:bg-primary/80' 
                              : 'bg-primary/20 hover:bg-primary/40'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchase(pkg.id);
                          }}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Purchase with Stripe
                        </Button>
                      </CardContent>
                    </Card>
                      ))
                    }
                  </div>
                )}
              </div>

              {/* Recent Game Transactions */}
              <Card className="bg-black/20 backdrop-blur-md border border-white/20 rounded-xl transition-all duration-300 hover:bg-black/30 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/30 hover:scale-105 mb-6">
                <CardHeader>
                  <CardTitle className="font-futuristic text-2xl flex items-center gap-3">
                    <History className="w-6 h-6 text-primary" />
                    Recent Game Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTransactions.map((transaction) => (
                      <div 
                        key={transaction.id}
                        className="flex items-center justify-between p-4 bg-black/10 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          {transaction.type === 'earned' ? (
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                              <ShoppingCart className="w-4 h-4 text-green-400" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                              <Zap className="w-4 h-4 text-red-400" />
                            </div>
                          )}
                          
                          <div>
                            <p className="text-white font-medium">
                              {transaction.game}
                            </p>
                            <p className="text-white/70 text-sm">{transaction.date}</p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-futuristic font-bold ${
                            transaction.type === 'earned' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </p>
                          {transaction.cost && (
                            <p className="text-white/70 text-sm">${transaction.cost}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment History */}
              <PaymentHistory />
            </div>
          </div>
        </div>

        {/* Stripe Checkout Modal */}
        {showCheckout && selectedPackage && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePaymentCancel}
                  className="text-white hover:text-red-400"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <StripeCheckout
                package={getSelectedPackage()!}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Credits;
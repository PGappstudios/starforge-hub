import { useEffect, useRef } from 'react';
import { toast } from '@/components/ui/sonner';
import { useCredits } from '@/contexts/CreditsContext';

export const useCreditNotifications = () => {
  const { credits, transactions } = useCredits();
  const previousCredits = useRef<number>(credits);
  const previousTransactionCount = useRef<number>(transactions.length);
  const lastNotificationTime = useRef<number>(0);
  
  // Debounce notifications to prevent spam
  const NOTIFICATION_DEBOUNCE = 1000; // 1 second
  
  const shouldShowNotification = (): boolean => {
    const now = Date.now();
    if (now - lastNotificationTime.current < NOTIFICATION_DEBOUNCE) {
      return false;
    }
    lastNotificationTime.current = now;
    return true;
  };

  const getRandomEarnedMessage = (amount: number): string => {
    const messages = [
      `Stellar! You earned ${amount} cosmic credits!`,
      `Excellent! ${amount} credits added to your galactic treasury!`,
      `Outstanding! ${amount} credits harvested from the cosmos!`,
      `Brilliant! Your credit bank increased by ${amount}!`,
      `Amazing! ${amount} credits materialized in your account!`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getRandomSpentMessage = (amount: number, description: string): string => {
    const messages = [
      `${amount} credits invested in ${description}`,
      `Used ${amount} credits for ${description}`,
      `${amount} credits consumed for ${description}`,
      `Spent ${amount} credits on ${description}`
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getEarnedIcon = (amount: number): string => {
    if (amount >= 10) return '👑';
    if (amount >= 5) return '⭐';
    if (amount >= 3) return '🎁';
    return '💰';
  };

  const showEarnedNotification = (amount: number, description: string) => {
    if (!shouldShowNotification()) return;

    const message = getRandomEarnedMessage(amount);
    const icon = getEarnedIcon(amount);
    
    toast.success(message, {
      description: `From: ${description}`,
      duration: 3000,
      className: 'cosmic-toast-success',
      style: {
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
        borderColor: 'rgba(34, 197, 94, 0.3)',
        color: 'white'
      },
      action: {
        label: icon,
        onClick: () => console.log('Credits earned!')
      }
    });
  };

  const showSpentNotification = (amount: number, description: string) => {
    if (!shouldShowNotification()) return;

    const message = getRandomSpentMessage(amount, description);
    
    toast.info(message, {
      description: `Remaining credits: ${credits}`,
      duration: 2500,
      className: 'cosmic-toast-info',
      style: {
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        color: 'white'
      }
    });
  };

  const showLowCreditsWarning = () => {
    if (!shouldShowNotification()) return;

    toast.warning('Credits running low!', {
      description: `Only ${credits} credits remaining. Consider purchasing more credits.`,
      duration: 4000,
      className: 'cosmic-toast-warning',
      style: {
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(251, 191, 36, 0.1) 100%)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
        color: 'white'
      },
      action: {
        label: 'Buy Credits',
        onClick: () => {
          window.location.href = '/credits';
        }
      }
    });
  };

  const showPurchaseNotification = (amount: number, packageName: string, cost: number) => {
    if (!shouldShowNotification()) return;

    toast.success('Credits purchased successfully!', {
      description: `${amount} credits added from ${packageName} ($${cost})`,
      duration: 4000,
      className: 'cosmic-toast-purchase',
      style: {
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
        borderColor: 'rgba(168, 85, 247, 0.3)',
        color: 'white'
      },
      action: {
        label: '🚀',
        onClick: () => console.log('Ready to play!')
      }
    });
  };

  useEffect(() => {
    // Initialize refs on first render
    if (previousCredits.current === credits && previousTransactionCount.current === transactions.length) {
      previousCredits.current = credits;
      previousTransactionCount.current = transactions.length;
      return;
    }

    // Check if there's a new transaction
    if (transactions.length > previousTransactionCount.current) {
      const latestTransaction = transactions[0]; // Most recent transaction
      
      if (latestTransaction.type === 'earned') {
        showEarnedNotification(latestTransaction.amount, latestTransaction.description);
        
        // Skip additional purchase notification for now since earned notification covers it
      } else if (latestTransaction.type === 'spent') {
        showSpentNotification(latestTransaction.amount, latestTransaction.description);
      }
    }

    // Check for low credits warning (only when credits decrease and are low)
    if (credits < previousCredits.current && credits > 0 && credits < 5) {
      showLowCreditsWarning();
    }

    // Update refs
    previousCredits.current = credits;
    previousTransactionCount.current = transactions.length;
  }, [credits, transactions]);

  // Return utility functions for manual notifications if needed
  return {
    showEarnedNotification,
    showSpentNotification,
    showLowCreditsWarning,
    showPurchaseNotification
  };
};
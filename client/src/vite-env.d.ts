/// <reference types="vite/client" />

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name?: string;
  description?: string;
  image?: string;
  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface Window {
  Razorpay: new (options: RazorpayOptions) => {
    open: () => void;
  };
}

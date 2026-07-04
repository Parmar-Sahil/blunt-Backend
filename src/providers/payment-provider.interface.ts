export interface IPaymentSessionResult {
  gatewayOrderId?: string; // Razorpay orderId
  gatewayPaymentId?: string; // Stripe PaymentIntent ID / ClientSecret
  clientSecret?: string; // Stripe ClientSecret
  gateway: "stripe" | "razorpay";
  rawResponse: any;
}

export interface IVerifyPaymentResult {
  success: boolean;
  status: "paid" | "failed" | "pending";
  transactionId?: string;
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  failureReason?: string;
  rawResponse: any;
}

export interface IPaymentProvider {
  createPaymentSession(options: {
    paymentId: string;
    amount: number;
    currency: string;
    metadata: Record<string, any>;
  }): Promise<IPaymentSessionResult>;

  verifyPayment(options: {
    gatewayOrderId?: string;
    gatewayPaymentId?: string;
    signature?: string;
    payload?: any;
  }): Promise<IVerifyPaymentResult>;

  verifyWebhookSignature(options: {
    rawBody: string | Buffer;
    signature: string;
    endpointSecret: string;
  }): Promise<any>;
}

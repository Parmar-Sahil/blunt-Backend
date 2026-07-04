import Stripe from "stripe";
import { IPaymentProvider, IPaymentSessionResult, IVerifyPaymentResult } from "./payment-provider.interface.js";

export class StripeProvider implements IPaymentProvider {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY || "";
    this.stripe = new Stripe(secretKey, {
      apiVersion: "2024-04-10" as any,
    });
  }

  async createPaymentSession(options: {
    paymentId: string;
    amount: number;
    currency: string;
    metadata: Record<string, any>;
  }): Promise<IPaymentSessionResult> {
    const stripeAmount = Math.round(options.amount * 100);
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: options.currency.toLowerCase() || "usd",
      metadata: {
        paymentId: options.paymentId,
        ...options.metadata,
      },
    });

    return {
      gatewayOrderId: paymentIntent.id,
      gatewayPaymentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || undefined,
      gateway: "stripe",
      rawResponse: paymentIntent,
    };
  }

  async verifyPayment(options: {
    gatewayOrderId?: string;
    gatewayPaymentId?: string;
    signature?: string;
    payload?: any;
  }): Promise<IVerifyPaymentResult> {
    const paymentIntentId = options.gatewayPaymentId || options.gatewayOrderId;
    if (!paymentIntentId) {
      return {
        success: false,
        status: "failed",
        failureReason: "MISSING GATEWAY PAYMENT IDENTIFIER",
        rawResponse: null,
      };
    }

    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status === "succeeded") {
      return {
        success: true,
        status: "paid",
        transactionId: intent.id,
        gatewayPaymentId: intent.id,
        rawResponse: intent,
      };
    } else if (intent.status === "requires_payment_method" || intent.status === "canceled") {
      return {
        success: false,
        status: "failed",
        failureReason: `STRIPE STATUS: ${intent.status}`,
        rawResponse: intent,
      };
    }

    return {
      success: false,
      status: "pending",
      rawResponse: intent,
    };
  }

  async verifyWebhookSignature(options: {
    rawBody: string | Buffer;
    signature: string;
    endpointSecret: string;
  }): Promise<any> {
    return this.stripe.webhooks.constructEvent(
      options.rawBody,
      options.signature,
      options.endpointSecret
    );
  }
}
export default StripeProvider;

import Razorpay from "razorpay";
import crypto from "crypto";
import { IPaymentProvider, IPaymentSessionResult, IVerifyPaymentResult } from "./payment-provider.interface.js";
import { BadRequestError } from "../utils/errors.js";

export class RazorpayProvider implements IPaymentProvider {
  private razorpay: any;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID || "";
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    this.razorpay = new (Razorpay as any)({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async createPaymentSession(options: {
    paymentId: string;
    amount: number;
    currency: string;
    metadata: Record<string, any>;
  }): Promise<IPaymentSessionResult> {
    const razorpayAmount = Math.round(options.amount * 100);
    const order = await this.razorpay.orders.create({
      amount: razorpayAmount,
      currency: options.currency || "INR",
      receipt: options.paymentId,
      notes: {
        paymentId: options.paymentId,
        ...options.metadata,
      },
    });

    return {
      gatewayOrderId: order.id,
      gatewayPaymentId: undefined,
      clientSecret: undefined,
      gateway: "razorpay",
      rawResponse: order,
    };
  }

  async verifyPayment(options: {
    gatewayOrderId?: string;
    gatewayPaymentId?: string;
    signature?: string;
    payload?: any;
  }): Promise<IVerifyPaymentResult> {
    const { gatewayOrderId, gatewayPaymentId, signature } = options;
    if (!gatewayOrderId || !gatewayPaymentId || !signature) {
      return {
        success: false,
        status: "failed",
        failureReason: "MISSING REQUIRED SIGNATURE PARAMETERS",
        rawResponse: null,
      };
    }

    const secret = process.env.RAZORPAY_KEY_SECRET || "";
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${gatewayOrderId}|${gatewayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== signature) {
      return {
        success: false,
        status: "failed",
        failureReason: "INVALID SIGNATURE OR CHECKSUM MATCH FAILURE",
        rawResponse: { generatedSignature, signature },
      };
    }

    return {
      success: true,
      status: "paid",
      transactionId: gatewayPaymentId,
      gatewayPaymentId,
      gatewayOrderId,
      rawResponse: { signatureVerified: true },
    };
  }

  async verifyWebhookSignature(options: {
    rawBody: string | Buffer;
    signature: string;
    endpointSecret: string;
  }): Promise<any> {
    const expectedSignature = crypto
      .createHmac("sha256", options.endpointSecret)
      .update(options.rawBody)
      .digest("hex");

    if (expectedSignature !== options.signature) {
      throw new BadRequestError("INVALID WEBHOOK SIGNATURE");
    }

    return JSON.parse(options.rawBody.toString());
  }
}
export default RazorpayProvider;

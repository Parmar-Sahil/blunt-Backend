import crypto from "crypto";
import { StripeProvider } from "../providers/stripe.provider.js";
import { RazorpayProvider } from "../providers/razorpay.provider.js";
import { IPaymentProvider } from "../providers/payment-provider.interface.js";
import paymentRepository from "../repositories/payment.repository.js";
import checkoutService from "./checkout.service.js";
import orderService from "./order.service.js";
import UserModel from "../models/user.model.js";
import notificationService from "./notification.service.js";
import { NotFoundError, BadRequestError, ConflictError } from "../utils/errors.js";
import { IPayment } from "../models/payment.model.js";

export class PaymentService {
  private providers: Record<"stripe" | "razorpay", IPaymentProvider>;

  constructor() {
    this.providers = {
      stripe: new StripeProvider(),
      razorpay: new RazorpayProvider(),
    };
  }

  getProvider(gateway: "stripe" | "razorpay"): IPaymentProvider {
    const provider = this.providers[gateway];
    if (!provider) {
      throw new BadRequestError(`UNSUPPORTED PAYMENT GATEWAY: ${gateway}`);
    }
    return provider;
  }

  async createPaymentSession(userId: string, checkoutId: string): Promise<IPayment> {
    const checkoutSession = await checkoutService.getCheckoutSession(checkoutId, userId);
    if (checkoutSession.status !== "pending") {
      throw new BadRequestError(`CHECKOUT SESSION IS ALREADY '${checkoutSession.status.toUpperCase()}'`);
    }

    const existingPayment = await paymentRepository.findByCheckoutId(checkoutId);
    if (existingPayment) {
      if (existingPayment.status === "paid") {
        throw new ConflictError("PAYMENT HAS ALREADY BEEN SUCCESSFULLY PROCESSED");
      }
      await paymentRepository.updateByPaymentId(existingPayment.paymentId, { status: "cancelled" });
    }

    const gateway = checkoutSession.paymentGateway;
    const paymentId = "pay_" + crypto.randomBytes(12).toString("hex");

    const provider = this.getProvider(gateway);
    const sessionResult = await provider.createPaymentSession({
      paymentId,
      amount: checkoutSession.grandTotal,
      currency: "INR",
      metadata: {
        userId,
        checkoutId,
      },
    });

    const payment = await paymentRepository.create({
      paymentId,
      checkoutId,
      userId,
      gateway,
      transactionId: sessionResult.gatewayPaymentId || null,
      gatewayOrderId: sessionResult.gatewayOrderId || null,
      gatewayPaymentId: sessionResult.gatewayPaymentId || null,
      currency: "INR",
      amount: checkoutSession.grandTotal,
      status: "created",
      metadata: {
        clientSecret: sessionResult.clientSecret,
        ...sessionResult.rawResponse,
      },
    });

    console.log(`[LOG] Payment Session Created: ${payment.paymentId} for gateway ${gateway}`);
    return payment;
  }

  async verifyPayment(options: {
    paymentId: string;
    gateway: "stripe" | "razorpay";
    gatewayPaymentId?: string | null;
    gatewayOrderId?: string | null;
    signature?: string | null;
  }): Promise<IPayment> {
    const { paymentId, gateway, gatewayPaymentId, gatewayOrderId, signature } = options;

    const payment = await paymentRepository.findByPaymentId(paymentId);
    if (!payment) {
      throw new NotFoundError("PAYMENT RECORD NOT FOUND");
    }

    if (payment.status === "paid") {
      console.log(`[LOG] Payment ${paymentId} already marked PAID. Skipping verification.`);
      return payment;
    }

    const provider = this.getProvider(gateway);
    const verifyResult = await provider.verifyPayment({
      gatewayOrderId: gatewayOrderId || payment.gatewayOrderId || undefined,
      gatewayPaymentId: gatewayPaymentId || payment.gatewayPaymentId || undefined,
      signature: signature || undefined,
    });

    if (verifyResult.success && verifyResult.status === "paid") {
      payment.status = "paid";
      payment.transactionId = verifyResult.transactionId || verifyResult.gatewayPaymentId;
      payment.gatewayPaymentId = verifyResult.gatewayPaymentId;
      payment.gatewayOrderId = verifyResult.gatewayOrderId || payment.gatewayOrderId;
      
      payment.metadata = {
        ...payment.metadata,
        verificationResponse: verifyResult.rawResponse,
      };

      await payment.save();

      const order = await orderService.createOrderFromCheckout({
        userId: String(payment.userId),
        checkoutId: payment.checkoutId,
        paymentId: payment.paymentId,
        paymentVerified: true,
      });

      payment.orderId = order._id;
      await payment.save();

      console.log(`[LOG] Payment Verified & Order Finalized: ${paymentId} | Order: ${order.orderNumber}`);
    } else {
      payment.status = "failed";
      payment.failureReason = verifyResult.failureReason || "TRANSACTION VERIFICATION FAILED";
      await payment.save();

      console.log(`[LOG] Payment Verification Failed: ${paymentId} | Reason: ${payment.failureReason}`);

      // Send Payment Failure Notification
      const user: any = await UserModel.findById(payment.userId).lean();
      if (user) {
        await notificationService.sendPaymentFailure(
          String(payment.userId),
          user.email,
          payment.paymentId,
          payment.amount,
          payment.failureReason || "TRANSACTION VERIFICATION FAILED"
        );
      }
    }

    return payment;
  }

  async handleWebhook(options: {
    gateway: "stripe" | "razorpay";
    rawBody: string | Buffer;
    signature: string;
  }): Promise<void> {
    const { gateway, rawBody, signature } = options;
    const provider = this.getProvider(gateway);

    const secret =
      gateway === "stripe"
        ? process.env.STRIPE_WEBHOOK_SECRET || ""
        : process.env.RAZORPAY_WEBHOOK_SECRET || "";

    const event = await provider.verifyWebhookSignature({
      rawBody,
      signature,
      endpointSecret: secret,
    });

    if (gateway === "stripe") {
      const stripeEvent = event;
      if (stripeEvent.type === "payment_intent.succeeded") {
        const paymentIntent = stripeEvent.data.object;
        const paymentId = paymentIntent.metadata?.paymentId;
        if (paymentId) {
          await this.verifyPayment({
            paymentId,
            gateway: "stripe",
            gatewayPaymentId: paymentIntent.id,
          });
        }
      } else if (stripeEvent.type === "payment_intent.payment_failed") {
        const paymentIntent = stripeEvent.data.object;
        const paymentId = paymentIntent.metadata?.paymentId;
        if (paymentId) {
          const payment = await paymentRepository.findByPaymentId(paymentId);
          if (payment && payment.status !== "paid") {
            payment.status = "failed";
            payment.failureReason = paymentIntent.last_payment_error?.message || "STRIPE TRANSACTION FAILED";
            await payment.save();

            // Send Webhook Payment Failure Notification
            const user: any = await UserModel.findById(payment.userId).lean();
            if (user) {
              await notificationService.sendPaymentFailure(
                String(payment.userId),
                user.email,
                payment.paymentId,
                payment.amount,
                payment.failureReason || "STRIPE TRANSACTION FAILED"
              );
            }
          }
        }
      }
    } else if (gateway === "razorpay") {
      const razorpayEvent = event;
      if (razorpayEvent.event === "order.paid") {
        const orderEntity = razorpayEvent.payload?.order?.entity;
        const paymentEntity = razorpayEvent.payload?.payment?.entity;
        const paymentId = orderEntity?.notes?.paymentId || paymentEntity?.notes?.paymentId;
        if (paymentId) {
          await this.verifyPayment({
            paymentId,
            gateway: "razorpay",
            gatewayOrderId: orderEntity.id,
            gatewayPaymentId: paymentEntity.id,
            signature: razorpayEvent.payload?.payment?.entity?.signature || "webhook_verified",
          });
        }
      }
    }
  }

  async getPayment(paymentId: string, userId: string, isAdmin: boolean = false): Promise<IPayment> {
    const payment = await paymentRepository.findByPaymentId(paymentId);
    if (!payment) throw new NotFoundError("PAYMENT RECORD NOT FOUND");

    if (!isAdmin && String(payment.userId) !== userId) {
      throw new BadRequestError("UNAUTHORIZED ACCESS TO THIS PAYMENT");
    }

    return payment;
  }

  async getAdminPayments(options: any) {
    return paymentRepository.findPaginatedAdmin(options);
  }
}

export const paymentService = new PaymentService();
export default paymentService;

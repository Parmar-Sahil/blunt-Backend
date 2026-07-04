import crypto from "crypto";
import { EmailProvider } from "../providers/email.provider.js";
import { INotificationProvider } from "../providers/notification-provider.interface.js";
import notificationRepository from "../repositories/notification.repository.js";
import emailService from "./email.service.js";

// TODO: SMS Provider - Integrate Twilio or Plivo for SMS alerts
// TODO: WhatsApp - Integrate Twilio WhatsApp API or Meta Cloud API
// TODO: Push Notifications - Integrate Firebase Cloud Messaging (FCM)
// TODO: Slack - Integrate Webhooks or Slack Bolt SDK
// TODO: Discord - Integrate Discord Bot/Webhook clients
// TODO: In-App Notifications - Integrate Socket.io notifications

export class NotificationService {
  public emailProvider: INotificationProvider;

  constructor() {
    this.emailProvider = new EmailProvider();
  }

  private async dispatchEmail(options: {
    userId?: string | null;
    type: string;
    recipient: string;
    subject: string;
    content: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const notificationId = "notif_" + crypto.randomBytes(12).toString("hex");

    // 1. Create audit log in DB with queued status
    await notificationRepository.create({
      notificationId,
      userId: options.userId || null,
      type: options.type,
      channel: "email",
      status: "queued",
      recipient: options.recipient,
      subject: options.subject,
      provider: "resend",
      metadata: options.metadata || {},
    });

    // TODO: BullMQ / Redis / RabbitMQ - Enqueue notifications here for background worker processing.
    // TODO: Background Jobs - Dispatch worker tasks to handle email transmissions asynchronously.
    // TODO: Retry Strategy - Configure exponential backoff retry schedules for failed provider calls.

    try {
      await notificationRepository.updateStatus(notificationId, "sending");
      
      const result = await this.emailProvider.sendNotification({
        recipient: options.recipient,
        subject: options.subject,
        content: options.content,
        metadata: options.metadata,
      });

      if (result.success) {
        await notificationRepository.updateStatus(notificationId, "sent", {
          providerMessageId: result.providerMessageId,
          sentAt: new Date(),
        });
      } else {
        await notificationRepository.updateStatus(notificationId, "failed", {
          failedAt: new Date(),
          metadata: { error: result.error },
        });
        console.warn(`[WARN] Email dispatch failed for notification ${notificationId}: ${result.error}`);
      }
    } catch (err: any) {
      await notificationRepository.updateStatus(notificationId, "failed", {
        failedAt: new Date(),
        metadata: { error: err.message || String(err) },
      });
      console.error(`[ERROR] Notification service crashed during email dispatch:`, err);
    }
  }

  // --- AUTH SERVICES ---

  async sendWelcomeEmail(userId: string, email: string, name: string): Promise<void> {
    const content = emailService.getWelcomeEmailHtml(name);
    await this.dispatchEmail({
      userId,
      type: "welcome",
      recipient: email,
      subject: "WELCOME TO BLUNT",
      content,
    });
  }

  async sendRegistrationOTP(email: string, otp: string): Promise<void> {
    const content = emailService.getVerifyOtpHtml(otp);
    await this.dispatchEmail({
      type: "verify-email",
      recipient: email,
      subject: "VERIFY YOUR BLUNT ACCOUNT",
      content,
    });
  }

  async sendLoginOTP(email: string, otp: string): Promise<void> {
    const content = emailService.getLoginOtpHtml(otp);
    await this.dispatchEmail({
      type: "login-otp",
      recipient: email,
      subject: "BLUNT LOGIN ONE-TIME PASSWORD",
      content,
    });
  }

  async sendForgotPasswordOTP(email: string, otp: string): Promise<void> {
    const content = emailService.getForgotPasswordOtpHtml(otp);
    await this.dispatchEmail({
      type: "forgot-password",
      recipient: email,
      subject: "RESET YOUR BLUNT PASSWORD",
      content,
    });
  }

  async sendPasswordChanged(userId: string, email: string, name: string): Promise<void> {
    const content = emailService.getPasswordChangedHtml(name);
    await this.dispatchEmail({
      userId,
      type: "password-changed",
      recipient: email,
      subject: "BLUNT ACCOUNT PASSWORD UPDATED",
      content,
    });
  }

  // --- ORDER SERVICES ---

  async sendOrderConfirmation(
    userId: string,
    email: string,
    orderNumber: string,
    grandTotal: number,
    items: any[]
  ): Promise<void> {
    const content = emailService.getOrderConfirmedHtml(orderNumber, grandTotal, items);
    await this.dispatchEmail({
      userId,
      type: "order-confirmed",
      recipient: email,
      subject: `BLUNT ORDER CONFIRMED: ${orderNumber}`,
      content,
    });
  }

  async sendPaymentSuccess(userId: string, email: string, paymentId: string, amount: number): Promise<void> {
    const content = emailService.getPaymentSuccessHtml(paymentId, amount);
    await this.dispatchEmail({
      userId,
      type: "payment-success",
      recipient: email,
      subject: `BLUNT PAYMENT CAPTURED: ${paymentId}`,
      content,
    });
  }

  async sendPaymentFailure(
    userId: string,
    email: string,
    paymentId: string,
    amount: number,
    failureReason: string
  ): Promise<void> {
    const content = emailService.getPaymentFailedHtml(paymentId, amount, failureReason);
    await this.dispatchEmail({
      userId,
      type: "payment-failed",
      recipient: email,
      subject: "BLUNT PAYMENT FAILED",
      content,
    });
  }

  async sendShipmentUpdate(
    userId: string,
    email: string,
    orderNumber: string,
    status: "packed" | "shipped" | "out-for-delivery",
    courier?: string,
    trackingNumber?: string
  ): Promise<void> {
    let content = "";
    let subject = "";

    if (status === "packed") {
      content = emailService.getOrderPackedHtml(orderNumber);
      subject = `YOUR BLUNT ORDER ${orderNumber} IS PACKED`;
    } else if (status === "shipped") {
      content = emailService.getOrderShippedHtml(orderNumber, courier || "Courier", trackingNumber || "");
      subject = `YOUR BLUNT ORDER ${orderNumber} HAS SHIPPED`;
    } else if (status === "out-for-delivery") {
      content = emailService.getOutForDeliveryHtml(orderNumber);
      subject = `YOUR BLUNT ORDER ${orderNumber} IS OUT FOR DELIVERY`;
    }

    await this.dispatchEmail({
      userId,
      type: `order-${status}`,
      recipient: email,
      subject,
      content,
    });
  }

  async sendDelivered(userId: string, email: string, orderNumber: string): Promise<void> {
    const content = emailService.getOrderDeliveredHtml(orderNumber);
    await this.dispatchEmail({
      userId,
      type: "order-delivered",
      recipient: email,
      subject: `DELIVERED: BLUNT ORDER ${orderNumber}`,
      content,
    });
  }

  async sendCancelled(userId: string, email: string, orderNumber: string): Promise<void> {
    const content = emailService.getOrderCancelledHtml(orderNumber);
    await this.dispatchEmail({
      userId,
      type: "order-cancelled",
      recipient: email,
      subject: `CANCELLED: BLUNT ORDER ${orderNumber}`,
      content,
    });
  }

  async sendRefund(userId: string, email: string, orderNumber: string, amount: number): Promise<void> {
    const content = emailService.getRefundConfirmedHtml(orderNumber, amount);
    await this.dispatchEmail({
      userId,
      type: "refund-confirmed",
      recipient: email,
      subject: `REFUND PROCESSED: BLUNT ORDER ${orderNumber}`,
      content,
    });
  }

  // --- ADMIN SERVICES ---

  async sendAdminNewOrderAlert(orderNumber: string, grandTotal: number): Promise<void> {
    const content = emailService.getAdminNewOrderHtml(orderNumber, grandTotal);
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || "sahilparmar7033030@gmail.com";
    await this.dispatchEmail({
      type: "admin-new-order",
      recipient: adminEmail,
      subject: `[ADMIN ALERT] NEW ORDER PLACED: ${orderNumber}`,
      content,
    });
  }

  async sendAdminLowStockWarning(productName: string, sku: string, stock: number): Promise<void> {
    const content = emailService.getAdminLowStockHtml(productName, sku, stock);
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || "sahilparmar7033030@gmail.com";
    await this.dispatchEmail({
      type: "admin-low-stock",
      recipient: adminEmail,
      subject: `[ADMIN WARNING] LOW STOCK FOR SKU ${sku}`,
      content,
    });
  }

  async sendAdminOutOfStockAlert(productName: string, sku: string): Promise<void> {
    const content = emailService.getAdminOutOfStockHtml(productName, sku);
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || "sahilparmar7033030@gmail.com";
    await this.dispatchEmail({
      type: "admin-out-of-stock",
      recipient: adminEmail,
      subject: `[ADMIN ALERT] SKU ${sku} OUT OF STOCK`,
      content,
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;

import { getBrandedEmailLayout } from "../templates/emails/layout.template.js";
import notificationService from "./notification.service.js";

export class EmailService {
  // --- LEGACY AUTH WRAPPER INTEGRATIONS ---

  async sendRegistrationOtpEmail(email: string, otp: string): Promise<void> {
    await notificationService.sendRegistrationOTP(email, otp);
  }

  async sendLoginOtpEmail(email: string, otp: string): Promise<void> {
    await notificationService.sendLoginOTP(email, otp);
  }

  async sendPasswordResetOtpEmail(email: string, otp: string): Promise<void> {
    await notificationService.sendForgotPasswordOTP(email, otp);
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await notificationService.sendWelcomeEmail("", email, name);
  }

  // --- AUTH TEMPLATES ---

  getWelcomeEmailHtml(name: string): string {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    return getBrandedEmailLayout({
      title: "WELCOME TO THE CLUB",
      preheader: "Your membership is now active.",
      bodyHtml: `
        <p>Hello <span class="highlight">${name}</span>,</p>
        <p>Welcome to <span class="highlight">BLUNT</span>. You have officially entered the ecosystem of luxury streetwear. Your account is active and you are ready to shop our curated collections.</p>
        <p>Expect premium drops, limited releases, and member-only early access privileges.</p>
      `,
      ctaText: "ENTER THE SHOP",
      ctaLink: `${clientUrl}/shop`,
    });
  }

  getVerifyOtpHtml(otp: string): string {
    return getBrandedEmailLayout({
      title: "VERIFY YOUR EMAIL",
      preheader: "Enter this OTP code to complete registration.",
      bodyHtml: `
        <p>Complete your BLUNT account setup by verifying your email address.</p>
        <p>Your one-time registration code is:</p>
        <div style="font-size: 32px; font-weight: 800; color: #FFFFFF; text-align: center; letter-spacing: 0.25em; padding: 24px; border: 1px solid #1F1F1F; background-color: #080808; border-radius: 4px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="font-size: 13px; color: #8E8E93; text-align: center;">This code is valid for 10 minutes. Do not share this code with anyone.</p>
      `,
    });
  }

  getLoginOtpHtml(otp: string): string {
    return getBrandedEmailLayout({
      title: "LOGIN ONE-TIME PASSWORD",
      preheader: "Use this OTP code to log in.",
      bodyHtml: `
        <p>Use the following one-time password (OTP) code to verify your identity and log into the BLUNT portal.</p>
        <div style="font-size: 32px; font-weight: 800; color: #FFFFFF; text-align: center; letter-spacing: 0.25em; padding: 24px; border: 1px solid #1F1F1F; background-color: #080808; border-radius: 4px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="font-size: 13px; color: #8E8E93; text-align: center;">This code is valid for 5 minutes. If you did not request this code, contact support.</p>
      `,
    });
  }

  getForgotPasswordOtpHtml(otp: string): string {
    return getBrandedEmailLayout({
      title: "RESET YOUR PASSWORD",
      preheader: "OTP code to reset password.",
      bodyHtml: `
        <p>We received a request to reset the password for your BLUNT account.</p>
        <p>Your verification code is:</p>
        <div style="font-size: 32px; font-weight: 800; color: #FFFFFF; text-align: center; letter-spacing: 0.25em; padding: 24px; border: 1px solid #1F1F1F; background-color: #080808; border-radius: 4px; margin: 24px 0;">
          ${otp}
        </div>
        <p style="font-size: 13px; color: #8E8E93; text-align: center;">This code is valid for 10 minutes. If you didn't request a reset, you can safely ignore this email.</p>
      `,
    });
  }

  getPasswordChangedHtml(name: string): string {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    return getBrandedEmailLayout({
      title: "PASSWORD UPDATED",
      preheader: "Your account credentials have changed.",
      bodyHtml: `
        <p>Hello <span class="highlight">${name}</span>,</p>
        <p>The password for your BLUNT account was recently changed successfully.</p>
        <p>If you did not authorize this change, please immediately reset your password using our recovery page or contact security support at <span class="highlight">${process.env.SUPPORT_EMAIL || "security@blunt.com"}</span>.</p>
      `,
      ctaText: "MY ACCOUNT",
      ctaLink: `${clientUrl}/account`,
    });
  }

  // --- ORDER TEMPLATES ---

  getOrderConfirmedHtml(orderNumber: string, grandTotal: number, items: any[]): string {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    let itemsListHtml = "";
    for (const item of items) {
      const imgTag = item.productImage
        ? `<img src="${item.productImage}" alt="${item.productName}" style="width: 52px; height: 52px; object-fit: cover; border: 1px solid #2B2B2B; margin-right: 12px; vertical-align: middle;" />`
        : "";

      itemsListHtml += `
        <tr style="border-bottom: 1px solid #1C1C1C;">
          <td style="padding: 16px 0; font-family: 'Courier New', Courier, monospace, sans-serif;">
            <table style="border-collapse: collapse;">
              <tr>
                ${imgTag ? `<td style="padding-right: 12px; vertical-align: middle;">${imgTag}</td>` : ""}
                <td style="vertical-align: middle;">
                  <div style="font-weight: 900; color: #FFFFFF; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">${item.productName || "PRODUCT"}</div>
                  <div style="font-size: 11px; color: #BEF500; margin-top: 4px; letter-spacing: 0.1em; text-transform: uppercase;">SIZE: ${item.size || "M"} • COLOR: ${item.color || "BLACK"}</div>
                </td>
              </tr>
            </table>
          </td>
          <td style="padding: 16px 0; text-align: center; color: #FFFFFF; font-family: 'Courier New', Courier, monospace, sans-serif; font-weight: bold; font-size: 13px;">x${item.quantity}</td>
          <td style="padding: 16px 0; text-align: right; color: #BEF500; font-family: 'Courier New', Courier, monospace, sans-serif; font-weight: 900; font-size: 14px;">$${(item.subtotal || (item.unitPrice * item.quantity) || 0).toFixed(2)}</td>
        </tr>
      `;
    }

    return getBrandedEmailLayout({
      title: "ACQUISITION CONFIRMED",
      preheader: `Your order ${orderNumber} is confirmed and entering fulfillment.`,
      bodyHtml: `
        <p style="font-family: 'Courier New', Courier, monospace, sans-serif; font-size: 13px; color: #D1D1D6; line-height: 1.6;">
          Your acquisition is confirmed under reference <span class="highlight">${orderNumber}</span>.
          Our warehouse team has initiated verification and packaging protocols.
        </p>
        <div class="divider"></div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <thead>
            <tr style="border-bottom: 1px solid #2B2B2B; text-align: left; font-size: 10px; color: #777777; font-family: 'Courier New', Courier, monospace, sans-serif; letter-spacing: 0.2em; text-transform: uppercase;">
              <th style="padding-bottom: 12px;">ITEM ARCHIVE</th>
              <th style="padding-bottom: 12px; text-align: center;">QTY</th>
              <th style="padding-bottom: 12px; text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsListHtml}
          </tbody>
        </table>
        <div style="border-top: 1px solid #2B2B2B; padding-top: 16px; text-align: right; font-family: 'Courier New', Courier, monospace, sans-serif;">
          <span style="font-size: 11px; color: #777777; letter-spacing: 0.2em; text-transform: uppercase; margin-right: 12px;">ACQUISITION TOTAL:</span>
          <span style="font-size: 20px; color: #BEF500; font-weight: 900; letter-spacing: 0.05em;">$${grandTotal.toFixed(2)}</span>
        </div>
      `,
      ctaText: "VIEW ORDER OVERWATCH",
      ctaLink: `${clientUrl}/orders`,
    });
  }

  getPaymentSuccessHtml(paymentId: string, amount: number): string {
    return getBrandedEmailLayout({
      title: "PAYMENT CAPTURED",
      preheader: `Successfully received payment of INR ${amount.toFixed(2)}.`,
      bodyHtml: `
        <p>We successfully received your payment of <span class="highlight">INR ${amount.toFixed(2)}</span>.</p>
        <p>Transaction Reference: <span class="highlight">${paymentId}</span></p>
        <p>Your order status has been updated to Confirmed. We are wrapping your gear now.</p>
      `,
    });
  }

  getPaymentFailedHtml(paymentId: string, amount: number, failureReason: string): string {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    return getBrandedEmailLayout({
      title: "PAYMENT FAILED",
      preheader: "There was an issue processing your transaction.",
      bodyHtml: `
        <p>Your payment attempt of <span class="highlight">INR ${amount.toFixed(2)}</span> has failed.</p>
        <p>Transaction Reference: <span class="highlight">${paymentId}</span></p>
        <p>Reason for failure: <span class="highlight" style="color: #FF453A;">${failureReason}</span></p>
        <p>Your items are still reserved in your active checkout session. Please try checking out again using an alternative payment method.</p>
      `,
      ctaText: "RETRACT CHECKOUT",
      ctaLink: `${clientUrl}/cart`,
    });
  }

  getOrderPackedHtml(orderNumber: string): string {
    return getBrandedEmailLayout({
      title: "ITEMS PACKED",
      preheader: `Order ${orderNumber} is ready for pick-up.`,
      bodyHtml: `
        <p>Your BLUNT gear for order <span class="highlight">${orderNumber}</span> has been packed, verified for quality control, and is ready in our warehouse.</p>
        <p>A courier carrier will pick up the package shortly, and we will email you tracking details immediately.</p>
      `,
    });
  }

  getOrderShippedHtml(orderNumber: string, courier: string, trackingNumber: string): string {
    return getBrandedEmailLayout({
      title: "DISPATCHED / SHIPPED",
      preheader: `Order ${orderNumber} has been shipped.`,
      bodyHtml: `
        <p>Your BLUNT package is on the way. Order <span class="highlight">${orderNumber}</span> was picked up by <span class="highlight">${courier}</span>.</p>
        <p>Waybill / Tracking Number: <span class="highlight">${trackingNumber}</span></p>
      `,
      ctaText: "TRACK SHIPMENT",
      ctaLink: `https://www.google.com/search?q=track+${courier}+${trackingNumber}`,
    });
  }

  getOutForDeliveryHtml(orderNumber: string): string {
    return getBrandedEmailLayout({
      title: "OUT FOR DELIVERY",
      preheader: `Your BLUNT package is arriving today.`,
      bodyHtml: `
        <p>Get ready. Order <span class="highlight">${orderNumber}</span> is out for delivery with the local courier agent and is arriving today.</p>
        <p>Please make sure someone is available at the shipping destination to collect the shipment.</p>
      `,
    });
  }

  getOrderDeliveredHtml(orderNumber: string): string {
    return getBrandedEmailLayout({
      title: "DELIVERED",
      preheader: `Order ${orderNumber} has been delivered.`,
      bodyHtml: `
        <p>Delivered. Order <span class="highlight">${orderNumber}</span> has been successfully delivered and signed for.</p>
        <p>We hope you enjoy your new luxury streetwear. Tag us on socials for early access tags.</p>
      `,
    });
  }

  getOrderCancelledHtml(orderNumber: string): string {
    return getBrandedEmailLayout({
      title: "ORDER CANCELLED",
      preheader: `Order ${orderNumber} was cancelled.`,
      bodyHtml: `
        <p>Order <span class="highlight">${orderNumber}</span> has been successfully cancelled.</p>
        <p>If a payment was captured, a refund transaction has been initialized and will reflect in your account within 5-7 business days.</p>
      `,
    });
  }

  getRefundConfirmedHtml(orderNumber: string, amount: number): string {
    return getBrandedEmailLayout({
      title: "REFUND PROCESSED",
      preheader: `Refund completed for order ${orderNumber}.`,
      bodyHtml: `
        <p>We have successfully processed a refund of <span class="highlight">INR ${amount.toFixed(2)}</span> for order <span class="highlight">${orderNumber}</span>.</p>
        <p>The funds are returning to your original payment method. Depending on your bank, it may take 5-10 business days to clear.</p>
      `,
    });
  }

  // --- ADMIN TEMPLATES ---

  getAdminNewOrderHtml(orderNumber: string, grandTotal: number): string {
    return getBrandedEmailLayout({
      title: "NEW ORDER RECEIVED",
      preheader: `Order ${orderNumber} of INR ${grandTotal.toFixed(2)} placed.`,
      bodyHtml: `
        <p>A new order has been received on the BLUNT platform.</p>
        <p>Order Reference: <span class="highlight">${orderNumber}</span></p>
        <p>Grand Total: <span class="highlight">INR ${grandTotal.toFixed(2)}</span></p>
      `,
    });
  }

  getAdminLowStockHtml(productName: string, sku: string, stock: number): string {
    return getBrandedEmailLayout({
      title: "LOW STOCK WARNING",
      preheader: `SKU ${sku} is running low.`,
      bodyHtml: `
        <p>Warning: Variant <span class="highlight">${sku}</span> of product <span class="highlight">${productName}</span> is running low on stock.</p>
        <p>Current Inventory: <span class="highlight">${stock} left</span></p>
        <p>Please review and restock items to prevent purchase stockouts.</p>
      `,
    });
  }

  getAdminOutOfStockHtml(productName: string, sku: string): string {
    return getBrandedEmailLayout({
      title: "OUT OF STOCK ALERT",
      preheader: `SKU ${sku} is out of stock.`,
      bodyHtml: `
        <p>Alert: Variant <span class="highlight">${sku}</span> of product <span class="highlight">${productName}</span> is completely out of stock.</p>
        <p>This variant status has been set to out-of-stock. Purchases are locked for this SKU.</p>
      `,
    });
  }

  // --- RETURN & EXCHANGE TEMPLATES ---

  getReturnRequestedHtml(orderNumber: string): string {
    return getBrandedEmailLayout({
      title: "RETURN REQUEST RECEIVED",
      preheader: `Your return request for order ${orderNumber} is under review.`,
      bodyHtml: `
        <p>Hello,</p>
        <p>We have received your return/exchange request for order <span class="highlight">${orderNumber}</span>.</p>
        <p>Our quality assurance and fulfillment team is currently auditing your submission. You will receive an status update within 24-48 business hours.</p>
      `,
    });
  }

  getReturnApprovedHtml(orderNumber: string): string {
    return getBrandedEmailLayout({
      title: "RETURN REQUEST APPROVED",
      preheader: `Your return request for order ${orderNumber} has been approved.`,
      bodyHtml: `
        <p>Hello,</p>
        <p>Great news: your return request for order <span class="highlight">${orderNumber}</span> has been <span class="highlight" style="color: #BEF500;">APPROVED</span>.</p>
        <p>Our logistics partner will contact you shortly to coordinate collection schedules. Please keep the items in their original packaging with tags intact.</p>
      `,
    });
  }

  getReturnRejectedHtml(orderNumber: string, reason: string): string {
    return getBrandedEmailLayout({
      title: "RETURN REQUEST REJECTED",
      preheader: `Your return request for order ${orderNumber} was not approved.`,
      bodyHtml: `
        <p>Hello,</p>
        <p>We regret to inform you that your return request for order <span class="highlight">${orderNumber}</span> has been declined.</p>
        <p>Reason for rejection:</p>
        <div style="padding: 16px; border: 1px solid #2B2B2B; background-color: #0E0E0E; color: #E5E2E1; font-family: monospace; font-size: 13px; margin: 16px 0;">
          ${reason}
        </div>
        <p>If you believe this audit was processed in error, please contact our support desk.</p>
      `,
    });
  }

  getReturnPickupScheduledHtml(orderNumber: string, date: string): string {
    return getBrandedEmailLayout({
      title: "PICKUP SCHEDULED",
      preheader: `Pickup scheduled for order ${orderNumber}.`,
      bodyHtml: `
        <p>Hello,</p>
        <p>A return package collection run has been scheduled for order <span class="highlight">${orderNumber}</span>.</p>
        <p>Estimated pickup dispatch slot:</p>
        <div style="font-size: 20px; font-weight: bold; text-align: center; color: #BEF500; border: 1px solid #2B2B2B; background-color: #0E0E0E; padding: 20px; margin: 16px 0; text-transform: uppercase; letter-spacing: 0.05em;">
          ${date}
        </div>
        <p>Please ensure all products, packaging boxes, and tags are handed over to the courier representative.</p>
      `,
    });
  }

  getRefundCompletedHtml(orderNumber: string, amount: number): string {
    return getBrandedEmailLayout({
      title: "REFUND COMPLETED",
      preheader: `Refund issued for order ${orderNumber}.`,
      bodyHtml: `
        <p>Hello,</p>
        <p>We have processed your refund for order <span class="highlight">${orderNumber}</span>.</p>
        <p>A total amount of <span class="highlight" style="color: #BEF500;">$${amount.toFixed(2)}</span> has been credited back to your original payment gateway account.</p>
        <p>Depending on your banking institution, funds should reflect in your statement within 5-10 business days.</p>
      `,
    });
  }
}

export const emailService = new EmailService();
export default emailService;

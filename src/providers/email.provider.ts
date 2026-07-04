import { Resend } from "resend";
import { INotificationProvider, ISendNotificationResult } from "./notification-provider.interface.js";

export class EmailProvider implements INotificationProvider {
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY || "re_mock";
    this.resend = new Resend(apiKey);
  }

  async sendNotification(options: {
    recipient: string;
    subject?: string;
    content: string;
    metadata?: Record<string, any>;
  }): Promise<ISendNotificationResult> {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || "BLUNT <onboarding@resend.dev>";
      const response = await this.resend.emails.send({
        from: fromEmail,
        to: options.recipient,
        subject: options.subject || "BLUNT Notification",
        html: options.content,
      });

      if (response.error) {
        return {
          success: false,
          error: response.error.message,
        };
      }

      return {
        success: true,
        providerMessageId: response.data?.id || null,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || String(err),
      };
    }
  }
}

export default EmailProvider;

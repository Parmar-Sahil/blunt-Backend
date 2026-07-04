export interface ISendNotificationResult {
  success: boolean;
  providerMessageId?: string | null;
  error?: string | null;
}

export interface INotificationProvider {
  sendNotification(options: {
    recipient: string;
    subject?: string;
    content: string; // HTML content or text message body
    metadata?: Record<string, any>;
  }): Promise<ISendNotificationResult>;
}

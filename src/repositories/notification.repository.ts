import Notification, { INotification } from "../models/notification.model.js";

export class NotificationRepository {
  async findById(id: string): Promise<INotification | null> {
    return Notification.findById(id).populate("userId");
  }

  async findByNotificationId(notificationId: string): Promise<INotification | null> {
    return Notification.findOne({ notificationId }).populate("userId");
  }

  async create(data: Partial<INotification>): Promise<INotification> {
    const item = new Notification(data);
    return item.save();
  }

  async updateStatus(
    notificationId: string,
    status: "queued" | "sending" | "sent" | "failed",
    extra: Partial<INotification> = {}
  ): Promise<INotification | null> {
    return Notification.findOneAndUpdate(
      { notificationId },
      { status, ...extra },
      { new: true }
    );
  }

  async findPaginatedAdmin(options: {
    page: number;
    limit: number;
    channel?: string;
    status?: string;
    type?: string;
  }) {
    const query: Record<string, any> = {};

    if (options.channel) query.channel = options.channel;
    if (options.status) query.status = options.status;
    if (options.type) query.type = options.type;

    const skip = (options.page - 1) * options.limit;
    const [items, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit)
        .populate("userId", "name email")
        .lean(),
      Notification.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / options.limit);
    return { items, total, page: options.page, limit: options.limit, totalPages };
  }
}

export const notificationRepository = new NotificationRepository();
export default notificationRepository;

import Order, { IOrder } from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import mongoose from "mongoose";

export class OrderRepository {
  async findById(id: string): Promise<IOrder | null> {
    return Order.findById(id).populate("userId");
  }

  async findByOrderNumber(orderNumber: string): Promise<IOrder | null> {
    return Order.findOne({ orderNumber }).populate("userId");
  }

  async findByCheckoutId(checkoutId: string): Promise<IOrder | null> {
    return Order.findOne({ checkoutId }).populate("userId");
  }

  async create(data: Partial<IOrder>): Promise<IOrder> {
    const item = new Order(data);
    return item.save();
  }

  async update(id: string, updateData: Partial<IOrder>): Promise<IOrder | null> {
    return Order.findByIdAndUpdate(id, updateData, { new: true }).populate("userId");
  }

  async delete(id: string): Promise<IOrder | null> {
    return Order.findByIdAndDelete(id);
  }

  async findByUserIdPaginated(options: {
    userId: string;
    page: number;
    limit: number;
    status?: string;
  }) {
    const userFilter = mongoose.Types.ObjectId.isValid(options.userId)
      ? { $in: [options.userId, new mongoose.Types.ObjectId(options.userId)] }
      : options.userId;

    const query: Record<string, any> = { userId: userFilter };
    if (options.status && options.status !== "all") {
      query.status = options.status;
    }

    const skip = (options.page - 1) * options.limit;
    const [items, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / options.limit);
    return { items, total, page: options.page, limit: options.limit, totalPages };
  }

  async findPaginatedAdmin(options: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
    shippingStatus?: string;
    courier?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
  }) {
    const query: Record<string, any> = {};

    if (options.status) query.status = options.status;
    if (options.paymentStatus) query.paymentStatus = options.paymentStatus;
    if (options.shippingStatus) query.shippingStatus = options.shippingStatus;
    if (options.courier) query.courier = options.courier;
    
    if (options.userId) {
      query.userId = new mongoose.Types.ObjectId(options.userId);
    }

    if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) query.createdAt.$gte = new Date(options.startDate);
      if (options.endDate) query.createdAt.$lte = new Date(options.endDate);
    }

    // Customer Name & Email search mapping
    if (options.search) {
      const users = await UserModel.find({
        $or: [
          { name: new RegExp(options.search, "i") },
          { email: new RegExp(options.search, "i") },
        ],
      })
        .select("_id")
        .lean();
      const userIds = users.map((u: any) => u._id);

      query.$or = [
        { orderNumber: new RegExp(options.search, "i") },
        { trackingNumber: new RegExp(options.search, "i") },
        { userId: { $in: userIds } },
      ];
    }

    let sortOptions: Record<string, any> = { createdAt: -1 };
    if (options.sortBy) {
      switch (options.sortBy) {
        case "oldest":
          sortOptions = { createdAt: 1 };
          break;
        case "orderNumber-asc":
          sortOptions = { orderNumber: 1 };
          break;
        case "orderNumber-desc":
          sortOptions = { orderNumber: -1 };
          break;
        case "total-asc":
          sortOptions = { grandTotal: 1 };
          break;
        case "total-desc":
          sortOptions = { grandTotal: -1 };
          break;
      }
    }

    const skip = (options.page - 1) * options.limit;
    const [items, total] = await Promise.all([
      Order.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(options.limit)
        .populate("userId", "name email")
        .lean(),
      Order.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / options.limit);
    return { items, total, page: options.page, limit: options.limit, totalPages };
  }
}

export const orderRepository = new OrderRepository();
export default orderRepository;

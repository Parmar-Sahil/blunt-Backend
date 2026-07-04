import Payment, { IPayment } from "../models/payment.model.js";
import mongoose from "mongoose";

export class PaymentRepository {
  async findById(id: string): Promise<IPayment | null> {
    return Payment.findById(id).populate("userId");
  }

  async findByPaymentId(paymentId: string): Promise<IPayment | null> {
    return Payment.findOne({ paymentId }).populate("userId");
  }

  async findByTransactionId(transactionId: string): Promise<IPayment | null> {
    return Payment.findOne({ transactionId }).populate("userId");
  }

  async findByGatewayOrderId(gatewayOrderId: string): Promise<IPayment | null> {
    return Payment.findOne({ gatewayOrderId }).populate("userId");
  }

  async findByCheckoutId(checkoutId: string): Promise<IPayment | null> {
    return Payment.findOne({ checkoutId }).populate("userId");
  }

  async create(data: Partial<IPayment>): Promise<IPayment> {
    const item = new Payment(data);
    return item.save();
  }

  async update(id: string, updateData: Partial<IPayment>): Promise<IPayment | null> {
    return Payment.findByIdAndUpdate(id, updateData, { new: true }).populate("userId");
  }

  async updateByPaymentId(paymentId: string, updateData: Partial<IPayment>): Promise<IPayment | null> {
    return Payment.findOneAndUpdate({ paymentId }, updateData, { new: true }).populate("userId");
  }

  async findPaginatedAdmin(options: {
    page: number;
    limit: number;
    gateway?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const query: Record<string, any> = {};

    if (options.gateway) query.gateway = options.gateway;
    if (options.status) query.status = options.status;

    if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) query.createdAt.$gte = new Date(options.startDate);
      if (options.endDate) query.createdAt.$lte = new Date(options.endDate);
    }

    const skip = (options.page - 1) * options.limit;
    const [items, total] = await Promise.all([
      Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit)
        .populate("userId", "name email")
        .lean(),
      Payment.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / options.limit);
    return { items, total, page: options.page, limit: options.limit, totalPages };
  }
}

export const paymentRepository = new PaymentRepository();
export default paymentRepository;

import crypto from "crypto";
import mongoose from "mongoose";
import orderRepository from "../repositories/order.repository.js";
import checkoutService from "./checkout.service.js";
import cartService from "./cart.service.js";
import inventoryService from "./inventory.service.js";
import productRepository from "../repositories/product.repository.js";
import checkoutRepository from "../repositories/checkout.repository.js";
import UserModel from "../models/user.model.js";
import notificationService from "./notification.service.js";
import { NotFoundError, BadRequestError } from "../utils/errors.js";
import { IOrder } from "../models/order.model.js";
import ReturnRequest from "../models/returnRequest.model.js";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["out-for-delivery", "returned"],
  "out-for-delivery": ["delivered"],
  delivered: ["returned"],
  cancelled: [],
  returned: ["refunded"],
  refunded: [],
};

export class OrderService {
  async generateUniqueOrderNumber(): Promise<string> {
    const dateStr = new Date().toISOString().slice(2, 7).replace("-", ""); // e.g. "2607"
    let orderNumber = "";
    let isUnique = false;
    while (!isUnique) {
      const rand = Math.floor(10000 + Math.random() * 90000);
      orderNumber = `BLNT-${dateStr}-${rand}`;
      const exists = await orderRepository.findByOrderNumber(orderNumber);
      if (!exists) {
        isUnique = true;
      }
    }
    return orderNumber;
  }

  async createOrderFromCheckout(options: {
    userId: string;
    checkoutId: string;
    paymentId?: string | null;
    paymentVerified?: boolean;
    customerNotes?: string;
  }): Promise<IOrder> {
    const { userId, checkoutId, paymentId, paymentVerified = false, customerNotes = "" } = options;

    // 1. Retrieve and validate checkout session
    const checkoutSession = await checkoutService.getCheckoutSession(checkoutId, userId);
    if (checkoutSession.status !== "pending") {
      const existingOrder = await orderRepository.findByCheckoutId(checkoutId);
      if (existingOrder) {
        return existingOrder;
      }
      throw new BadRequestError(`CHECKOUT SESSION IS ALREADY '${checkoutSession.status.toUpperCase()}'`);
    }

    const orderNumber = await this.generateUniqueOrderNumber();
    const stockWarnings: string[] = [];
    const orderItemsSnapshot: any[] = [];

    // 2. Confirm stock reductions and build order items snapshot
    for (const item of checkoutSession.items) {
      let pId = String(item.productId);
      if (!pId || pId === "undefined" || pId.includes("{")) {
        const match = pId.match(/([0-9a-fA-F]{24})/);
        if (match) pId = match[1];
      }

      const product = await productRepository.findById(pId);
      if (!product) throw new NotFoundError("PRODUCT NOT FOUND");

      const variant = product.variants.find((v: any) => v.sku === item.variantId);
      if (!variant) throw new NotFoundError("PRODUCT VARIANT NOT FOUND");

      // Check for stock warning before deducting
      if (variant.stock < item.quantity) {
        stockWarnings.push(`INSUFFICIENT STOCK: SKU ${variant.sku} (${product.name} - ${variant.color}/${variant.size}). Ordered: ${item.quantity}, Available: ${variant.stock}`);
      }

      // Deduct inventory
      await inventoryService.confirmOrderStockReduction(pId, item.variantId, item.quantity);

      // Low Stock / Out of Stock alerts
      if (variant.stock === 0) {
        await notificationService.sendAdminOutOfStockAlert(product.name, variant.sku);
      } else if (variant.stock <= 5) {
        await notificationService.sendAdminLowStockWarning(product.name, variant.sku, variant.stock);
      }

      orderItemsSnapshot.push({
        productId: pId,
        variantId: item.variantId,
        productName: product.name,
        quote: product.quote || "",
        productImage: product.thumbnail || (product.images[0]?.url || ""),
        color: variant.color,
        size: variant.size,
        sku: variant.sku,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
      });
    }

    // 3. Create Order
    let finalUserId: string = "";
    if (typeof userId === "object" && userId !== null && "_id" in userId) {
      finalUserId = String((userId as any)._id);
    } else if (typeof userId === "string") {
      finalUserId = userId;
    } else if (checkoutSession.userId) {
      finalUserId = typeof checkoutSession.userId === "object" && "_id" in checkoutSession.userId
        ? String((checkoutSession.userId as any)._id)
        : String(checkoutSession.userId);
    }

    if (finalUserId && !mongoose.Types.ObjectId.isValid(finalUserId)) {
      const match = String(finalUserId).match(/([0-9a-fA-F]{24})/);
      if (match) finalUserId = match[1];
    }

    const orderStatus = "placed";
    const paymentStatus = paymentVerified ? "paid" : "pending";

    const sessionObj = checkoutSession.toObject ? checkoutSession.toObject() : checkoutSession;

    const initialAdminNotes = stockWarnings.length > 0
      ? `[SYSTEM WARNING: ${stockWarnings.join(" | ")}]\n`
      : "";

    const order = await orderRepository.create({
      orderNumber,
      userId: new mongoose.Types.ObjectId(finalUserId),
      checkoutId,
      paymentId: paymentId || null,
      paymentVerified,
      items: orderItemsSnapshot,
      subtotal: checkoutSession.subtotal,
      discount: checkoutSession.discount,
      shipping: checkoutSession.shipping,
      tax: checkoutSession.tax,
      grandTotal: checkoutSession.grandTotal,
      currency: "INR",
      shippingAddress: sessionObj.shippingAddress,
      billingAddress: sessionObj.billingAddress || sessionObj.shippingAddress,
      status: orderStatus,
      paymentStatus,
      shippingStatus: "pending",
      customerNotes,
      adminNotes: initialAdminNotes,
    });

    // 4. Clear Customer's Cart
    await cartService.clearCart({ userId: finalUserId });

    // 5. Complete checkout session status
    await checkoutRepository.updateStatus(checkoutId, "completed");

    // 6. Trigger order confirmation notifications
    const user: any = await UserModel.findById(finalUserId).lean();
    const recipientEmail = user?.email || (sessionObj?.shippingAddress as any)?.email;
    if (recipientEmail) {
      await notificationService.sendOrderConfirmation(
        finalUserId,
        recipientEmail,
        order.orderNumber,
        order.grandTotal,
        orderItemsSnapshot
      );
      await notificationService.sendAdminNewOrderAlert(order.orderNumber, order.grandTotal);
    }

    console.log(`[LOG] Order Created: ${order.orderNumber} (ID: ${order._id}) -> Email dispatched to: ${recipientEmail}`);
    return order;
  }

  async updateOrderStatus(orderId: string, status: string, actorId: string): Promise<IOrder> {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("ORDER NOT FOUND");

    const currentStatus = order.status;
    order.status = status as any;
    
    // Automatically update shippingStatus where applicable
    if (status === "shipped") {
      order.shippingStatus = "shipped";
    } else if (status === "out-for-delivery") {
      order.shippingStatus = "out-for-delivery";
    } else if (status === "delivered") {
      order.shippingStatus = "delivered";
      order.deliveredAt = new Date();
      order.returnEligibleUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      order.canReturn = true;
    } else if (status === "cancelled") {
      if (currentStatus === "pending" || currentStatus === "confirmed") {
        for (const item of order.items) {
          const product = await productRepository.findById(String(item.productId));
          if (product) {
            const variant = product.variants.find((v: any) => v.sku === item.variantId);
            if (variant) {
              variant.stock += item.quantity;
              variant.availableStock = variant.stock - variant.reservedStock;
              variant.status = "active";
              await product.save();
            }
          }
        }
      }
    }

    await order.save();
    console.log(`[LOG] Order Status Changed: Order ${order.orderNumber} status set to ${status} by actor ${actorId}`);

    // Trigger Status Update Emails
    const uId = order.userId && typeof order.userId === "object" && "_id" in order.userId
      ? String((order.userId as any)._id)
      : String(order.userId);

    const user: any = order.userId && typeof order.userId === "object" && "_id" in order.userId
      ? order.userId
      : await UserModel.findById(uId).lean();

    if (user) {
      if (status === "packed" || status === "shipped" || status === "out-for-delivery") {
        await notificationService.sendShipmentUpdate(
          uId,
          user.email,
          order.orderNumber,
          status,
          order.courier || undefined,
          order.trackingNumber || undefined
        );
      } else if (status === "delivered") {
        await notificationService.sendDelivered(uId, user.email, order.orderNumber);
      } else if (status === "cancelled") {
        await notificationService.sendCancelled(uId, user.email, order.orderNumber);
      }
    }

    return order;
  }

  async updateOrderShipping(
    orderId: string,
    courier: string,
    trackingNumber: string,
    actorId: string
  ): Promise<IOrder> {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("ORDER NOT FOUND");

    order.courier = courier;
    order.trackingNumber = trackingNumber;
    order.shippingStatus = "shipped";
    
    if (order.status === "confirmed" || order.status === "packed" || order.status === "pending") {
      order.status = "shipped";
    }

    await order.save();
    console.log(`[LOG] Order Shipping Updated: Order ${order.orderNumber} | Courier: ${courier} | Waybill: ${trackingNumber}`);

    // Send shipment update notification
    const uId = order.userId && typeof order.userId === "object" && "_id" in order.userId
      ? String((order.userId as any)._id)
      : String(order.userId);

    const user: any = order.userId && typeof order.userId === "object" && "_id" in order.userId
      ? order.userId
      : await UserModel.findById(uId).lean();

    if (user) {
      await notificationService.sendShipmentUpdate(
        uId,
        user.email,
        order.orderNumber,
        "shipped",
        courier,
        trackingNumber
      );
    }

    return order;
  }

  async updateOrderPayment(
    orderId: string,
    paymentStatus: string,
    paymentId: string | null,
    actorId: string
  ): Promise<IOrder> {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("ORDER NOT FOUND");

    order.paymentStatus = paymentStatus as any;
    if (paymentId) {
      order.paymentId = paymentId;
    }

    if (paymentStatus === "paid") {
      order.paymentVerified = true;
      if (order.status === "pending") {
        order.status = "confirmed";
      }
    }

    await order.save();
    console.log(`[LOG] Order Payment Updated: Order ${order.orderNumber} | Status: ${paymentStatus}`);

    // Trigger Success / Refund Notifications
    const uId = order.userId && typeof order.userId === "object" && "_id" in order.userId
      ? String((order.userId as any)._id)
      : String(order.userId);

    const user: any = order.userId && typeof order.userId === "object" && "_id" in order.userId
      ? order.userId
      : await UserModel.findById(uId).lean();

    if (user) {
      if (paymentStatus === "paid") {
        await notificationService.sendPaymentSuccess(
          uId,
          user.email,
          order.paymentId || "PAYMENT",
          order.grandTotal
        );
      } else if (paymentStatus === "refunded") {
        await notificationService.sendRefund(
          uId,
          user.email,
          order.orderNumber,
          order.grandTotal
        );
      }
    }

    return order;
  }

  async updateOrderNotes(orderId: string, adminNotes: string, actorId: string): Promise<IOrder> {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("ORDER NOT FOUND");

    order.adminNotes = adminNotes;
    await order.save();
    return order;
  }

  async getOrderById(id: string, userId: string, isAdmin: boolean = false): Promise<any> {
    const order = await orderRepository.findById(id);
    if (!order) throw new NotFoundError("ORDER NOT FOUND");

    const uId = order.userId && typeof order.userId === "object" && "_id" in order.userId
      ? String((order.userId as any)._id)
      : String(order.userId);

    if (!isAdmin && uId !== userId) {
      throw new BadRequestError("UNAUTHORIZED ACCESS TO THIS ORDER");
    }

    const orderObj = order.toObject ? order.toObject() : order;

    if (order.hasReturnRequest) {
      const returnRequest = await ReturnRequest.findOne({ orderId: id }).lean();
      if (returnRequest) {
        orderObj.returnRequest = returnRequest;
      }
    }

    return orderObj;
  }

  async getCustomerOrders(userId: string, page: number, limit: number, status?: string) {
    return orderRepository.findByUserIdPaginated({ userId, page, limit, status });
  }

  async getAdminOrders(options: any) {
    return orderRepository.findPaginatedAdmin(options);
  }
}

export const orderService = new OrderService();
export default orderService;

export class ShippingService {
  calculateShipping(
    subtotal: number,
    method: "Standard" | "Express" | "International" = "Standard",
    country: string = "IN"
  ): number {
    const STANDARD_FEE = parseFloat(process.env.SHIPPING_FEE_STANDARD || "15");
    const EXPRESS_FEE = parseFloat(process.env.SHIPPING_FEE_EXPRESS || "30");
    const INTERNATIONAL_FEE = parseFloat(process.env.SHIPPING_FEE_INTERNATIONAL || "60");

    // TODO: Shipping Providers - Integrate active APIs for FedEx, DHL, Delhivery, or Shiprocket.
    // TODO: Reward Points - Deduct shipping fees for loyal tier members.

    if (method === "International" || !["in", "india"].includes(country.toLowerCase())) {
      return INTERNATIONAL_FEE;
    }

    if (method === "Express") {
      return EXPRESS_FEE;
    }

    // Standard Shipping is free for orders over $150
    if (subtotal >= 150) {
      return 0;
    }

    return STANDARD_FEE;
  }
}

export const shippingService = new ShippingService();
export default shippingService;

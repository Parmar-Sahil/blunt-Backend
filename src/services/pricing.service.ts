export class PricingService {
  calculateSubtotal(items: { unitPrice: number; quantity: number }[]): number {
    return items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  }
}

export const pricingService = new PricingService();
export default pricingService;

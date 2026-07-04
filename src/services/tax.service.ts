export class TaxService {
  calculateTax(subtotal: number, country: string = "IN", state: string = ""): number {
    const DEFAULT_TAX_RATE = parseFloat(process.env.TAX_RATE_DEFAULT || "0.08"); // default 8%
    
    // TODO: International Taxes - Hook up Avalara or TaxJar APIs for multi-jurisdiction compliance.
    
    let rate = DEFAULT_TAX_RATE;
    
    // Preparation for state/country specific rules
    const countryLower = country.toLowerCase().trim();
    if (countryLower === "in" || countryLower === "india") {
      rate = 0.18; // 18% GST in India
    } else if (countryLower === "us" || countryLower === "united states") {
      // Stub for State-based calculations
      const stateLower = state.toLowerCase().trim();
      if (stateLower === "ny" || stateLower === "new york") {
        rate = 0.08875; // 8.875%
      } else if (stateLower === "ca" || stateLower === "california") {
        rate = 0.0725; // 7.25%
      }
    }
    
    return parseFloat((subtotal * rate).toFixed(2));
  }
}

export const taxService = new TaxService();
export default taxService;

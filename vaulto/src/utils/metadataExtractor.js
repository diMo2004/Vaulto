// ========================================
// 🚀 ADVANCED METADATA EXTRACTION ENGINE
// ========================================

// ----------------------------------------
// 1. Extract Store / Brand Name
// ----------------------------------------
export function extractStore(text) {
  const knownStores = [
    "Amazon", "Flipkart", "Myntra", "Ajio", "Zara", "H&M", "Starbucks",
    "Swiggy", "Zomato", "Uber", "Nike", "Adidas", "Decathlon", "Blinkit",
    "BigBasket", "Dominos", "Pizza Hut", "Nykaa"
  ];

  const cleanText = text.toLowerCase();

  for (const store of knownStores) {
    if (cleanText.includes(store.toLowerCase())) {
      return store;
    }
  }

  // fallback — first capitalized word (usually store name)
  const match = text.match(/\b[A-Z][A-Za-z]{3,}\b/);
  return match ? match[0] : "Unknown Store";
}

// ----------------------------------------
// 2. Extract Coupon Code
// ----------------------------------------
export function extractCouponCode(text) {
  // Common code patterns:
  // SAVE20, WELCOME100, GET50OFF, AB12CD, 20OFF, TRYNEW, etc.
  const patterns = [
    /\b[A-Z0-9]{5,12}\b/g,                   // ALL CAPS CODE ABC12345
    /\bSAVE[0-9]{1,3}\b/g,                   // SAVE20
    /\bGET[0-9]{1,3}\b/g,                    // GET50
    /\b[A-Z]{2,6}[0-9]{2,4}\b/g,             // WELCOME50
    /\b[0-9]{2}OFF\b/g                       // 20OFF
  ];

  for (const regex of patterns) {
    const match = text.match(regex);
    if (match) return match[0];
  }

  return "Not Detected";
}

// ----------------------------------------
// 3. Extract Discount
// ----------------------------------------
export function extractDiscount(text) {
  // Detect patterns: 20% OFF, FLAT ₹200 OFF, Buy 1 Get 1, etc.
  const percent = text.match(/\b([0-9]{1,3})%\s*off/i);
  if (percent) return percent[0];

  const flat = text.match(/₹\s*[0-9]{2,5}\s*off/i);
  if (flat) return flat[0];

  if (/buy\s*1\s*get\s*1/i.test(text)) return "Buy 1 Get 1 Free";
  if (/bogo/i.test(text)) return "BOGO Offer";

  return "Not Detected";
}

// ----------------------------------------
// 4. Extract Expiry Date
// ----------------------------------------
export function extractExpiry(text) {
  // Supports: 12/08/2025, 12-08-25, Aug 12 2025, Valid till 10th May, etc.
  const datePatterns = [
    /\b([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})\b/,            // 12/08/2025
    /\b([A-Za-z]{3,9}\s+[0-9]{1,2}[,]?\s*[0-9]{2,4})\b/,            // Aug 12 2025
    /\b(valid till|valid until|expires on)\s*([A-Za-z0-9 ,\-]+)/i   // Valid till May 2025
  ];

  for (const regex of datePatterns) {
    const match = text.match(regex);
    if (match) return match[0];
  }

  return "No expiry found";
}

// ----------------------------------------
// 5. Detect Category
// ----------------------------------------
export function detectCategory(store, text) {
  const lower = (store + " " + text).toLowerCase();

  if (lower.match(/food|restaurant|pizza|burger|swiggy|zomato|dominos|starbucks/))
    return "Food";

  if (lower.match(/shirt|clothes|fashion|myntra|ajio|zara|h&m/))
    return "Fashion";

  if (lower.match(/electronics|mobile|laptop|amazon|flipkart/))
    return "Electronics";

  if (lower.match(/travel|flight|hotel|uber/))
    return "Travel";

  return "Others";
}

// ----------------------------------------
// 6. MAIN FUNCTION — EXTRACT EVERYTHING
// ----------------------------------------
export function extractMetadata(text) {
  const store = extractStore(text);
  const code = extractCouponCode(text);
  const expiry = extractExpiry(text);
  const discount = extractDiscount(text);
  const category = detectCategory(store, text);

  return {
    store,
    code,
    expiry,
    discount,
    category,
    rawText: text
  };
}

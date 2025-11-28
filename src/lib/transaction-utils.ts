/**
 * Transaction utility functions
 */

/**
 * Validate transaction number format: ZEG-{branch_code}-{YYYYMMDD}-{sequence}
 */
export const validateTransactionNumber = (transactionNumber: string): boolean => {
  const pattern = /^ZEG-[A-Z0-9]+-\d{8}-\d{4}$/;
  return pattern.test(transactionNumber);
};

/**
 * Parse transaction number to extract components
 */
export const parseTransactionNumber = (transactionNumber: string): {
  branchCode: string;
  date: string;
  sequence: string;
} | null => {
  if (!validateTransactionNumber(transactionNumber)) {
    return null;
  }

  const parts = transactionNumber.split('-');
  return {
    branchCode: parts[1],
    date: parts[2],
    sequence: parts[3],
  };
};

/**
 * Format transaction number from components
 */
export const formatTransactionNumber = (
  branchCode: string,
  date: string,
  sequence: number
): string => {
  const sequenceStr = sequence.toString().padStart(4, '0');
  return `ZEG-${branchCode}-${date}-${sequenceStr}`;
};

/**
 * Calculate change for cash payment
 */
export const calculateChange = (amountReceived: number, total: number): number => {
  if (amountReceived < total) {
    return 0;
  }
  return amountReceived - total;
};

/**
 * Calculate discount amount from percentage
 */
export const calculateDiscountAmount = (subtotal: number, discountPercent: number): number => {
  if (discountPercent < 0 || discountPercent > 100) {
    return 0;
  }
  return (subtotal * discountPercent) / 100;
};

/**
 * Calculate final amount after discount
 */
export const calculateFinalAmount = (subtotal: number, discountAmount: number): number => {
  const final = subtotal - discountAmount;
  return final < 0 ? 0 : final;
};

/**
 * Calculate item total price
 */
export const calculateItemTotal = (quantity: number, unitPrice: number): number => {
  if (quantity < 0 || unitPrice < 0) {
    return 0;
  }
  return quantity * unitPrice;
};

/**
 * Calculate cart subtotal from items
 */
export const calculateCartSubtotal = (items: Array<{ quantity: number; unit_price: number }>): number => {
  return items.reduce((sum, item) => sum + calculateItemTotal(item.quantity, item.unit_price), 0);
};

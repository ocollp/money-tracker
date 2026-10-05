const monthIndex = key => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key || '')) return null;
  const [year, month] = key.split('-').map(Number);
  return year * 12 + month - 1;
};

export function carPaymentPlan(balance, share, firstDate, finalDate, now = new Date()) {
  const start = now.getFullYear() * 12 + now.getMonth();
  const first = monthIndex(firstDate);
  const final = monthIndex(finalDate);
  if (first == null || final == null || final <= first) return null;
  const available = balance == null ? null : Math.max(0, balance);
  const firstAmount = 12000 * share;
  const finalAmount = 14000 * share;
  const firstReserved = available == null ? null : Math.min(available, firstAmount);
  const finalReserved = available == null ? null : Math.min(Math.max(0, available - firstAmount), finalAmount);
  return [
    { amount: firstAmount, reserved: firstReserved, months: Math.max(0, first - start) },
    { amount: finalAmount, reserved: finalReserved, months: Math.max(0, final - Math.max(first, start)) },
  ].map(payment => ({ ...payment, missing: payment.reserved == null ? null : payment.amount - payment.reserved,
    monthly: payment.reserved == null || payment.months === 0 ? null : Math.ceil((payment.amount - payment.reserved) / payment.months) }));
}

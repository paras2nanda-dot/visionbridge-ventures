export const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return "₹ 0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
};
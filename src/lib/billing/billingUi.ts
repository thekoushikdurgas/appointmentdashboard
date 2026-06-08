export function isBillingServiceType(serviceType: string): boolean {
  return serviceType.trim().toLowerCase() === "billing";
}

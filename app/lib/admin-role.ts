export type DariRentRole = "renter" | "owner" | "admin";

export function roleForAuthenticatedEmail(
  email: string,
  configuredAdminEmail: string | undefined,
  fallbackRole: Exclude<DariRentRole, "admin"> = "renter",
): DariRentRole {
  const normalizedAdminEmail = configuredAdminEmail?.trim().toLowerCase();
  return normalizedAdminEmail && email.trim().toLowerCase() === normalizedAdminEmail
    ? "admin"
    : fallbackRole;
}

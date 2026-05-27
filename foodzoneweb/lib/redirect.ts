/**
 * Where a user lands after authenticating, based on their role.
 * Keeps login/register flows consistent across the user/vendor/admin portals.
 */
export function redirectAfterLogin(role?: string | null): string {
  switch (role) {
    case "vendor":
      return "/vendor";
    case "admin":
    case "super_admin":
      return "/admin";
    case "delivery":
      return "/delivery";
    default:
      return "/feed";
  }
}

/**
 * Where a user lands after authenticating, based on their role and whether
 * they've completed the new-user onboarding wizard yet.
 * Keeps login/register flows consistent across the user/vendor/admin portals.
 */
export function redirectAfterLogin(role?: string | null, onboardingCompleted?: boolean): string {
  // Customers see the 4-step wizard first if they haven't finished it yet.
  if ((!role || role === "user") && onboardingCompleted === false) {
    return "/onboarding";
  }
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

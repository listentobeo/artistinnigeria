import type { User } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/types";

const roles: AppRole[] = ["customer", "artist", "support", "admin"];

export function accountRole(user: User | null | undefined): AppRole {
  const role = String(user?.app_metadata?.role || "customer") as AppRole;
  return roles.includes(role) ? role : "customer";
}

export function isAdminUser(user: User | null | undefined) {
  return accountRole(user) === "admin";
}

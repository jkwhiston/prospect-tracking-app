import { DashboardClient } from "@/components/dashboard-client";
import { NonExistentModule } from "@/this-does-not-exist";

// Force dynamic rendering since we need runtime env vars
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <DashboardClient />;
}

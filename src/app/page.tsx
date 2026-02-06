import { DashboardClient } from "@/components/dashboard-client";

// Force dynamic rendering since we need runtime env vars
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <DashboardClient />;
}

import { DashboardClient } from "@/components/dashboard-client";

// Intentionally break build for protection setup
throw new Error("Build intentionally broken for protection setup");

// Force dynamic rendering since we need runtime env vars
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return <DashboardClient />;
}

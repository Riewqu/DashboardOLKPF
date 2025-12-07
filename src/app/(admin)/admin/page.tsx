import AdminClient from "./adminClient";
import { fetchPlatformData, fetchRecentUploads, fetchGoals } from "../../dataClient";
import EmptyState from "../../emptyState";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!supabaseAdmin) {
    return <EmptyState />;
  }

  const platforms = await fetchPlatformData();
  const recentUploads = await fetchRecentUploads();
  const now = new Date();
  const goals = await fetchGoals(now.getFullYear(), now.getMonth() + 1);

  return <AdminClient platforms={platforms} recentUploads={recentUploads} goals={goals} />;
}

import GoalsManagement from "./goalsManagement";
import { fetchPlatformData, fetchGoals } from "../../../dataClient";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  if (!supabaseAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Supabase is not configured</p>
      </div>
    );
  }

  const platforms = await fetchPlatformData();
  const now = new Date();
  const goals = await fetchGoals(now.getFullYear(), now.getMonth() + 1);

  return <GoalsManagement platforms={platforms} initialGoals={goals} />;
}

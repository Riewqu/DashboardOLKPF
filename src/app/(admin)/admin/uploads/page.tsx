import UploadCenter from "./uploadCenter";
import { fetchRecentUploads } from "../../../dataClient";
import { supabaseAdmin } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  if (!supabaseAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Supabase is not configured</p>
      </div>
    );
  }

  const recentUploads = await fetchRecentUploads();

  return <UploadCenter recentUploads={recentUploads} />;
}

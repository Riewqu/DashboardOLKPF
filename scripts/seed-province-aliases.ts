// Load env from .env.local when running standalone
import { config } from "dotenv";
import type { ThaiProvince } from "@/lib/provinceMapper";

// Load env before dynamic imports
config({ path: ".env.local" });
config();

const BATCH = 500;

async function main() {
  const { supabaseAdmin } = await import("@/lib/supabaseClient");
  const { PROVINCE_ALIASES } = await import("@/lib/provinceMapper");

  if (!supabaseAdmin) {
    console.error("Supabase not configured. Check env.");
    process.exit(1);
  }

  const rows: { standard_th: ThaiProvince; alias: string }[] = [];
  Object.entries(PROVINCE_ALIASES).forEach(([standard, aliases]) => {
    aliases.forEach((alias) => {
      rows.push({ standard_th: standard as ThaiProvince, alias: alias.toLowerCase() });
    });
  });

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabaseAdmin
      .from("province_aliases")
      .upsert(chunk, { onConflict: "standard_th,alias" });
    if (error) {
      console.error("Upsert failed at batch", i / BATCH, error.message);
      process.exit(1);
    }
  }

  console.log(`Seeded ${rows.length} aliases to province_aliases`);
}

main();

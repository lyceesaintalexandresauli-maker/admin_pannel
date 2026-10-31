import { getSupabaseBrowserClient } from "../supabase";

const PAGE_SIZE = 500;

/** Fetch every public event row in pages, avoiding Supabase's per-request row cap. */
export async function fetchAllEventsFromSupabase() {
  const supabase = getSupabaseBrowserClient();
  const events = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;
    const page = data || [];
    events.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return events;
}

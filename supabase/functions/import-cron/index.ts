import { createClient } from "npm:@supabase/supabase-js@2";
import { logConsumption } from '../_shared/consumption.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Find all active scheduled imports due now
    const now = new Date().toISOString();
    const { data: schedules, error } = await supabase
      .from("scheduled_imports")
      .select("*")
      .eq("is_active", true)
      .lte("next_run_at", now);

    if (error) throw error;
    if (!schedules || schedules.length === 0) {
      return new Response(JSON.stringify({ message: "No scheduled imports due", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[import-cron] Found ${schedules.length} scheduled imports to run`);

    const results: any[] = [];

    for (const schedule of schedules) {
      try {
        // Create job in unified `jobs` table
        const { data: job } = await supabase
          .from("jobs")
          .insert({
            user_id: schedule.user_id,
            job_type: "scheduled_import",
            status: "running",
            name: `Import planifié: ${schedule.name}`,
            metadata: {
              schedule_id: schedule.id,
              source_type: schedule.source_type,
              source_url: schedule.source_url,
            },
            started_at: now,
          })
          .select("id")
          .single();

        // Track consumption
        await logConsumption(supabase, { userId: schedule.user_id, action: 'scheduled_import', metadata: { schedule_id: schedule.id, job_id: job?.id } });

        // Trigger the actual import via the appropriate edge function
        let importFnName = "quick-import-url";
        const importBody: any = { url: schedule.source_url };

        if (schedule.source_type === "csv" || schedule.source_type === "csv_feed") {
          importFnName = "csv-import";
          importBody.feed_url = schedule.source_url;
        }

        // Call the import function with the user's auth context via service role
        // We create a mock auth header using service role
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        
        // For cron-triggered imports, we store results directly
        // The actual scraping/import logic should be handled by existing functions
        // For now, we update the schedule status
        
        const nextRun = calculateNextRun(schedule.frequency, schedule.cron_expression);

        await supabase
          .from("scheduled_imports")
          .update({
            last_run_at: now,
            last_run_status: "running",
            next_run_at: nextRun,
          })
          .eq("id", schedule.id);

        // Try to invoke the import function
        const importResponse = await fetch(
          `${supabaseUrl}/functions/v1/${importFnName}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...importBody,
              user_id_override: schedule.user_id, // Service role context
              scheduled: true,
              schedule_id: schedule.id,
              ...(schedule.config || {}),
            }),
          }
        );

        const importResult = await importResponse.json().catch(() => ({}));
        const success = importResponse.ok;

        // Update schedule with result
        await supabase
          .from("scheduled_imports")
          .update({
            last_run_status: success ? "completed" : "failed",
            products_imported: (schedule.products_imported || 0) + (importResult?.products_count || 0),
          })
          .eq("id", schedule.id);

        // Update background job
        if (job?.id) {
          await supabase
            .from("jobs")
            .update({
              status: success ? "completed" : "failed",
              completed_at: new Date().toISOString(),
              error_message: success ? null : (importResult?.error || "Import failed"),
              progress_percent: 100,
            })
            .eq("id", job.id);
        }

        results.push({ schedule_id: schedule.id, name: schedule.name, success });
      } catch (schedErr) {
        console.error(`[import-cron] Error processing schedule ${schedule.id}:`, schedErr);
        await supabase
          .from("scheduled_imports")
          .update({ last_run_status: "failed" })
          .eq("id", schedule.id);
        results.push({ schedule_id: schedule.id, name: schedule.name, success: false, error: String(schedErr) });
      }
    }

    return new Response(
      JSON.stringify({ message: "Cron completed", count: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[import-cron] Fatal error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calculateNextRun(frequency: string, cronExpr?: string | null): string {
  const now = new Date();
  switch (frequency) {
    case "hourly":
      now.setHours(now.getHours() + 1);
      break;
    case "every_6h":
      now.setHours(now.getHours() + 6);
      break;
    case "every_12h":
      now.setHours(now.getHours() + 12);
      break;
    case "daily":
      now.setDate(now.getDate() + 1);
      break;
    case "weekly":
      now.setDate(now.getDate() + 7);
      break;
    case "monthly":
      now.setMonth(now.getMonth() + 1);
      break;
    default:
      // Default to daily
      now.setDate(now.getDate() + 1);
  }
  return now.toISOString();
}

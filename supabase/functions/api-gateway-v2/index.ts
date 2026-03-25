
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-version",
};

/**
 * API Versioning Gateway
 * Routes requests based on X-Api-Version header or URL prefix.
 * Supports: v1 (stable), v2 (beta)
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const headerVersion = req.headers.get("x-api-version");
    const pathMatch = url.pathname.match(/\/(v\d+)\//);
    const version = headerVersion || pathMatch?.[1] || "v1";

    const supportedVersions = ["v1", "v2"];
    const deprecatedVersions: Record<string, string> = {};
    const sunsetVersions: Record<string, string> = {};

    if (!supportedVersions.includes(version)) {
      return new Response(JSON.stringify({
        error: "Unsupported API version",
        supported_versions: supportedVersions,
        current_version: version,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-Api-Version": version,
      "X-Supported-Versions": supportedVersions.join(", "),
    };

    if (deprecatedVersions[version]) {
      responseHeaders["Deprecation"] = "true";
      responseHeaders["X-Deprecated-Message"] = `This version is deprecated. Migrate to ${deprecatedVersions[version]}`;
    }

    if (sunsetVersions[version]) {
      responseHeaders["Sunset"] = sunsetVersions[version];
    }

    // Version-specific routing
    const body = await req.json().catch(() => ({}));
    const resource = body.resource || "info";

    let result: Record<string, unknown>;

    if (resource === "info") {
      result = {
        api_version: version,
        supported_versions: supportedVersions,
        deprecated_versions: Object.keys(deprecatedVersions),
        endpoints: version === "v2"
          ? ["products", "orders", "customers", "analytics", "ai", "webhooks"]
          : ["products", "orders", "customers", "analytics"],
        changelog: {
          v2: "Added AI endpoints, webhook management, batch operations",
          v1: "Initial stable release — products, orders, customers, analytics",
        },
      };
    } else {
      result = {
        version,
        resource,
        message: `Route to ${version}/${resource} handler`,
        timestamp: new Date().toISOString(),
      };
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

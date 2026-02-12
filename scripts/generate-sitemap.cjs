const fs = require("fs");

const base = "https://shopopti.io";
const today = new Date().toISOString().split("T")[0];

const routes = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/features", changefreq: "weekly", priority: "0.9" },
  { path: "/features/ai-optimization", changefreq: "monthly", priority: "0.8" },
  { path: "/features/multi-marketplace", changefreq: "monthly", priority: "0.8" },
  { path: "/features/analytics", changefreq: "monthly", priority: "0.8" },
  { path: "/pricing", changefreq: "weekly", priority: "0.9" },
  { path: "/blog", changefreq: "daily", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/documentation", changefreq: "weekly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/integrations", changefreq: "weekly", priority: "0.7" },
  { path: "/testimonials", changefreq: "monthly", priority: "0.6" },
  { path: "/changelog", changefreq: "weekly", priority: "0.5" },
  { path: "/status", changefreq: "daily", priority: "0.4" },
  // SaaS SEO pages
  { path: "/logiciel-dropshipping", changefreq: "monthly", priority: "0.9" },
  { path: "/alternative-autods", changefreq: "monthly", priority: "0.9" },
  { path: "/optimisation-shopify", changefreq: "monthly", priority: "0.9" },
  { path: "/gestion-catalogue-ecommerce", changefreq: "monthly", priority: "0.9" },
  // Legal
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms-of-service", changefreq: "yearly", priority: "0.3" },
];

const urls = routes
  .map(
    (r) => `
  <url>
    <loc>${base}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join("");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls}
</urlset>`;

fs.writeFileSync("public/sitemap.xml", xml.trim() + "\n", "utf8");
console.log("✅ sitemap.xml generated with", routes.length, "URLs");

const fs = require("fs");
const routes = [
  "/", "/import", "/pricing", "/contact", "/blog", "/seo", "/seo/keyword-research", 
  "/seo/competitor-analysis", "/seo/schema-generator", "/seo/rank-tracker", "/seo/analytics"
];

const base = "https://www.shopopti.io";
const today = new Date().toISOString().split("T")[0];

const urls = routes.map((p) => `
  <url>
    <loc>${base}${p === "/" ? "/" : p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p === "/" ? "weekly" : "monthly"}</changefreq>
    <priority>${p === "/" ? "1.0" : "0.8"}</priority>
  </url>`).join("");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

fs.writeFileSync("public/sitemap.xml", xml.trim() + "\n", "utf8");
console.log("✅ sitemap.xml generated");
/**
 * Génération de rapports PDF côté serveur
 * Utilise une approche HTML-to-PDF simple
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportConfig {
  type: 'sales' | 'orders' | 'products' | 'customers' | 'inventory';
  title: string;
  dateRange?: {
    start: string;
    end: string;
  };
  format?: 'pdf' | 'csv' | 'xlsx';
  filters?: Record<string, any>;
}

const logStep = (step: string, details?: any) => {
  console.log(`[GENERATE-PDF-REPORT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

async function generateSalesReport(supabase: any, userId: string, dateRange?: { start: string; end: string }) {
  let query = supabase
    .from('orders')
    .select('id, order_number, total_amount, status, created_at, customer_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (dateRange?.start) {
    query = query.gte('created_at', dateRange.start);
  }
  if (dateRange?.end) {
    query = query.lte('created_at', dateRange.end);
  }

  const { data: orders, error } = await query.limit(500);
  if (error) throw error;

  const totalRevenue = orders?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0;
  const avgOrderValue = orders?.length ? totalRevenue / orders.length : 0;

  return {
    title: 'Rapport des Ventes',
    summary: {
      'Total des ventes': formatCurrency(totalRevenue),
      'Nombre de commandes': orders?.length || 0,
      'Panier moyen': formatCurrency(avgOrderValue),
    },
    columns: ['N° Commande', 'Date', 'Montant', 'Statut'],
    rows: orders?.map((o: any) => [
      o.order_number || o.id.slice(0, 8),
      formatDate(o.created_at),
      formatCurrency(o.total_amount || 0),
      o.status || 'En attente'
    ]) || [],
  };
}

async function generateProductsReport(supabase: any, userId: string) {
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, sku, price, stock_quantity, status, category')
    .eq('user_id', userId)
    .order('title')
    .limit(500);

  if (error) throw error;

  const totalValue = products?.reduce((sum: number, p: any) => sum + ((p.price || 0) * (p.stock_quantity || 0)), 0) || 0;
  const lowStock = products?.filter((p: any) => (p.stock_quantity || 0) < 10).length || 0;

  return {
    title: 'Rapport des Produits',
    summary: {
      'Total produits': products?.length || 0,
      'Valeur du stock': formatCurrency(totalValue),
      'Produits en stock faible': lowStock,
    },
    columns: ['Produit', 'SKU', 'Prix', 'Stock', 'Catégorie'],
    rows: products?.map((p: any) => [
      p.title || 'Sans nom',
      p.sku || '-',
      formatCurrency(p.price || 0),
      p.stock_quantity?.toString() || '0',
      p.category || 'Non catégorisé'
    ]) || [],
  };
}

async function generateCustomersReport(supabase: any, userId: string) {
  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, first_name, last_name, email, total_spent, orders_count, created_at')
    .eq('user_id', userId)
    .order('total_spent', { ascending: false })
    .limit(500);

  if (error) throw error;

  const totalSpent = customers?.reduce((sum: number, c: any) => sum + (c.total_spent || 0), 0) || 0;
  const avgSpent = customers?.length ? totalSpent / customers.length : 0;

  return {
    title: 'Rapport des Clients',
    summary: {
      'Total clients': customers?.length || 0,
      'Total dépensé': formatCurrency(totalSpent),
      'Dépense moyenne': formatCurrency(avgSpent),
    },
    columns: ['Client', 'Email', 'Commandes', 'Total dépensé', 'Depuis'],
    rows: customers?.map((c: any) => [
      `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Anonyme',
      c.email || '-',
      c.orders_count?.toString() || '0',
      formatCurrency(c.total_spent || 0),
      formatDate(c.created_at)
    ]) || [],
  };
}

function generateHTML(report: { title: string; summary: Record<string, any>; columns: string[]; rows: string[][] }) {
  const summaryHtml = Object.entries(report.summary)
    .map(([key, value]) => `
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center;">
        <div style="font-size: 12px; color: #666; margin-bottom: 5px;">${key}</div>
        <div style="font-size: 20px; font-weight: bold; color: #333;">${value}</div>
      </div>
    `).join('');

  const tableRows = report.rows.map(row => `
    <tr>
      ${row.map(cell => `<td style="padding: 10px; border-bottom: 1px solid #eee;">${cell}</td>`).join('')}
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${report.title}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #333; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
    .date { color: #666; font-size: 14px; }
    h1 { color: #1a1a1a; margin: 0 0 30px 0; font-size: 28px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #3b82f6; color: white; padding: 12px; text-align: left; font-weight: 600; }
    tr:nth-child(even) { background: #f8f9fa; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Shopopti</div>
    <div class="date">Généré le ${new Date().toLocaleDateString('fr-FR')}</div>
  </div>
  
  <h1>${report.title}</h1>
  
  <div class="summary">
    ${summaryHtml}
  </div>
  
  <table>
    <thead>
      <tr>
        ${report.columns.map(col => `<th>${col}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
  
  <div class="footer">
    <p>Rapport généré automatiquement par Shopopti - ${new Date().toISOString()}</p>
  </div>
</body>
</html>
  `;
}

function generateCSV(report: { columns: string[]; rows: string[][] }): string {
  const header = report.columns.join(',');
  const rows = report.rows.map(row => 
    row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  return `${header}\n${rows}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Report generation request received");

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Authorization header required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { 
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false } 
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Authentication required");
    }

    const config: ReportConfig = await req.json();
    logStep("Generating report", { type: config.type, format: config.format });

    // Use service role for data access
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    let report;
    switch (config.type) {
      case 'sales':
      case 'orders':
        report = await generateSalesReport(adminSupabase, user.id, config.dateRange);
        break;
      case 'products':
      case 'inventory':
        report = await generateProductsReport(adminSupabase, user.id);
        break;
      case 'customers':
        report = await generateCustomersReport(adminSupabase, user.id);
        break;
      default:
        throw new Error(`Unknown report type: ${config.type}`);
    }

    const format = config.format || 'pdf';
    let content: string;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      content = generateCSV(report);
      contentType = 'text/csv';
      filename = `${config.type}-report-${Date.now()}.csv`;
    } else {
      // Return HTML (can be converted to PDF client-side or via external service)
      content = generateHTML(report);
      contentType = 'text/html';
      filename = `${config.type}-report-${Date.now()}.html`;
    }

    logStep("Report generated successfully", { 
      type: config.type, 
      format,
      rowCount: report.rows.length 
    });

    return new Response(content, {
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

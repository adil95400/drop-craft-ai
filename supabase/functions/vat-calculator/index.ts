import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// EU VAT rates (2024) - Standard rates
const EU_VAT_RATES: Record<string, { standard: number; reduced: number; country: string }> = {
  AT: { standard: 20, reduced: 10, country: 'Austria' },
  BE: { standard: 21, reduced: 6, country: 'Belgium' },
  BG: { standard: 20, reduced: 9, country: 'Bulgaria' },
  HR: { standard: 25, reduced: 5, country: 'Croatia' },
  CY: { standard: 19, reduced: 5, country: 'Cyprus' },
  CZ: { standard: 21, reduced: 12, country: 'Czech Republic' },
  DK: { standard: 25, reduced: 0, country: 'Denmark' },
  EE: { standard: 22, reduced: 9, country: 'Estonia' },
  FI: { standard: 25.5, reduced: 10, country: 'Finland' },
  FR: { standard: 20, reduced: 5.5, country: 'France' },
  DE: { standard: 19, reduced: 7, country: 'Germany' },
  GR: { standard: 24, reduced: 6, country: 'Greece' },
  HU: { standard: 27, reduced: 5, country: 'Hungary' },
  IE: { standard: 23, reduced: 9, country: 'Ireland' },
  IT: { standard: 22, reduced: 5, country: 'Italy' },
  LV: { standard: 21, reduced: 12, country: 'Latvia' },
  LT: { standard: 21, reduced: 9, country: 'Lithuania' },
  LU: { standard: 17, reduced: 8, country: 'Luxembourg' },
  MT: { standard: 18, reduced: 5, country: 'Malta' },
  NL: { standard: 21, reduced: 9, country: 'Netherlands' },
  PL: { standard: 23, reduced: 5, country: 'Poland' },
  PT: { standard: 23, reduced: 6, country: 'Portugal' },
  RO: { standard: 19, reduced: 5, country: 'Romania' },
  SK: { standard: 23, reduced: 10, country: 'Slovakia' },
  SI: { standard: 22, reduced: 5, country: 'Slovenia' },
  ES: { standard: 21, reduced: 4, country: 'Spain' },
  SE: { standard: 25, reduced: 6, country: 'Sweden' },
  // Non-EU but commonly needed
  GB: { standard: 20, reduced: 5, country: 'United Kingdom' },
  CH: { standard: 8.1, reduced: 2.6, country: 'Switzerland' },
  NO: { standard: 25, reduced: 12, country: 'Norway' },
};

// OSS threshold (EU-wide since July 2021)
const OSS_THRESHOLD = 10000; // €10,000

interface VatRequest {
  action: 'calculate' | 'get-rates' | 'check-oss-threshold' | 'validate-vat-number';
  country_code?: string;
  amount?: number;
  rate_type?: 'standard' | 'reduced';
  annual_eu_sales?: number;
  vat_number?: string;
  seller_country?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: VatRequest = await req.json();

    switch (body.action) {
      case 'get-rates': {
        const rates = body.country_code
          ? { [body.country_code]: EU_VAT_RATES[body.country_code.toUpperCase()] }
          : EU_VAT_RATES;
        return new Response(JSON.stringify({ rates, oss_threshold: OSS_THRESHOLD }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'calculate': {
        const code = (body.country_code || '').toUpperCase();
        const rate = EU_VAT_RATES[code];
        if (!rate) {
          return new Response(JSON.stringify({ error: `Unknown country: ${code}` }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const vatRate = body.rate_type === 'reduced' ? rate.reduced : rate.standard;
        const amount = body.amount || 0;
        const vatAmount = +(amount * vatRate / 100).toFixed(2);
        const totalWithVat = +(amount + vatAmount).toFixed(2);

        return new Response(JSON.stringify({
          country: rate.country,
          country_code: code,
          net_amount: amount,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          total_with_vat: totalWithVat,
          rate_type: body.rate_type || 'standard',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check-oss-threshold': {
        const sales = body.annual_eu_sales || 0;
        const exceeds = sales > OSS_THRESHOLD;
        const sellerCountry = (body.seller_country || 'FR').toUpperCase();

        return new Response(JSON.stringify({
          annual_eu_sales: sales,
          oss_threshold: OSS_THRESHOLD,
          exceeds_threshold: exceeds,
          recommendation: exceeds
            ? 'You must register for OSS and charge destination-country VAT rates.'
            : `Below threshold — you may charge ${sellerCountry} VAT rate for all EU B2C sales.`,
          seller_country: sellerCountry,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'validate-vat-number': {
        const vatNum = (body.vat_number || '').replace(/\s/g, '').toUpperCase();
        const countryPrefix = vatNum.substring(0, 2);
        const isValidFormat = /^[A-Z]{2}[A-Z0-9]{2,13}$/.test(vatNum);
        const countryExists = !!EU_VAT_RATES[countryPrefix];

        return new Response(JSON.stringify({
          vat_number: vatNum,
          country_prefix: countryPrefix,
          valid_format: isValidFormat,
          country_recognized: countryExists,
          note: 'For full VIES validation, integrate with the EU VIES API.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

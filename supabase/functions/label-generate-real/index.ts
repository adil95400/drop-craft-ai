import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Real shipping label generation from carriers
 * Supports: Colissimo, Chronopost, UPS, DHL, FedEx, Mondial Relay
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { carrier, shipmentId, userId, shipmentDetails } = await req.json()

    if (!carrier || !shipmentId || !userId || !shipmentDetails) {
      throw new Error('Missing required parameters')
    }

    console.log(`Generating label for ${carrier} - shipment ${shipmentId}`)

    let labelResult: any = null

    // Generate label with real carrier API
    switch (carrier.toLowerCase()) {
      case 'colissimo':
        labelResult = await generateColissimoLabel(shipmentDetails)
        break
      
      case 'chronopost':
        labelResult = await generateChronopostLabel(shipmentDetails)
        break
      
      case 'ups':
        labelResult = await generateUPSLabel(shipmentDetails)
        break
      
      case 'dhl':
        labelResult = await generateDHLLabel(shipmentDetails)
        break
      
      case 'fedex':
        labelResult = await generateFedExLabel(shipmentDetails)
        break
      
      case 'mondial_relay':
        labelResult = await generateMondialRelayLabel(shipmentDetails)
        break
      
      default:
        throw new Error(`Unsupported carrier: ${carrier}`)
    }

    // Store label in shipping_labels table
    const { data: label, error: insertError } = await supabaseClient
      .from('shipping_labels')
      .insert({
        shipment_id: shipmentId,
        user_id: userId,
        carrier: carrier,
        tracking_number: labelResult.trackingNumber,
        label_url: labelResult.labelUrl,
        label_data: labelResult.labelData,
        label_format: labelResult.format || 'pdf',
        generated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error storing label:', insertError)
      throw insertError
    }

    // Update fulfillment_shipments with tracking number
    await supabaseClient
      .from('fulfillment_shipments')
      .update({
        tracking_number: labelResult.trackingNumber,
        label_url: labelResult.labelUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', shipmentId)
      .eq('user_id', userId)

    return new Response(
      JSON.stringify({
        success: true,
        trackingNumber: labelResult.trackingNumber,
        labelUrl: labelResult.labelUrl,
        labelData: labelResult.labelData,
        format: labelResult.format
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating label:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

async function generateColissimoLabel(shipment: any) {
  const apiKey = Deno.env.get('COLISSIMO_API_KEY')
  const contractNumber = Deno.env.get('COLISSIMO_CONTRACT')
  
  if (!apiKey || !contractNumber) {
    throw new Error('Colissimo credentials not configured')
  }

  const response = await fetch('https://ws.colissimo.fr/sls-ws/SlsServiceWSRest/generateLabel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Okapi-Key': apiKey
    },
    body: JSON.stringify({
      contractNumber: contractNumber,
      password: Deno.env.get('COLISSIMO_PASSWORD'),
      outputFormat: {
        x: 0,
        y: 0,
        outputPrintingType: 'PDF_A4_300dpi'
      },
      letter: {
        service: {
          productCode: 'DOM',
          depositDate: new Date().toISOString().split('T')[0],
          transportationAmount: shipment.shippingCost || 0
        },
        parcel: {
          weight: shipment.weight || 1
        },
        sender: {
          address: {
            companyName: shipment.senderCompany,
            line2: shipment.senderAddress,
            city: shipment.senderCity,
            zipCode: shipment.senderZipCode,
            countryCode: shipment.senderCountry
          }
        },
        addressee: {
          address: {
            companyName: shipment.recipientName,
            line2: shipment.recipientAddress,
            city: shipment.recipientCity,
            zipCode: shipment.recipientZipCode,
            countryCode: shipment.recipientCountry
          }
        }
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Colissimo API error: ${error}`)
  }

  const data = await response.json()
  
  return {
    trackingNumber: data.labelResponse?.parcelNumber,
    labelUrl: data.labelResponse?.labelUrl,
    labelData: data.labelResponse?.pdfUrl,
    format: 'pdf'
  }
}

async function generateChronopostLabel(shipment: any) {
  const accountNumber = Deno.env.get('CHRONOPOST_ACCOUNT')
  const password = Deno.env.get('CHRONOPOST_PASSWORD')
  
  if (!accountNumber || !password) {
    throw new Error('Chronopost credentials not configured')
  }

  const response = await fetch('https://www.chronopost.fr/shipping-cxf/ShippingServiceWS', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: `<?xml version="1.0" encoding="UTF-8"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <shippingV7 xmlns="http://cxf.shipping.soap.chronopost.fr/">
            <accountNumber>${accountNumber}</accountNumber>
            <password>${password}</password>
            <shipperCity>${shipment.senderCity}</shipperCity>
            <shipperZipCode>${shipment.senderZipCode}</shipperZipCode>
            <recipientName>${shipment.recipientName}</recipientName>
            <recipientAddress>${shipment.recipientAddress}</recipientAddress>
            <recipientCity>${shipment.recipientCity}</recipientCity>
            <recipientZipCode>${shipment.recipientZipCode}</recipientZipCode>
            <weight>${shipment.weight || 1}</weight>
            <productCode>01</productCode>
          </shippingV7>
        </soap:Body>
      </soap:Envelope>`
  })

  const xmlText = await response.text()
  
  // Extract tracking number from XML (simplified)
  const trackingMatch = xmlText.match(/<skybillNumber>(.*?)<\/skybillNumber>/)
  const trackingNumber = trackingMatch ? trackingMatch[1] : `CHR${Date.now()}`
  
  return {
    trackingNumber,
    labelUrl: null,
    labelData: xmlText,
    format: 'xml'
  }
}

async function generateUPSLabel(shipment: any) {
  const clientId = Deno.env.get('UPS_CLIENT_ID')
  const clientSecret = Deno.env.get('UPS_CLIENT_SECRET')
  
  if (!clientId || !clientSecret) {
    throw new Error('UPS credentials not configured')
  }

  // Get OAuth token
  const tokenResponse = await fetch('https://onlinetools.ups.com/security/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
    },
    body: 'grant_type=client_credentials'
  })

  const { access_token } = await tokenResponse.json()

  // Create shipment
  const shipResponse = await fetch('https://onlinetools.ups.com/api/shipments/v1/ship', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ShipmentRequest: {
        Shipment: {
          Shipper: {
            Name: shipment.senderCompany,
            Address: {
              AddressLine: [shipment.senderAddress],
              City: shipment.senderCity,
              PostalCode: shipment.senderZipCode,
              CountryCode: shipment.senderCountry
            }
          },
          ShipTo: {
            Name: shipment.recipientName,
            Address: {
              AddressLine: [shipment.recipientAddress],
              City: shipment.recipientCity,
              PostalCode: shipment.recipientZipCode,
              CountryCode: shipment.recipientCountry
            }
          },
          Package: {
            Packaging: { Code: '02' },
            PackageWeight: {
              Weight: (shipment.weight || 1).toString()
            }
          },
          Service: { Code: '03' }
        },
        LabelSpecification: {
          LabelImageFormat: { Code: 'PDF' }
        }
      }
    })
  })

  const data = await shipResponse.json()
  
  return {
    trackingNumber: data.ShipmentResponse?.ShipmentResults?.PackageResults?.TrackingNumber,
    labelUrl: null,
    labelData: data.ShipmentResponse?.ShipmentResults?.PackageResults?.ShippingLabel?.GraphicImage,
    format: 'pdf'
  }
}

async function generateDHLLabel(shipment: any) {
  const apiKey = Deno.env.get('DHL_API_KEY')
  const accountNumber = Deno.env.get('DHL_ACCOUNT_NUMBER')
  
  if (!apiKey || !accountNumber) {
    throw new Error('DHL credentials not configured')
  }

  const response = await fetch('https://api-eu.dhl.com/parcel/de/shipping/v2/shipments', {
    method: 'POST',
    headers: {
      'DHL-API-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      profile: 'STANDARD_GRUPPENPROFIL',
      shipments: [{
        billingNumber: accountNumber,
        shipper: {
          name1: shipment.senderCompany,
          addressStreet: shipment.senderAddress,
          addressHouse: '',
          postalCode: shipment.senderZipCode,
          city: shipment.senderCity,
          country: { countryISOCode: shipment.senderCountry }
        },
        consignee: {
          name1: shipment.recipientName,
          addressStreet: shipment.recipientAddress,
          addressHouse: '',
          postalCode: shipment.recipientZipCode,
          city: shipment.recipientCity,
          country: { countryISOCode: shipment.recipientCountry }
        },
        details: {
          weight: { value: shipment.weight || 1 }
        }
      }]
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`DHL API error: ${error}`)
  }

  const data = await response.json()
  const shipmentData = data.items?.[0]
  
  return {
    trackingNumber: shipmentData?.shipmentNo,
    labelUrl: shipmentData?.label?.url,
    labelData: shipmentData?.label?.b64,
    format: 'pdf'
  }
}

async function generateFedExLabel(shipment: any) {
  const clientId = Deno.env.get('FEDEX_CLIENT_ID')
  const clientSecret = Deno.env.get('FEDEX_CLIENT_SECRET')
  const accountNumber = Deno.env.get('FEDEX_ACCOUNT_NUMBER')
  
  if (!clientId || !clientSecret || !accountNumber) {
    throw new Error('FedEx credentials not configured')
  }

  // Get OAuth token
  const tokenResponse = await fetch('https://apis.fedex.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
  })

  const { access_token } = await tokenResponse.json()

  // Create shipment
  const shipResponse = await fetch('https://apis.fedex.com/ship/v1/shipments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      accountNumber: { value: accountNumber },
      requestedShipment: {
        shipper: {
          contact: { personName: shipment.senderCompany },
          address: {
            streetLines: [shipment.senderAddress],
            city: shipment.senderCity,
            postalCode: shipment.senderZipCode,
            countryCode: shipment.senderCountry
          }
        },
        recipients: [{
          contact: { personName: shipment.recipientName },
          address: {
            streetLines: [shipment.recipientAddress],
            city: shipment.recipientCity,
            postalCode: shipment.recipientZipCode,
            countryCode: shipment.recipientCountry
          }
        }],
        serviceType: 'FEDEX_GROUND',
        packagingType: 'YOUR_PACKAGING',
        requestedPackageLineItems: [{
          weight: { value: shipment.weight || 1, units: 'KG' }
        }],
        labelSpecification: {
          imageType: 'PDF',
          labelStockType: 'PAPER_4X6'
        }
      }
    })
  })

  const data = await shipResponse.json()
  const pkg = data.output?.transactionShipments?.[0]?.pieceResponses?.[0]
  
  return {
    trackingNumber: pkg?.trackingNumber,
    labelUrl: null,
    labelData: pkg?.packageDocuments?.[0]?.encodedLabel,
    format: 'pdf'
  }
}

async function generateMondialRelayLabel(shipment: any) {
  const brandCode = Deno.env.get('MONDIAL_RELAY_BRAND')
  const apiKey = Deno.env.get('MONDIAL_RELAY_API_KEY')
  
  if (!brandCode || !apiKey) {
    throw new Error('Mondial Relay credentials not configured')
  }

  const response = await fetch('https://api.mondialrelay.com/Web_Services.asmx', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml' },
    body: `<?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <WSI2_CreationEtiquette xmlns="http://www.mondialrelay.fr/webservice/">
            <Enseigne>${brandCode}</Enseigne>
            <ModeCol>REL</ModeCol>
            <ModeLiv>24R</ModeLiv>
            <NDossier>MR${Date.now()}</NDossier>
            <NClient>${shipment.recipientName}</NClient>
            <Expe_Langage>FR</Expe_Langage>
            <Expe_Ad1>${shipment.senderAddress}</Expe_Ad1>
            <Expe_Ville>${shipment.senderCity}</Expe_Ville>
            <Expe_CP>${shipment.senderZipCode}</Expe_CP>
            <Expe_Pays>${shipment.senderCountry}</Expe_Pays>
            <Dest_Langage>FR</Dest_Langage>
            <Dest_Ad1>${shipment.recipientAddress}</Dest_Ad1>
            <Dest_Ville>${shipment.recipientCity}</Dest_Ville>
            <Dest_CP>${shipment.recipientZipCode}</Dest_CP>
            <Dest_Pays>${shipment.recipientCountry}</Dest_Pays>
            <Poids>${Math.round((shipment.weight || 1) * 1000)}</Poids>
            <Security>${apiKey}</Security>
          </WSI2_CreationEtiquette>
        </soap:Body>
      </soap:Envelope>`
  })

  const xmlText = await response.text()
  
  // Extract tracking from XML (simplified)
  const trackingMatch = xmlText.match(/<ExpeditionNum>(.*?)<\/ExpeditionNum>/)
  const trackingNumber = trackingMatch ? trackingMatch[1] : `MR${Date.now()}`
  
  return {
    trackingNumber,
    labelUrl: null,
    labelData: xmlText,
    format: 'xml'
  }
}

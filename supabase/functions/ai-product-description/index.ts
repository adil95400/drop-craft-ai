/**
 * AI Product Description — Migrated to shared ai-client.ts
 */
import { createEdgeFunction, z } from '../_shared/create-edge-function.ts'
import { callOpenAI } from '../_shared/ai-client.ts'

const productDescSchema = z.object({
  productName: z.string().min(1).max(500),
  category: z.string().max(200).optional(),
  features: z.array(z.string().max(200)).max(20).optional(),
  targetAudience: z.string().max(500).optional(),
  tone: z.enum(['professional', 'casual', 'enthusiastic', 'persuasive', 'informative', 'friendly']).optional().default('professional')
})

type ProductDescInput = z.infer<typeof productDescSchema>

const handler = createEdgeFunction<ProductDescInput>({
  requireAuth: true,
  inputSchema: productDescSchema,
  rateLimit: { maxRequests: 30, windowMinutes: 60, action: 'ai_product_description' }
}, async (ctx) => {
  const { user, input, correlationId } = ctx
  const { productName, category, features, targetAudience, tone } = input
  
  console.log(`[${correlationId}] AI Product Description request from user: ${user.id}`)

  const result = await callOpenAI(
    [
      { 
        role: 'system', 
        content: 'Tu es un expert en rédaction de descriptions produits e-commerce. Fournis des descriptions persuasives et optimisées SEO.' 
      },
      { 
        role: 'user', 
        content: `Génère une description produit complète pour un produit e-commerce.

Nom du produit: ${productName}
Catégorie: ${category || 'N/A'}
Caractéristiques: ${features?.join(', ') || 'N/A'}
Public cible: ${targetAudience || 'Grand public'}
Ton: ${tone}

Fournis une réponse structurée avec:
- Un titre accrocheur et optimisé SEO
- Une courte description (50-60 caractères) pour attirer l'attention
- Une description complète (150-200 mots) persuasive
- 3-5 points clés/bénéfices du produit
- 3-5 mots-clés SEO pertinents` 
      }
    ],
    {
      module: 'product',
      temperature: 0.8,
      maxTokens: 1000,
      tools: [
        {
          type: "function",
          function: {
            name: "generate_product_description",
            description: "Génère une description produit structurée",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Titre optimisé du produit" },
                shortDescription: { type: "string", description: "Description courte accrocheuse" },
                fullDescription: { type: "string", description: "Description complète persuasive" },
                bulletPoints: { type: "array", items: { type: "string" }, description: "Points clés et bénéfices" },
                seoKeywords: { type: "array", items: { type: "string" }, description: "Mots-clés SEO" }
              },
              required: ["title", "shortDescription", "fullDescription", "bulletPoints", "seoKeywords"],
              additionalProperties: false
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "generate_product_description" } }
    }
  )

  const toolCall = result.choices[0].message.tool_calls?.[0]
  
  let parsedContent
  if (toolCall?.function?.arguments) {
    parsedContent = JSON.parse(toolCall.function.arguments)
  } else {
    const content = result.choices[0].message.content
    parsedContent = {
      title: productName,
      shortDescription: content?.substring(0, 100) || '',
      fullDescription: content || '',
      bulletPoints: features || [],
      seoKeywords: [category, productName].filter(Boolean)
    }
  }

  return new Response(JSON.stringify(parsedContent), {
    headers: { 'Content-Type': 'application/json' },
  })
})

Deno.serve(handler)

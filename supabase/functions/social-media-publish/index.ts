import { createClient } from 'npm:@supabase/supabase-js@2

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SocialPublishRequest {
  productId: string
  channels: string[] // ['facebook', 'instagram', 'tiktok', 'pinterest', 'twitter', 'linkedin']
  customMessage?: string
  scheduleAt?: string // ISO date for scheduled posts
}

// Social media platform adapters
async function publishToFacebook(product: any, message: string, credentials: any): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  const accessToken = credentials?.access_token || Deno.env.get('FACEBOOK_ACCESS_TOKEN')
  const pageId = credentials?.page_id || Deno.env.get('FACEBOOK_PAGE_ID')
  
  if (!accessToken || !pageId) {
    return { success: false, error: 'Facebook credentials not configured. Connect your Facebook Business account.' }
  }

  try {
    const postBody: any = { message, access_token: accessToken }
    
    // Add product image if available
    const imageUrl = product.image_urls?.[0] || product.image_url
    if (imageUrl) {
      // Post as photo with link
      const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...postBody, url: imageUrl }),
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error.message)
      return { success: true, postId: data.post_id || data.id, postUrl: `https://facebook.com/${data.post_id || data.id}` }
    } else {
      const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postBody),
      })
      const data = await response.json()
      if (data.error) throw new Error(data.error.message)
      return { success: true, postId: data.id, postUrl: `https://facebook.com/${data.id}` }
    }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

async function publishToInstagram(product: any, message: string, credentials: any): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  const accessToken = credentials?.access_token || Deno.env.get('INSTAGRAM_ACCESS_TOKEN')
  const igUserId = credentials?.ig_user_id || Deno.env.get('INSTAGRAM_USER_ID')
  
  if (!accessToken || !igUserId) {
    return { success: false, error: 'Instagram credentials not configured. Connect your Instagram Business account.' }
  }

  try {
    const imageUrl = product.image_urls?.[0] || product.image_url
    if (!imageUrl) {
      return { success: false, error: 'Instagram requires at least one product image' }
    }

    // Step 1: Create media container
    const containerRes = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: message,
        access_token: accessToken,
      }),
    })
    const container = await containerRes.json()
    if (container.error) throw new Error(container.error.message)

    // Step 2: Publish the container
    const publishRes = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: container.id,
        access_token: accessToken,
      }),
    })
    const published = await publishRes.json()
    if (published.error) throw new Error(published.error.message)

    return { success: true, postId: published.id, postUrl: `https://instagram.com/p/${published.id}` }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

async function publishToTikTok(product: any, message: string, credentials: any): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  const accessToken = credentials?.access_token || Deno.env.get('TIKTOK_ACCESS_TOKEN')
  
  if (!accessToken) {
    return { success: false, error: 'TikTok credentials not configured. Connect your TikTok Business account.' }
  }

  try {
    // TikTok Content Posting API for photos
    const imageUrl = product.image_urls?.[0] || product.image_url
    if (!imageUrl) {
      return { success: false, error: 'TikTok requires at least one product image' }
    }

    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: message.substring(0, 150),
          description: message,
          disable_comment: false,
          privacy_level: 'PUBLIC_TO_EVERYONE',
        },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_cover_index: 0,
          photo_images: [imageUrl],
        },
        post_mode: 'DIRECT_POST',
        media_type: 'PHOTO',
      }),
    })
    const data = await response.json()
    if (data.error?.code) throw new Error(data.error.message || 'TikTok API error')
    return { success: true, postId: data.data?.publish_id, postUrl: undefined }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

async function publishToPinterest(product: any, message: string, credentials: any): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  const accessToken = credentials?.access_token || Deno.env.get('PINTEREST_ACCESS_TOKEN')
  const boardId = credentials?.board_id || Deno.env.get('PINTEREST_BOARD_ID')
  
  if (!accessToken || !boardId) {
    return { success: false, error: 'Pinterest credentials not configured. Connect your Pinterest Business account.' }
  }

  try {
    const imageUrl = product.image_urls?.[0] || product.image_url
    if (!imageUrl) {
      return { success: false, error: 'Pinterest requires a product image' }
    }

    const response = await fetch('https://api.pinterest.com/v5/pins', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: product.name || 'Product',
        description: message,
        board_id: boardId,
        media_source: { source_type: 'image_url', url: imageUrl },
        link: product.source_url || undefined,
      }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Pinterest API error')
    return { success: true, postId: data.id, postUrl: `https://pinterest.com/pin/${data.id}` }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

async function publishToTwitter(product: any, message: string, credentials: any): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  const bearerToken = credentials?.bearer_token || Deno.env.get('TWITTER_BEARER_TOKEN')
  
  if (!bearerToken) {
    return { success: false, error: 'Twitter/X credentials not configured. Connect your Twitter/X account.' }
  }

  try {
    const tweetText = message.length > 280 ? message.substring(0, 277) + '...' : message
    const response = await fetch('https://api.x.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: tweetText }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail || data.title || 'Twitter API error')
    return { success: true, postId: data.data?.id, postUrl: `https://x.com/i/status/${data.data?.id}` }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

async function publishToLinkedIn(product: any, message: string, credentials: any): Promise<{ success: boolean; postId?: string; postUrl?: string; error?: string }> {
  const accessToken = credentials?.access_token || Deno.env.get('LINKEDIN_ACCESS_TOKEN')
  const orgId = credentials?.organization_id || Deno.env.get('LINKEDIN_ORG_ID')
  
  if (!accessToken) {
    return { success: false, error: 'LinkedIn credentials not configured. Connect your LinkedIn account.' }
  }

  try {
    const author = orgId ? `urn:li:organization:${orgId}` : `urn:li:person:me`
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: message },
            shareMediaCategory: 'ARTICLE',
            media: [{
              status: 'READY',
              originalUrl: product.source_url || '',
              title: { text: product.name || 'Product' },
              description: { text: (product.description || '').substring(0, 200) },
            }]
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'LinkedIn API error')
    return { success: true, postId: data.id, postUrl: undefined }
  } catch (e) {
    return { success: false, error: e.message }
  }
}

const socialHandlers: Record<string, Function> = {
  facebook: publishToFacebook,
  instagram: publishToInstagram,
  tiktok: publishToTikTok,
  pinterest: publishToPinterest,
  twitter: publishToTwitter,
  linkedin: publishToLinkedIn,
}

function generateSocialMessage(product: any, customMessage?: string): string {
  if (customMessage) return customMessage
  
  const parts = []
  if (product.name) parts.push(`🔥 ${product.name}`)
  if (product.price) parts.push(`💰 ${product.price}€`)
  if (product.description) {
    const shortDesc = product.description.replace(/<[^>]*>/g, '').substring(0, 200)
    parts.push(shortDesc)
  }
  if (product.tags?.length) {
    parts.push(product.tags.slice(0, 5).map((t: string) => `#${t.replace(/\s+/g, '')}`).join(' '))
  }
  if (product.source_url) parts.push(`👉 ${product.source_url}`)
  
  return parts.join('\n\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    const body: SocialPublishRequest = await req.json()
    const { productId, channels, customMessage, scheduleAt } = body

    if (!productId || !channels?.length) {
      throw new Error('productId and channels are required')
    }

    // Fetch product
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single()

    if (prodError || !product) throw new Error('Product not found')

    // If scheduled, save to scheduled_publications
    if (scheduleAt && new Date(scheduleAt) > new Date()) {
      const scheduledItems = channels.map(ch => ({
        user_id: user.id,
        product_id: productId,
        channel_type: 'social',
        channel_id: ch,
        channel_name: ch.charAt(0).toUpperCase() + ch.slice(1),
        status: 'scheduled',
        scheduled_at: scheduleAt,
        publish_options: { customMessage },
        custom_message: customMessage,
      }))

      const { error: schedError } = await supabase
        .from('scheduled_publications')
        .insert(scheduledItems)

      if (schedError) throw new Error('Failed to schedule publications')

      return new Response(
        JSON.stringify({ 
          success: true, 
          scheduled: true, 
          count: channels.length,
          scheduledAt: scheduleAt 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch social credentials from integrations
    const { data: socialIntegrations } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .in('platform', channels)
      .eq('connection_status', 'connected')

    const credentialsMap = new Map()
    for (const integ of (socialIntegrations || [])) {
      credentialsMap.set(integ.platform, integ.config || {})
    }

    const message = generateSocialMessage(product, customMessage)
    const results: Array<{ channel: string; success: boolean; postId?: string; postUrl?: string; error?: string }> = []

    // Publish to each channel
    for (const channel of channels) {
      const startTime = Date.now()
      const handler = socialHandlers[channel]
      
      if (!handler) {
        results.push({ channel, success: false, error: `Unsupported channel: ${channel}` })
        continue
      }

      const credentials = credentialsMap.get(channel) || {}
      const result = await handler(product, message, credentials)
      
      // Log publication
      await supabase.from('publication_logs').insert({
        user_id: user.id,
        product_id: productId,
        channel_type: 'social',
        channel_id: channel,
        channel_name: channel.charAt(0).toUpperCase() + channel.slice(1),
        action: 'publish',
        status: result.success ? 'success' : 'failed',
        external_id: result.postId,
        external_url: result.postUrl,
        error_message: result.error,
        duration_ms: Date.now() - startTime,
        metadata: { custom_message: !!customMessage }
      })

      results.push({ channel, ...result })
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({ success: successCount > 0, successCount, failCount, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[social-media-publish] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * APISandbox — Console interactive pour tester les endpoints API
 */
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion } from 'framer-motion'
import {
  Play, Terminal, Clock, CheckCircle2, XCircle, Copy, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { supabase } from '@/integrations/supabase/client'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestLog {
  id: string
  method: HttpMethod
  path: string
  status: number
  duration: number
  response: string
  timestamp: string
}

export function APISandbox() {
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [path, setPath] = useState('/v1/products')
  const [body, setBody] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<string | null>(null)
  const [responseStatus, setResponseStatus] = useState<number | null>(null)
  const [responseDuration, setResponseDuration] = useState<number | null>(null)
  const [history, setHistory] = useState<RequestLog[]>([])

  const executeRequest = async () => {
    setIsLoading(true)
    const start = performance.now()

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const fetchOpts: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
        },
      }

      if (['POST', 'PUT'].includes(method) && body.trim()) {
        fetchOpts.body = body
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-v1${path.startsWith('/v1') ? path.slice(3) : path}`
      const resp = await fetch(url, fetchOpts)
      const duration = Math.round(performance.now() - start)
      const text = await resp.text()

      let formatted: string
      try {
        formatted = JSON.stringify(JSON.parse(text), null, 2)
      } catch {
        formatted = text
      }

      setResponse(formatted)
      setResponseStatus(resp.status)
      setResponseDuration(duration)

      const log: RequestLog = {
        id: crypto.randomUUID(),
        method,
        path,
        status: resp.status,
        duration,
        response: formatted.slice(0, 200),
        timestamp: new Date().toISOString(),
      }
      setHistory(prev => [log, ...prev].slice(0, 20))
    } catch (err: any) {
      const duration = Math.round(performance.now() - start)
      setResponse(JSON.stringify({ error: err.message }, null, 2))
      setResponseStatus(0)
      setResponseDuration(duration)
    } finally {
      setIsLoading(false)
    }
  }

  const methodColors: Record<HttpMethod, string> = {
    GET: 'text-green-600',
    POST: 'text-blue-600',
    PUT: 'text-amber-600',
    DELETE: 'text-red-500',
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Terminal className="h-5 w-5 text-primary" />
          API Sandbox
          <Badge variant="outline" className="ml-auto text-xs">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Request builder */}
        <div className="flex gap-2">
          <Select value={method} onValueChange={v => setMethod(v as HttpMethod)}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['GET', 'POST', 'PUT', 'DELETE'] as HttpMethod[]).map(m => (
                <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={path}
            onChange={e => setPath(e.target.value)}
            placeholder="/v1/products"
            className="h-8 text-sm font-mono flex-1"
          />
          <Button size="sm" onClick={executeRequest} disabled={isLoading} className="h-8 gap-1 text-xs">
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            Envoyer
          </Button>
        </div>

        {/* Body input for POST/PUT */}
        {['POST', 'PUT'].includes(method) && (
          <Textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder='{ "name": "Mon produit", "price": 29.99 }'
            className="text-xs font-mono min-h-[80px]"
          />
        )}

        {/* Response */}
        {response !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <div className="flex items-center gap-2">
              {responseStatus && responseStatus >= 200 && responseStatus < 300 ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <Badge variant="outline" className={cn('text-xs', responseStatus && responseStatus < 300 ? 'border-green-500/30 text-green-600' : 'border-red-500/30 text-red-600')}>
                {responseStatus}
              </Badge>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" /> {responseDuration}ms
              </span>
              <Button size="sm" variant="ghost" className="ml-auto h-6 text-[10px] gap-1" onClick={() => { navigator.clipboard.writeText(response); toast.success('Copié') }}>
                <Copy className="h-2.5 w-2.5" /> Copier
              </Button>
            </div>
            <pre className="bg-muted p-3 rounded-lg text-[11px] font-mono overflow-auto max-h-[300px] whitespace-pre-wrap">
              {response}
            </pre>
          </motion.div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-1.5">
            <h5 className="text-xs font-semibold text-muted-foreground">Historique</h5>
            {history.slice(0, 5).map(log => (
              <div
                key={log.id}
                className="flex items-center gap-2 text-[10px] p-1.5 rounded border cursor-pointer hover:bg-muted/30"
                onClick={() => { setMethod(log.method); setPath(log.path) }}
              >
                <span className={cn('font-mono font-bold', methodColors[log.method])}>{log.method}</span>
                <code className="font-mono flex-1 truncate">{log.path}</code>
                <Badge variant="outline" className={cn('text-[9px]', log.status < 300 ? 'text-green-600' : 'text-red-500')}>{log.status}</Badge>
                <span className="text-muted-foreground">{log.duration}ms</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

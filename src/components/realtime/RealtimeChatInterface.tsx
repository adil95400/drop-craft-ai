import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Mic, 
  MicOff, 
  Send, 
  Bot, 
  User, 
  Volume2, 
  VolumeX,
  Phone,
  PhoneOff,
  Loader2,
  MessageCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content?: string
  transcript?: string
  audio_data?: string
  timestamp: Date
  type: 'text' | 'audio' | 'function_call'
}

interface ConnectionStatus {
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  message?: string
}

export class AudioRecorder {
  private stream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private processor: ScriptProcessorNode | null = null
  private source: MediaStreamAudioSourceNode | null = null

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      this.audioContext = new AudioContext({
        sampleRate: 24000,
      })

      this.source = this.audioContext.createMediaStreamSource(this.stream)
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1)

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0)
        this.onAudioData(new Float32Array(inputData))
      }

      this.source.connect(this.processor)
      this.processor.connect(this.audioContext.destination)
    } catch (error) {
      console.error('Error accessing microphone:', error)
      throw error
    }
  }

  stop() {
    if (this.source) {
      this.source.disconnect()
      this.source = null
    }
    if (this.processor) {
      this.processor.disconnect()
      this.processor = null
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

export class AudioQueue {
  private queue: Uint8Array[] = []
  private isPlaying = false
  private audioContext: AudioContext

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext
  }

  async addToQueue(audioData: Uint8Array) {
    this.queue.push(audioData)
    if (!this.isPlaying) {
      await this.playNext()
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false
      return
    }

    this.isPlaying = true
    const audioData = this.queue.shift()!

    try {
      const wavData = this.createWavFromPCM(audioData)
      const audioBuffer = await this.audioContext.decodeAudioData(wavData.buffer)
      
      const source = this.audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.audioContext.destination)
      
      source.onended = () => this.playNext()
      source.start(0)
    } catch (error) {
      console.error('Error playing audio:', error)
      this.playNext() // Continue with next segment even if current fails
    }
  }

  private createWavFromPCM(pcmData: Uint8Array) {
    // Convert bytes to 16-bit samples
    const int16Data = new Int16Array(pcmData.length / 2)
    for (let i = 0; i < pcmData.length; i += 2) {
      int16Data[i / 2] = (pcmData[i + 1] << 8) | pcmData[i]
    }
    
    // Create WAV header
    const wavHeader = new ArrayBuffer(44)
    const view = new DataView(wavHeader)
    
    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    // WAV header parameters
    const sampleRate = 24000
    const numChannels = 1
    const bitsPerSample = 16
    const blockAlign = (numChannels * bitsPerSample) / 8
    const byteRate = sampleRate * blockAlign

    // Write WAV header
    writeString(view, 0, 'RIFF')
    view.setUint32(4, 36 + int16Data.byteLength, true)
    writeString(view, 8, 'WAVE')
    writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, byteRate, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitsPerSample, true)
    writeString(view, 36, 'data')
    view.setUint32(40, int16Data.byteLength, true)

    // Combine header and data
    const wavArray = new Uint8Array(wavHeader.byteLength + int16Data.byteLength)
    wavArray.set(new Uint8Array(wavHeader), 0)
    wavArray.set(new Uint8Array(int16Data.buffer), wavHeader.byteLength)
    
    return wavArray
  }
}

const encodeAudioForAPI = (float32Array: Float32Array): string => {
  const int16Array = new Int16Array(float32Array.length)
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]))
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
  }
  const uint8Array = new Uint8Array(int16Array.buffer)
  let binary = ''
  const chunkSize = 0x8000
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length))
    binary += String.fromCharCode.apply(null, Array.from(chunk))
  }
  
  return btoa(binary)
}

export const RealtimeChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [textMessage, setTextMessage] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ status: 'disconnected' })
  
  const wsRef = useRef<WebSocket | null>(null)
  const audioRecorderRef = useRef<AudioRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<AudioQueue | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data)
      console.log('📨 Received message type:', data.type)

      switch (data.type) {
        case 'connection_status':
          setConnectionStatus({ status: data.status === 'connected_to_openai' ? 'connected' : 'disconnected' })
          break

        case 'response.audio.delta':
          if (data.delta && audioQueueRef.current) {
            // Convert base64 to Uint8Array
            const binaryString = atob(data.delta)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            audioQueueRef.current.addToQueue(bytes)
            setIsSpeaking(true)
          }
          break

        case 'response.audio.done':
          setIsSpeaking(false)
          break

        case 'response.audio_transcript.delta':
          if (data.delta) {
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1]
              if (lastMessage && lastMessage.role === 'assistant' && lastMessage.type === 'audio') {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...lastMessage,
                    transcript: (lastMessage.transcript || '') + data.delta
                  }
                ]
              } else {
                return [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    role: 'assistant',
                    transcript: data.delta,
                    timestamp: new Date(),
                    type: 'audio'
                  }
                ]
              }
            })
          }
          break

        case 'conversation.item.created':
          if (data.item && data.item.role === 'user') {
            const content = data.item.content?.[0]
            if (content) {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'user',
                content: content.text || content.transcript,
                timestamp: new Date(),
                type: content.type === 'input_audio' ? 'audio' : 'text'
              }])
            }
          }
          break

        case 'error':
          console.error('❌ OpenAI error:', data)
          toast({
            title: "Erreur",
            description: data.error?.message || "Erreur de communication avec l'IA",
            variant: "destructive"
          })
          break
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error)
    }
  }, [toast])

  const connectToChat = useCallback(async () => {
    if (isConnecting || isConnected) return

    setIsConnecting(true)
    setConnectionStatus({ status: 'connecting', message: 'Connexion au chat IA...' })

    try {
      // Initialize audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 })
        audioQueueRef.current = new AudioQueue(audioContextRef.current)
      }

      // Connect to WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//dtozyrmmekdnvekissuh.functions.supabase.co/ai-realtime-chat`
      
      console.log('🔗 Connecting to:', wsUrl)
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected')
        setIsConnected(true)
        setIsConnecting(false)
        setConnectionStatus({ status: 'connected', message: 'Connecté au chat IA' })
        
        toast({
          title: "Connecté",
          description: "Chat IA en temps réel activé"
        })
      }

      wsRef.current.onmessage = handleMessage

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason)
        setIsConnected(false)
        setIsConnecting(false)
        setIsRecording(false)
        setIsSpeaking(false)
        setConnectionStatus({ status: 'disconnected', message: 'Connexion fermée' })
        
        if (audioRecorderRef.current) {
          audioRecorderRef.current.stop()
          audioRecorderRef.current = null
        }
      }

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        setIsConnecting(false)
        setConnectionStatus({ status: 'error', message: 'Erreur de connexion' })
        
        toast({
          title: "Erreur de connexion",
          description: "Impossible de se connecter au chat IA",
          variant: "destructive"
        })
      }

    } catch (error) {
      console.error('❌ Error connecting:', error)
      setIsConnecting(false)
      setConnectionStatus({ status: 'error', message: 'Erreur de connexion' })
    }
  }, [isConnecting, isConnected, handleMessage, toast])

  const disconnectFromChat = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop()
      audioRecorderRef.current = null
    }
    
    setIsConnected(false)
    setIsRecording(false)
    setIsSpeaking(false)
    setConnectionStatus({ status: 'disconnected' })
  }, [])

  const startRecording = useCallback(async () => {
    if (!isConnected || isRecording) return

    try {
      if (!audioRecorderRef.current) {
        audioRecorderRef.current = new AudioRecorder((audioData: Float32Array) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const message = {
              type: 'input_audio_buffer.append',
              audio: encodeAudioForAPI(audioData)
            }
            wsRef.current.send(JSON.stringify(message))
          }
        })
      }

      await audioRecorderRef.current.start()
      setIsRecording(true)
      
      toast({
        title: "Enregistrement",
        description: "Vous pouvez maintenant parler"
      })
    } catch (error) {
      console.error('❌ Error starting recording:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone",
        variant: "destructive"
      })
    }
  }, [isConnected, isRecording, toast])

  const stopRecording = useCallback(() => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop()
      audioRecorderRef.current = null
    }
    setIsRecording(false)
  }, [])

  const sendTextMessage = useCallback(() => {
    if (!isConnected || !textMessage.trim() || !wsRef.current) return

    const message = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: textMessage
          }
        ]
      }
    }

    wsRef.current.send(JSON.stringify(message))
    wsRef.current.send(JSON.stringify({ type: 'response.create' }))
    
    setTextMessage('')
  }, [isConnected, textMessage])

  const getStatusBadgeVariant = () => {
    switch (connectionStatus.status) {
      case 'connected': return 'default'
      case 'connecting': return 'secondary'
      case 'error': return 'destructive'
      default: return 'outline'
    }
  }

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'connected': return <Phone className="w-4 h-4" />
      case 'connecting': return <Loader2 className="w-4 h-4 animate-spin" />
      case 'error': return <PhoneOff className="w-4 h-4" />
      default: return <PhoneOff className="w-4 h-4" />
    }
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="flex-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-primary" />
            <CardTitle>Assistant IA Temps Réel</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant()} className="flex items-center gap-1">
              {getStatusIcon()}
              {connectionStatus.status === 'connected' ? 'Connecté' : 
               connectionStatus.status === 'connecting' ? 'Connexion...' :
               connectionStatus.status === 'error' ? 'Erreur' : 'Déconnecté'}
            </Badge>
            {!isConnected ? (
              <Button 
                onClick={connectToChat} 
                disabled={isConnecting}
                size="sm"
              >
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                Connecter
              </Button>
            ) : (
              <Button 
                onClick={disconnectFromChat} 
                variant="outline"
                size="sm"
              >
                <PhoneOff className="w-4 h-4" />
                Déconnecter
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.length === 0 && isConnected && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Commencez à parler ou tapez un message pour démarrer la conversation</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-sm">
                    {message.content || message.transcript || 'Message audio'}
                  </div>
                  <div className="text-xs opacity-70 mt-1 flex items-center gap-1">
                    {message.type === 'audio' && (
                      message.role === 'user' ? <Mic className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />
                    )}
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                
                {message.role === 'user' && (
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            
            {isSpeaking && (
              <div className="flex gap-3 justify-start">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-sm text-muted-foreground">L'assistant parle...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <Separator />

        {/* Controls */}
        <div className="flex-none space-y-3">
          {/* Voice Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!isConnected}
              className="rounded-full w-16 h-16"
            >
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>
            
            <div className="text-center">
              <p className="text-sm font-medium">
                {isRecording ? 'Enregistrement...' : 'Appuyez pour parler'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRecording ? 'Relâchez pour arrêter' : 'Microphone inactif'}
              </p>
            </div>

            <Button
              variant={isMuted ? "destructive" : "outline"}
              size="lg"
              onClick={() => setIsMuted(!isMuted)}
              disabled={!isConnected}
              className="rounded-full w-16 h-16"
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </Button>
          </div>

          {/* Text Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Tapez votre message..."
              value={textMessage}
              onChange={(e) => setTextMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
              disabled={!isConnected}
              className="flex-1"
            />
            <Button
              onClick={sendTextMessage}
              disabled={!isConnected || !textMessage.trim()}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
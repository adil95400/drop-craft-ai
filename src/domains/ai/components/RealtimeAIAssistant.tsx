/**
 * PHASE 3: Assistant IA en temps réel avec OpenAI Realtime API
 * Fonctionnalité différenciante majeure - Chat vocal/texte avec IA business
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Mic, MicOff, Send, Brain, Volume2, VolumeX, 
  MessageCircle, Zap, TrendingUp, Settings,
  Loader2, CheckCircle, AlertCircle, Play, Pause
} from 'lucide-react'
import { useAuthOptimized } from '@/shared/hooks/useAuthOptimized'
import { usePlanContext } from '@/components/plan'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system' | 'function_call'
  content: string
  timestamp: string
  audioUrl?: string
  functionCall?: {
    name: string
    arguments: any
    result: any
  }
}

interface AudioRecorderClass {
  start(): Promise<void>
  stop(): void
}

interface AudioQueueClass {
  addToQueue(audioData: Uint8Array): Promise<void>
  clear(): void
}

// Audio Recording Class
class AudioRecorder implements AudioRecorderClass {
  private stream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private processor: ScriptProcessorNode | null = null
  private source: MediaStreamAudioSourceNode | null = null

  constructor(private onAudioData: (audioData: Float32Array) => void) {}

  async start() {
    try {
      // Starting audio recording
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
      
      // Audio recording started
    } catch (error) {
      console.error('❌ Error accessing microphone:', error)
      throw error
    }
  }

  stop() {
    // Stopping audio recording
    
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
    
    // Audio recording stopped
  }
}

// Audio Queue Class for sequential playback
class AudioQueue implements AudioQueueClass {
  private queue: Uint8Array[] = []
  private isPlaying = false

  constructor(private audioContext: AudioContext) {}

  async addToQueue(audioData: Uint8Array) {
    // Adding audio chunk to queue
    this.queue.push(audioData)
    if (!this.isPlaying) {
      await this.playNext()
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false
      // Audio queue empty
      return
    }

    this.isPlaying = true
    const audioData = this.queue.shift()!

    try {
      // Playing audio chunk
      const wavData = this.createWavFromPCM(audioData)
      // Convert ArrayBufferLike to ArrayBuffer for decodeAudioData
      const audioBuffer = await this.audioContext.decodeAudioData(
        wavData.buffer as ArrayBuffer
      )
      
      const source = this.audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(this.audioContext.destination)
      
      source.onended = () => {
        // Audio chunk finished, playing next
        this.playNext()
      }
      source.start(0)
    } catch (error) {
      console.error('❌ Error playing audio chunk:', error)
      this.playNext() // Continue with next segment even if current fails
    }
  }

  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    // Converting PCM to WAV
    
    // Convert bytes to 16-bit samples (little endian)
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
    view.setUint32(4, 36 + int16Data.byteLength, true) // little endian
    writeString(view, 8, 'WAVE')
    writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true) // PCM format chunk size
    view.setUint16(20, 1, true) // PCM format
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

  clear() {
    // Clearing audio queue
    this.queue = []
    this.isPlaying = false
  }
}

// Encode audio for OpenAI API (Float32 to PCM16 base64)
export const encodeAudioForAPI = (float32Array: Float32Array): string => {
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

export const RealtimeAIAssistant: React.FC = () => {
  const { user } = useAuthOptimized()
  const { hasFeature } = usePlanContext()
  
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [currentTranscript, setCurrentTranscript] = useState('')
  
  // Refs
  const wsRef = useRef<WebSocket | null>(null)
  const audioRecorderRef = useRef<AudioRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<AudioQueue | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize audio context and queue
  useEffect(() => {
    const initAudio = async () => {
      try {
        // Initializing audio context
        audioContextRef.current = new AudioContext({ sampleRate: 24000 })
        audioQueueRef.current = new AudioQueue(audioContextRef.current)
        // Audio context initialized
      } catch (error) {
        console.error('❌ Failed to initialize audio context:', error)
      }
    }

    initAudio()

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    if (!hasFeature('ai_realtime_chat')) {
      // AI Realtime Chat not available
      return
    }

    // Connecting to realtime AI assistant
    setConnectionStatus('connecting')

    // Use the full URL to the Supabase edge function
    const wsUrl = `wss://dtozyrmmekdnvekissuh.functions.supabase.co/realtime-chat`
    wsRef.current = new WebSocket(wsUrl)

    wsRef.current.onopen = () => {
      // WebSocket connected
      setIsConnected(true)
      setConnectionStatus('connected')
      
      // Add welcome message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: 'Assistant IA connecté ! Vous pouvez maintenant me parler ou m\'écrire pour obtenir des conseils business.',
        timestamp: new Date().toISOString()
      }])
    }

    wsRef.current.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data)
        // Message received

        switch (data.type) {
          case 'response.audio.delta':
            // Handle audio response from AI
            if (!isMuted && audioQueueRef.current) {
              const binaryString = atob(data.delta)
              const bytes = new Uint8Array(binaryString.length)
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
              }
              await audioQueueRef.current.addToQueue(bytes)
            }
            break

          case 'response.audio_transcript.delta':
            // Handle text transcript of AI speech
            setCurrentTranscript(prev => prev + data.delta)
            break

          case 'response.audio_transcript.done':
            // AI finished speaking, add complete message
            if (currentTranscript.trim()) {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                type: 'assistant',
                content: currentTranscript.trim(),
                timestamp: new Date().toISOString()
              }])
              setCurrentTranscript('')
            }
            break

          case 'input_audio_buffer.speech_started':
            // User started speaking
            break

          case 'input_audio_buffer.speech_stopped':
            // User stopped speaking
            break

          case 'response.function_call_arguments.done':
            // Handle function call completion
            // Function call completed
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              type: 'function_call',
              content: `Exécution: ${data.name}`,
              timestamp: new Date().toISOString(),
              functionCall: {
                name: data.name,
                arguments: JSON.parse(data.arguments || '{}'),
                result: null
              }
            }])
            break

          case 'error':
            console.error('❌ WebSocket error:', data.message)
            setConnectionStatus('error')
            break
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error)
      }
    }

    wsRef.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
      setConnectionStatus('error')
      setIsConnected(false)
    }

    wsRef.current.onclose = (event) => {
      // WebSocket closed
      setIsConnected(false)
      setConnectionStatus('disconnected')
      setIsRecording(false)
    }
  }, [hasFeature, isMuted, currentTranscript])

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    // Disconnecting from AI assistant
    
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop()
    }
    
    if (wsRef.current) {
      wsRef.current.close()
    }
    
    setIsConnected(false)
    setIsRecording(false)
    setConnectionStatus('disconnected')
  }, [])

  // Start/stop recording
  const toggleRecording = useCallback(async () => {
    if (!isConnected || !wsRef.current) {
      console.log('❌ Not connected to AI assistant')
      return
    }

    try {
      if (!isRecording) {
        console.log('🎤 Starting voice recording...')
        
        audioRecorderRef.current = new AudioRecorder((audioData: Float32Array) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const encodedAudio = encodeAudioForAPI(audioData)
            wsRef.current.send(JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: encodedAudio
            }))
          }
        })

        await audioRecorderRef.current.start()
        setIsRecording(true)
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'system',
          content: '🎤 Enregistrement vocal activé... Parlez maintenant !',
          timestamp: new Date().toISOString()
        }])
        
      } else {
        console.log('🛑 Stopping voice recording...')
        
        if (audioRecorderRef.current) {
          audioRecorderRef.current.stop()
        }
        setIsRecording(false)
      }
    } catch (error) {
      console.error('❌ Error toggling recording:', error)
      setIsRecording(false)
    }
  }, [isConnected, isRecording])

  // Send text message
  const sendTextMessage = useCallback(() => {
    if (!inputText.trim() || !isConnected || !wsRef.current) return

    console.log('📤 Sending text message:', inputText)

    // Add user message to UI
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content: inputText,
      timestamp: new Date().toISOString()
    }])

    // Send to OpenAI
    const message = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text: inputText
        }]
      }
    }
    
    wsRef.current.send(JSON.stringify(message))
    wsRef.current.send(JSON.stringify({ type: 'response.create' }))
    
    setInputText('')
  }, [inputText, isConnected])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWebSocket()
    }
  }, [disconnectWebSocket])

  if (!hasFeature('ai_realtime_chat')) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Brain className="h-6 w-6 text-muted-foreground" />
            Assistant IA Temps Réel
          </CardTitle>
          <CardDescription>
            Fonctionnalité disponible avec le plan Ultra Pro
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-muted-foreground mb-4">
            Accédez à l'assistant IA avec conversation vocale en temps réel
          </div>
          <Button>Passer au plan Ultra Pro</Button>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500 animate-pulse'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connecté'
      case 'connecting': return 'Connexion...'
      case 'error': return 'Erreur'
      default: return 'Déconnecté'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with connection status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-primary" />
                Assistant IA Temps Réel
                <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500">
                  Ultra Pro
                </Badge>
              </CardTitle>
              <CardDescription>
                Assistant business avec IA vocale et analyse en temps réel
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
                <span className="text-sm font-medium">{getStatusText()}</span>
              </div>
              
              {!isConnected ? (
                <Button onClick={connectWebSocket} disabled={connectionStatus === 'connecting'}>
                  {connectionStatus === 'connecting' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Se connecter
                    </>
                  )}
                </Button>
              ) : (
                <Button variant="outline" onClick={disconnectWebSocket}>
                  Se déconnecter
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat interface */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <span className="font-medium">Conversation</span>
              {currentTranscript && (
                <Badge variant="secondary" className="animate-pulse">
                  IA en train de répondre...
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className={isMuted ? 'bg-red-50' : ''}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="sm"
                onClick={toggleRecording}
                disabled={!isConnected}
                className={isRecording ? 'animate-pulse' : ''}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Arrêter
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Parler
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages area */}
        <div className="flex-1 p-4">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground'
                      : message.type === 'system'
                      ? 'bg-muted text-muted-foreground'
                      : message.type === 'function_call'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-muted'
                  }`}>
                    {message.type === 'function_call' ? (
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span className="text-sm">{message.content}</span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Show current AI transcript while speaking */}
              {currentTranscript && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted border-2 border-primary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm font-medium">Assistant IA</span>
                    </div>
                    <p className="text-sm">{currentTranscript}</p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t p-4">
          <div className="flex gap-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Tapez votre message ou utilisez le micro..."
              onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
              disabled={!isConnected}
            />
            <Button 
              onClick={sendTextMessage} 
              disabled={!inputText.trim() || !isConnected}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <div>
              {isRecording && '🎤 Enregistrement en cours...'}
              {!isConnected && 'Connectez-vous pour commencer'}
              {isConnected && !isRecording && 'Prêt - Cliquez sur le micro ou tapez votre message'}
            </div>
            
            <div className="flex items-center gap-4">
              <span>Messages: {messages.length}</span>
              <span>Audio: {isMuted ? 'Coupé' : 'Activé'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm font-medium mb-3">Actions rapides suggérées :</div>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start"
              onClick={() => setInputText("Analyse mes performances de vente du mois dernier")}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analyser les ventes
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start"
              onClick={() => setInputText("Propose-moi des optimisations SEO pour mes produits")}
            >
              <Zap className="h-4 w-4 mr-2" />
              Optimiser SEO
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start"
              onClick={() => setInputText("Aide-moi à créer une campagne marketing")}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Campagne marketing
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start"
              onClick={() => setInputText("Analyse la concurrence pour mes produits")}
            >
              <Brain className="h-4 w-4 mr-2" />
              Analyse concurrence
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
import { useState, useRef, useCallback } from 'react'
import HapticService from '@/lib/haptic'

// Declarações de tipos para Speech Recognition API
interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new(): SpeechRecognition
}

interface UseVoiceSearchOptions {
  onResult: (transcript: string) => void
  onError?: (error: string) => void
  language?: string
  continuous?: boolean
}

export function useVoiceSearch({
  onResult,
  onError,
  language = 'pt-BR',
  continuous = false
}: UseVoiceSearchOptions) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check for browser support
  const checkSupport = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const supported = !!SpeechRecognition
    setIsSupported(supported)
    return supported
  }, [])

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    if (!checkSupport()) return null

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = language
    recognition.continuous = continuous
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      HapticService.light()
    }

    recognition.onresult = (event) => {
      const transcriptText = event.results[0][0].transcript
      setTranscript(transcriptText)
      onResult(transcriptText)
      HapticService.success()
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      const errorMessage = getErrorMessage(event.error)
      onError?.(errorMessage)
      HapticService.error()
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    return recognition
  }, [language, continuous, onResult, onError, checkSupport])

  const startListening = useCallback(() => {
    if (isListening) return

    if (!recognitionRef.current) {
      recognitionRef.current = initializeRecognition()
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Failed to start speech recognition:', error)
        onError?.('Falha ao iniciar reconhecimento de voz')
        HapticService.error()
      }
    }
  }, [isListening, initializeRecognition, onError])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  return {
    isListening,
    isSupported: checkSupport(),
    transcript,
    startListening,
    stopListening,
    toggleListening
  }
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'no-speech':
      return 'Nenhuma fala detectada. Tente novamente.'
    case 'audio-capture':
      return 'Erro ao capturar áudio. Verifique o microfone.'
    case 'not-allowed':
      return 'Permissão de microfone negada.'
    case 'network':
      return 'Erro de rede. Verifique sua conexão.'
    case 'service-not-allowed':
      return 'Serviço de reconhecimento de voz não permitido.'
    default:
      return 'Erro no reconhecimento de voz. Tente novamente.'
  }
}

// Extend the Window interface to include speech recognition
declare global {
  interface Window {
    SpeechRecognition: new() => SpeechRecognition
    webkitSpeechRecognition: new() => SpeechRecognition
  }
}
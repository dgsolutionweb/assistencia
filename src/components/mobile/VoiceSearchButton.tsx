import React from 'react'
import { Mic } from 'lucide-react'

interface VoiceSearchButtonProps {
  listening?: boolean
  isListening?: boolean
  isSupported?: boolean
  onToggle?: () => void
}

export const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({ listening, isListening, isSupported, onToggle }) => {
  const active = (listening ?? isListening) || false
  return (
    <button
      aria-label="Busca por voz"
      onClick={onToggle}
      className={`flex items-center px-3 py-2 rounded-lg ${active ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-900'}`}
    >
      <Mic className="w-4 h-4 mr-2" />
      {active ? 'Parar' : 'Voz'}
    </button>
  )
}
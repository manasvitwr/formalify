import React, { useRef, useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { FileText, Mic, MicOff, Mail, Copy, Check, Plus, X, Info, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react'
import { useFormalityStore } from '../store/formalify.store'
import { convertText } from '../api/formalify.api'
import { useSpeechRecognition } from '../../../hooks/useSpeechRecognition'
import { toast } from 'sonner'
import { PrimaryButton } from './PrimaryButton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../../components/ui/Modal'
import type { OutputType } from '../types/formalify.types'

// Permission status type
type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown'

// ============================================
// INTERNAL SUB-COMPONENTS
// ============================================

interface InputWithMicProps {
  value: string
  onChange: (value: string) => void
  onMicClick: () => void
  isRecording: boolean
  disabled?: boolean
  placeholder?: string
  micPermissionStatus?: PermissionStatus
  onHelpClick?: () => void
}

function InputWithMic({
  value,
  onChange,
  onMicClick,
  isRecording,
  disabled = false,
  placeholder = 'Type or speak',
  onKeyDown,
  micPermissionStatus,
  onHelpClick,
}: InputWithMicProps & {
  onKeyDown?: (e: React.KeyboardEvent) => void
}) {
  const getMicStatusColor = () => {
    if (isRecording) return 'text-red-400 animate-pulse'
    if (micPermissionStatus === 'denied') return 'text-red-400/60'
    if (micPermissionStatus === 'granted') return 'text-green-400/60 hover:text-white/75'
    return 'text-white/45 hover:text-white/75'
  }

  return (
    <div className="relative w-full">
      {/* Glass effect container */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.09] to-white/[0.03] backdrop-blur-xl rounded-[24px] md:rounded-[28px] lg:rounded-[32px] border border-white/[0.15]" />

      <div className="relative flex items-center gap-3 md:gap-4 px-5 md:px-6 lg:px-7 py-4 md:py-[18px] lg:py-5">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent border-none outline-none text-white/90 placeholder:text-white/35"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(14px, 2.5vw, 16px)', fontWeight: '400' }}
        />

        <div className="flex items-center gap-2">
          {/* Help icon for microphone permission issues */}
          {micPermissionStatus === 'denied' && onHelpClick && (
            <button
              onClick={onHelpClick}
              className="flex-shrink-0 w-4 h-4 md:w-[18px] md:h-[18px] text-yellow-400/70 hover:text-yellow-400 transition-all animate-pulse"
              aria-label="Microphone help"
              title="Click for help with microphone permissions"
            >
              <HelpCircle className="w-full h-full" />
            </button>
          )}

          <button
            onClick={onMicClick}
            disabled={disabled}
            className={`relative flex-shrink-0 w-5 h-5 md:w-[22px] md:h-[22px] lg:w-6 lg:h-6 flex items-center justify-center transition-all ${getMicStatusColor()} disabled:opacity-30`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            title={
              isRecording ? 'Stop recording' :
                micPermissionStatus === 'denied' ? 'Microphone access denied - click help icon' :
                  micPermissionStatus === 'granted' ? 'Start recording' :
                    'Request microphone access to record'
            }
          >
            {isRecording ? (
              <MicOff className="w-full h-full" />
            ) : (
              <Mic className="w-full h-full" />
            )}
            {/* Visual indicator dot for permission status */}
            {!isRecording && micPermissionStatus === 'granted' && (
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full" />
            )}
            {!isRecording && micPermissionStatus === 'denied' && (
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

interface ToggleButtonProps {
  value: 'text' | 'email'
  onChange: (value: 'text' | 'email') => void
}

function ToggleButton({ value, onChange }: ToggleButtonProps) {
  return (
    <div className="flex items-center gap-3 md:gap-4 w-full">
      {/* Text option - styled as button */}
      <button
        onClick={() => onChange('text')}
        className={`flex-1 h-[42px] md:h-[44px] lg:h-[48px] rounded-full flex items-center justify-center gap-2 transition-all border ${value === 'text'
          ? 'bg-white/[0.12] border-white/[0.22] text-white/90'
          : 'bg-white/[0.04] border-white/[0.12] text-white/45 hover:bg-white/[0.08] hover:text-white/60'
          }`}
      >
        <FileText className="w-[15px] h-[15px] md:w-4 md:h-4 lg:w-[18px] lg:h-[18px]" />
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(13px, 2.5vw, 15px)', fontWeight: '500' }}>Text</span>
      </button>

      {/* Email option - styled as button */}
      <button
        onClick={() => onChange('email')}
        className={`flex-1 h-[42px] md:h-[44px] lg:h-[48px] rounded-full flex items-center justify-center gap-2 transition-all border ${value === 'email'
          ? 'bg-white/[0.12] border-white/[0.22] text-white/90'
          : 'bg-white/[0.04] border-white/[0.12] text-white/45 hover:bg-white/[0.08] hover:text-white/60'
          }`}
      >
        <Mail className="w-[15px] h-[15px] md:w-4 md:h-4 lg:w-[18px] lg:h-[18px]" />
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(13px, 2.5vw, 15px)', fontWeight: '500' }}>Email</span>
      </button>
    </div>
  )
}

interface SliderWithCheckboxProps {
  enabled: boolean
  value: number
  onEnabledChange: (enabled: boolean) => void
  onValueChange: (value: number) => void
  min?: number
  max?: number
}

function SliderWithCheckbox({
  enabled,
  value,
  onEnabledChange,
  onValueChange,
  min = 0,
  max = 100,
}: SliderWithCheckboxProps) {
  return (
    <div className="w-full space-y-2 md:space-y-2.5">
      {/* Label */}
      <div className="flex items-center gap-2">
        <label
          className="text-white/50"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(12px, 2.5vw, 14px)', fontWeight: '400' }}
        >
          Length
        </label>
      </div>

      {/* Slider track */}
      <div className="relative px-0.5">
        <div
          className={`relative h-[3px] rounded-full transition-all bg-white/25`}
        >
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => {
              onValueChange(parseInt(e.target.value))
              if (!enabled) onEnabledChange(true)
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          {/* Slider thumb */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-[14px] h-[14px] md:w-4 md:h-4 rounded-full transition-all pointer-events-none bg-white shadow-lg shadow-white/30`}
            style={{
              left: `${(value / max) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      </div>
    </div>
  )
}

interface OutputDisplayProps {
  content: string
  isLoading: boolean
  placeholder?: string
}

function OutputDisplay({
  content,
  isLoading,
  placeholder = 'Write in your message to get started',
  onCopy,
}: OutputDisplayProps & { onCopy?: () => void }) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    if (!content) {
      toast.error('No text to copy')
      return
    }

    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
          await navigator.clipboard.writeText(content)
          setIsCopied(true)
          toast.success('Copied to clipboard!')
          setTimeout(() => setIsCopied(false), 2000)
          if (onCopy) onCopy()
          return
        } catch (clipboardError) {
          // If Clipboard API fails (e.g., permissions), fall through to execCommand
          console.log('Clipboard API not available, using fallback method')
        }
      }

      // Fallback method for older browsers or when Clipboard API is blocked
      const textArea = document.createElement('textarea')
      textArea.value = content
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)

      if (successful) {
        setIsCopied(true)
        toast.success('Copied to clipboard!')
        setTimeout(() => setIsCopied(false), 2000)
        if (onCopy) onCopy()
      } else {
        throw new Error('execCommand failed')
      }
    } catch (error) {
      console.log('Copy methods unavailable:', error)
      toast.error('Failed to copy. Please select and copy manually (Ctrl+C or Cmd+C)')
    }
  }

  return (
    <div className="relative w-full">
      {/* Glass effect container */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] to-white/[0.025] backdrop-blur-xl rounded-[28px] md:rounded-[32px] border border-white/[0.13]" />

      <div className="relative min-h-[280px] md:min-h-[320px] lg:min-h-[360px] p-6 md:p-7 lg:p-8 flex flex-col">
        {/* Loading state - Glowing Orb Animation */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3 md:gap-4">
              {/* Orb 1 */}
              <div className="orb-animate-1 w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full bg-gradient-radial from-purple-300/80 via-purple-400/60 to-transparent backdrop-blur-sm border border-purple-300/30"
                style={{
                  background: 'radial-gradient(circle at center, rgba(216, 180, 254, 0.8) 0%, rgba(192, 132, 252, 0.6) 40%, transparent 70%)'
                }} />

              {/* Orb 2 */}
              <div className="orb-animate-2 w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full bg-gradient-radial from-purple-300/80 via-purple-400/60 to-transparent backdrop-blur-sm border border-purple-300/30"
                style={{
                  background: 'radial-gradient(circle at center, rgba(216, 180, 254, 0.8) 0%, rgba(192, 132, 252, 0.6) 40%, transparent 70%)'
                }} />

              {/* Orb 3 */}
              <div className="orb-animate-3 w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full bg-gradient-radial from-purple-300/80 via-purple-400/60 to-transparent backdrop-blur-sm border border-purple-300/30"
                style={{
                  background: 'radial-gradient(circle at center, rgba(216, 180, 254, 0.8) 0%, rgba(192, 132, 252, 0.6) 40%, transparent 70%)'
                }} />

              {/* Orb 4 */}
              <div className="orb-animate-4 w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full bg-gradient-radial from-purple-300/80 via-purple-400/60 to-transparent backdrop-blur-sm border border-purple-300/30"
                style={{
                  background: 'radial-gradient(circle at center, rgba(216, 180, 254, 0.8) 0%, rgba(192, 132, 252, 0.6) 40%, transparent 70%)'
                }} />

              {/* Orb 5 */}
              <div className="orb-animate-5 w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-full bg-gradient-radial from-purple-300/80 via-purple-400/60 to-transparent backdrop-blur-sm border border-purple-300/30"
                style={{
                  background: 'radial-gradient(circle at center, rgba(216, 180, 254, 0.8) 0%, rgba(192, 132, 252, 0.6) 40%, transparent 70%)'
                }} />
            </div>
          </div>
        ) : content ? (
          /* Content state */
          <>
            <div className="flex-1 overflow-y-auto pr-2">
              <p className="text-white/80 whitespace-pre-wrap leading-relaxed" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(13px, 2.5vw, 15px)', fontWeight: '400' }}>
                {content}
              </p>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg bg-black/25 hover:bg-black/35 border border-white/[0.12] transition-all group"
            >
              {isCopied ? (
                <>
                  <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-green-400" />
                  <span className="text-[10px] md:text-[11px] text-green-400" style={{ fontFamily: 'Inter, sans-serif', fontWeight: '500' }}>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 md:w-3.5 md:h-3.5 text-white/45 group-hover:text-white/75" />
                  <span className="text-[10px] md:text-[11px] text-white/45 group-hover:text-white/75" style={{ fontFamily: 'Inter, sans-serif', fontWeight: '500' }}>Copy</span>
                </>
              )}
            </button>
          </>
        ) : (
          /* Placeholder state */
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/35 text-center max-w-[200px] md:max-w-[280px] leading-relaxed" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(13px, 2.5vw, 15px)', fontWeight: '400' }}>
              {placeholder}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export function FormalifyCard() {
  const {
    rawText,
    convertedText,
    formalityLevel,
    outputFormat,
    isRecording,
    isLoading,
    isLengthControlEnabled,
    lengthPercentage,
    contextLabels,
    isAddLabelModalOpen,
    newLabelInput,
    isTypeEnabled,
    selectedOutputType,
    isToneInfoModalOpen,
    setRawText,
    setConvertedText,
    setOutputFormat,
    setIsRecording,
    setIsLoading,
    setIsLengthControlEnabled,
    setLengthPercentage,
    addContextLabel,
    updateContextLabelValue,
    toggleContextLabelSelection,
    removeContextLabel,
    setIsAddLabelModalOpen,
    setNewLabelInput,
    toggleTypeEnabled,
    setSelectedOutputType,
    setToneInfoModalOpen,
  } = useFormalityStore()

  const [isMicHelpModalOpen, setIsMicHelpModalOpen] = useState(false)

  const {
    isListening: isHookListening,
    isSupported,
    startListening,
    stopListening,
    permissionStatus
  } = useSpeechRecognition({
    onResult: (transcript) => {
      setRawText((prev) => prev + (prev ? ' ' : '') + transcript);
    },
    onError: (error) => {
      toast.error(error);
      if (error.includes('denied')) {
        setIsMicHelpModalOpen(true);
      }
    },
    onTimeout: () => {
      toast.info('Session timeout reached. Converting text...');
      handleConvert();
    }
  });

  // Sync recording state
  useEffect(() => {
    setIsRecording(isHookListening);
  }, [isHookListening, setIsRecording]);

  // Speech-to-text handler
  const handleMicrophoneClick = () => {
    if (isRecording) {
      stopListening();
    } else {
      startListening();
    }
  }

  // Request microphone permission explicitly
  const handleRequestPermission = () => {
    startListening();
    setIsMicHelpModalOpen(false);
  }

  // Auto-copy helper function
  const autoCopyToClipboard = async (text: string) => {
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        try {
          await navigator.clipboard.writeText(text)
          toast.success('Converted and copied to clipboard!', {
            duration: 3000,
          })
          return
        } catch (clipboardError) {
          // If Clipboard API fails (e.g., permissions), fall through to execCommand
          console.log('Clipboard API not available, using fallback method')
        }
      }

      // Fallback for older browsers or when Clipboard API is blocked
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)

      if (successful) {
        toast.success('Converted and copied to clipboard!', {
          duration: 3000,
        })
      } else {
        toast.success('Converted successfully! Use the Copy button to copy.')
      }
    } catch (error) {
      // Only show this if both methods fail
      console.log('Copy methods unavailable:', error)
      toast.success('Converted successfully! Use the Copy button to copy.')
    }
  }

  // Text conversion mutation
  const convertMutation = useMutation({
    mutationFn: convertText,
    onMutate: () => {
      setIsLoading(true)
    },
    onSuccess: async (data) => {
      setConvertedText(data)
      setIsLoading(false)
      // Auto-copy to clipboard
      await autoCopyToClipboard(data)
    },
    onError: (error: Error) => {
      setIsLoading(false)
      toast.error(error.message || 'Conversion failed')
      console.error('Conversion error:', error)
    },
  })

  const handleConvert = () => {
    if (!rawText.trim()) {
      // If triggered by timeout but empty, just ignore
      if (!isHookListening) toast.error('Please enter some text')
      return
    }

    convertMutation.mutate({
      text: rawText,
      formality: formalityLevel,
      format: outputFormat,
      lengthControlEnabled: isLengthControlEnabled,
      lengthPercentage: lengthPercentage,
      contextLabels: outputFormat === 'email' ? contextLabels : undefined,
      isTypeEnabled,
      selectedOutputType,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleConvert()
    }
  }

  const handleAddLabel = () => {
    if (newLabelInput.trim()) {
      addContextLabel(newLabelInput.trim())
      setIsAddLabelModalOpen(false)
    }
  }

  return (
    <div className="w-full space-y-6 md:space-y-7 lg:space-y-8">
      {/* Header - Outside Card */}
      <div className="text-center space-y-2 md:space-y-2.5">
        <div className="flex items-center justify-center gap-2 md:gap-2.5 lg:gap-3">
          <div className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <FileText className="w-[18px] h-[18px] md:w-5 md:h-5 lg:w-[22px] lg:h-[22px] text-white/90" />
          </div>
          <h1
            className="bg-gradient-to-t from-gray-300/90 to-white text-transparent bg-clip-text"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(36px, 6vw, 52px)',
              fontWeight: '600',
              letterSpacing: '-0.02em',
            }}
          >
            Formalify
          </h1>
        </div>

        <p className="text-white/60" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(15px, 3vw, 18px)' }}>
          Convert casual speech into formal text
        </p>
      </div>

      {/* Input Area - Outside Card */}
      <InputWithMic
        value={rawText}
        onChange={setRawText}
        onMicClick={handleMicrophoneClick}
        isRecording={isRecording}
        disabled={isLoading}
        placeholder={isRecording ? "Listening..." : "Type or speak"}
        onKeyDown={handleKeyDown}
        micPermissionStatus={permissionStatus}
        onHelpClick={() => setIsMicHelpModalOpen(true)}
      />

      {/* Tone Info Button - Outside Card */}
      <div className="flex justify-end">
        <button
          onClick={() => setToneInfoModalOpen(true)}
          className="flex items-center gap-1.5 text-white/45 hover:text-white/75 transition-all"
        >
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(12px, 2.5vw, 13px)', fontWeight: '400' }}>
            Tone
          </span>
          <Info className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </button>
      </div>

      {/* Main card with glassmorphism - Contains Toggle to Convert Button */}
      <div className="relative">
        {/* Background gradient layer - semi-transparent purple card */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#502a6e]/40 via-[#3d1f57]/35 to-[#2a1540]/30 rounded-[32px] md:rounded-[36px] lg:rounded-[40px]" />

        {/* Glass layer with backdrop blur and grain effect */}
        <div className="absolute inset-0 backdrop-blur-2xl backdrop-saturate-180 rounded-[32px] md:rounded-[36px] lg:rounded-[40px]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.05\'/%3E%3C/svg%3E")',
          backgroundBlendMode: 'overlay'
        }} />

        {/* Gradient Border - using pseudo-element effect */}
        <div className="absolute inset-0 rounded-[32px] md:rounded-[36px] lg:rounded-[40px] border border-transparent" style={{
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(255,255,255,0.05)) border-box',
          WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px'
        }} />

        {/* Fallback border */}
        <div className="absolute inset-0 rounded-[32px] md:rounded-[36px] lg:rounded-[40px] border border-white/[0.15]" />

        {/* Content */}
        <div className="relative z-10 px-7 md:px-9 lg:px-11 py-8 md:py-10 lg:py-12 space-y-6 md:space-y-7 lg:space-y-8">
          {/* Format Toggle */}
          <ToggleButton value={outputFormat} onChange={setOutputFormat} />

          {/* Context Labels - Only show for Email format */}
          {outputFormat === 'email' && (
            <div className="space-y-3 md:space-y-4">
              {/* Render all context labels */}
              {contextLabels.map((label) => (
                <div key={label.id} className="flex items-center gap-2 md:gap-3">
                  {/* Checkbox - disabled for compulsory field */}
                  <input
                    type="checkbox"
                    checked={label.isSelected}
                    onChange={() => !label.isCompulsory && toggleContextLabelSelection(label.id)}
                    disabled={label.isCompulsory}
                    className="w-4 h-4 md:w-[18px] md:h-[18px] rounded border-2 border-white/30 bg-white/10 checked:bg-white/90 checked:border-white/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer accent-white"
                  />

                  {/* Input field */}
                  <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl rounded-[20px] md:rounded-[24px] border border-white/[0.12]" />
                    <input
                      type="text"
                      value={label.value}
                      onChange={(e) => updateContextLabelValue(label.id, e.target.value)}
                      placeholder={label.label}
                      className="relative w-full bg-transparent border-none outline-none text-white/85 placeholder:text-white/40 px-4 md:px-5 py-3 md:py-3.5"
                      style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(13px, 2.5vw, 14px)', fontWeight: '400' }}
                    />
                  </div>

                  {/* Remove button - only for user-defined labels */}
                  {!label.isPredefined && (
                    <button
                      onClick={() => removeContextLabel(label.id)}
                      className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all text-white/40 hover:text-white/70"
                    >
                      <X className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                    </button>
                  )}
                </div>
              ))}

              {/* Add Label Button */}
              <button
                onClick={() => setIsAddLabelModalOpen(true)}
                className="w-full h-[44px] md:h-[48px] rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.12] hover:border-white/[0.18] transition-all flex items-center justify-center gap-2 text-white/50 hover:text-white/75"
              >
                <Plus className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(13px, 2.5vw, 14px)', fontWeight: '500' }}>
                  Add Label
                </span>
              </button>
            </div>
          )}

          {/* Length Control */}
          <SliderWithCheckbox
            enabled={isLengthControlEnabled}
            value={lengthPercentage}
            onEnabledChange={setIsLengthControlEnabled}
            onValueChange={setLengthPercentage}
          />

          {/* Type Selection - Only show for Text format */}
          {outputFormat === 'text' && (
            <div className="w-full space-y-3 md:space-y-3.5">
              {/* Label */}
              <div className="flex items-center gap-2">
                <label
                  className="text-white/50"
                  style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(12px, 2.5vw, 14px)', fontWeight: '400' }}
                >
                  Type :
                </label>
              </div>

              {/* Type selector buttons */}
              <div className="flex items-center gap-2 md:gap-2.5">
                <button
                  onClick={() => {
                    if (selectedOutputType === 'todo') {
                      // If already selected, deselect
                      setSelectedOutputType('default')
                    } else {
                      // Select and enable
                      setSelectedOutputType('todo')
                      if (!isTypeEnabled) toggleTypeEnabled()
                    }
                  }}
                  className={`flex-1 h-[36px] md:h-[38px] rounded-full flex items-center justify-center transition-all border ${selectedOutputType === 'todo'
                    ? 'bg-white/[0.12] border-white/[0.22] text-white/90'
                    : 'bg-white/[0.04] border-white/[0.08] text-white/35 hover:bg-white/[0.08] hover:border-white/[0.15] hover:text-white/60'
                    } cursor-pointer`}
                >
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: '500' }}>
                    To-do List
                  </span>
                </button>

                <button
                  onClick={() => {
                    if (selectedOutputType === 'agenda') {
                      // If already selected, deselect
                      setSelectedOutputType('default')
                    } else {
                      // Select and enable
                      setSelectedOutputType('agenda')
                      if (!isTypeEnabled) toggleTypeEnabled()
                    }
                  }}
                  className={`flex-1 h-[36px] md:h-[38px] rounded-full flex items-center justify-center transition-all border ${selectedOutputType === 'agenda'
                    ? 'bg-white/[0.12] border-white/[0.22] text-white/90'
                    : 'bg-white/[0.04] border-white/[0.08] text-white/35 hover:bg-white/[0.08] hover:border-white/[0.15] hover:text-white/60'
                    } cursor-pointer`}
                >
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: '500' }}>
                    Agenda
                  </span>
                </button>

                <button
                  onClick={() => {
                    if (selectedOutputType === 'eod') {
                      // If already selected, deselect
                      setSelectedOutputType('default')
                    } else {
                      // Select and enable
                      setSelectedOutputType('eod')
                      if (!isTypeEnabled) toggleTypeEnabled()
                    }
                  }}
                  className={`flex-1 h-[36px] md:h-[38px] rounded-full flex items-center justify-center transition-all border ${selectedOutputType === 'eod'
                    ? 'bg-white/[0.12] border-white/[0.22] text-white/90'
                    : 'bg-white/[0.04] border-white/[0.08] text-white/35 hover:bg-white/[0.08] hover:border-white/[0.15] hover:text-white/60'
                    } cursor-pointer`}
                >
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(11px, 2.5vw, 13px)', fontWeight: '500' }}>
                    EoD
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Output Display */}
          <OutputDisplay
            content={convertedText}
            isLoading={convertMutation.isPending}
            onCopy={() => {
              // Optional: Track manual copies if needed
            }}
          />

          {/* Convert Button */}
          <PrimaryButton
            onClick={handleConvert}
            disabled={convertMutation.isPending || !rawText.trim()}
          />
        </div>
      </div>

      {/* Add Label Modal */}
      <Dialog open={isAddLabelModalOpen} onOpenChange={setIsAddLabelModalOpen}>
        <DialogContent className="bg-gradient-to-b from-[#502a6e]/95 via-[#3d1f57]/90 to-[#2a1540]/85 backdrop-blur-3xl border-white/25 text-white max-w-[90%] md:max-w-md rounded-[32px] md:rounded-[36px]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.08\'/%3E%3C/svg%3E")',
          backgroundBlendMode: 'overlay'
        }}>
          <DialogHeader>
            <DialogTitle className="text-white/90" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(18px, 3vw, 20px)', fontWeight: '600' }}>
              Add label for additional information:
            </DialogTitle>
            <DialogDescription className="text-white/60" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(13px, 2.5vw, 14px)' }}>
              Enter a custom field name to include in your email context.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Input */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl rounded-[24px] border border-white/[0.15]" />
              <input
                type="text"
                value={newLabelInput}
                onChange={(e) => setNewLabelInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddLabel()
                  }
                }}
                placeholder="e.g. Institute name, Role"
                className="relative w-full bg-transparent border-none outline-none text-white/90 placeholder:text-white/35 px-5 py-4"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(14px, 2.5vw, 15px)', fontWeight: '400' }}
                autoFocus
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsAddLabelModalOpen(false)
                  setNewLabelInput('')
                }}
                className="flex-1 h-[44px] md:h-[48px] rounded-full bg-gradient-to-b from-red-500/70 to-red-600/60 hover:from-red-500/80 hover:to-red-600/70 border border-red-400/30 hover:border-red-400/40 transition-all text-[#ffd7c4] hover:text-[#ffe5d9] flex items-center justify-center"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(14px, 2.5vw, 15px)', fontWeight: '500' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddLabel}
                disabled={!newLabelInput.trim()}
                className="flex-1 h-[44px] md:h-[48px] rounded-full bg-white/[0.12] hover:bg-white/[0.18] border border-white/[0.22] hover:border-white/[0.28] transition-all text-white/85 hover:text-white/95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(14px, 2.5vw, 15px)', fontWeight: '500' }}
              >
                Add
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tone Info Modal */}
      <Dialog open={isToneInfoModalOpen} onOpenChange={setToneInfoModalOpen}>
        <DialogContent className="bg-gradient-to-b from-[#502a6e]/95 via-[#3d1f57]/90 to-[#2a1540]/85 backdrop-blur-3xl border-white/25 text-white max-w-[90%] md:max-w-md rounded-[32px] md:rounded-[36px]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.08\'/%3E%3C/svg%3E")',
          backgroundBlendMode: 'overlay'
        }}>
          <DialogHeader>
            <DialogTitle className="text-white/90" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(18px, 3vw, 20px)', fontWeight: '600' }}>
              About Formalify's Tone
            </DialogTitle>
            <DialogDescription className="text-white/75 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(14px, 2.5vw, 15px)', fontWeight: '400' }}>
              Formalify's tone is meticulously crafted to be highly professional, sophisticated, and detail-oriented, reflecting a diligent and effective persona.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Close Button */}
            <button
              onClick={() => setToneInfoModalOpen(false)}
              className="w-full h-[44px] md:h-[48px] rounded-full bg-white/[0.12] hover:bg-white/[0.18] border border-white/[0.22] hover:border-white/[0.28] transition-all text-white/85 hover:text-white/95 flex items-center justify-center"
              style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(14px, 2.5vw, 15px)', fontWeight: '500' }}
            >
              Got it
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Microphone Permission Help Modal */}
      <Dialog open={isMicHelpModalOpen} onOpenChange={setIsMicHelpModalOpen}>
        <DialogContent className="bg-gradient-to-b from-[#502a6e]/95 via-[#3d1f57]/90 to-[#2a1540]/85 backdrop-blur-3xl border-white/25 text-white max-w-[90%] md:max-w-lg rounded-[32px] md:rounded-[36px]" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.08\'/%3E%3C/svg%3E")',
          backgroundBlendMode: 'overlay'
        }}>
          <DialogHeader>
            <DialogTitle className="text-white/90 flex items-center gap-2" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(18px, 3vw, 20px)', fontWeight: '600' }}>
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              Microphone Permission Required
            </DialogTitle>
            <DialogDescription className="text-white/70 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(13px, 2.5vw, 14px)', fontWeight: '400' }}>
              Formalify needs access to your microphone to transcribe your speech.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-5">
            {/* Permission Status */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl rounded-[20px] border border-white/[0.12]" />
              <div className="relative px-4 py-3 flex items-center gap-3">
                {permissionStatus === 'denied' ? (
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                ) : permissionStatus === 'granted' ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                ) : (
                  <HelpCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-white/85" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(13px, 2.5vw, 14px)', fontWeight: '500' }}>
                    {permissionStatus === 'denied' && 'Permission Denied'}
                    {permissionStatus === 'granted' && 'Permission Granted'}
                    {permissionStatus === 'prompt' && 'Permission Not Yet Requested'}
                    {permissionStatus === 'unknown' && 'Permission Status Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <p className="text-white/80" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(13px, 2.5vw, 14px)', fontWeight: '600' }}>
                How to enable microphone access:
              </p>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/70" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '600' }}>1</span>
                  <p className="text-white/70 leading-relaxed flex-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(12px, 2.5vw, 13px)', fontWeight: '400' }}>
                    Look for a microphone icon (🎤) or camera icon in your browser's address bar (usually on the left side)
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/70" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '600' }}>2</span>
                  <p className="text-white/70 leading-relaxed flex-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(12px, 2.5vw, 13px)', fontWeight: '400' }}>
                    Click the icon and select "Always allow" or "Allow" for microphone access
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/70" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '600' }}>3</span>
                  <p className="text-white/70 leading-relaxed flex-1" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(12px, 2.5vw, 13px)', fontWeight: '400' }}>
                    Refresh the page if needed and try the microphone button again
                  </p>
                </div>
              </div>

              <div className="relative mt-4">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.08] to-blue-600/[0.04] backdrop-blur-xl rounded-[16px] border border-blue-400/[0.15]" />
                <div className="relative px-3 py-2.5">
                  <p className="text-blue-200/80 text-center" style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(11px, 2.5vw, 12px)', fontWeight: '400' }}>
                    💡 Tip: If you don't see the icon, your browser may have blocked the permission request. Check your browser settings under Privacy & Security → Site Settings → Microphone.
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setIsMicHelpModalOpen(false)}
                className="flex-1 h-[44px] md:h-[48px] rounded-full bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.15] hover:border-white/[0.22] transition-all text-white/70 hover:text-white/85 flex items-center justify-center"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(14px, 2.5vw, 15px)', fontWeight: '500' }}
              >
                Close
              </button>
              <button
                onClick={handleRequestPermission}
                className="flex-1 h-[44px] md:h-[48px] rounded-full bg-gradient-to-br from-purple-500/70 to-purple-600/60 hover:from-purple-500/80 hover:to-purple-600/70 border border-purple-400/30 hover:border-purple-400/40 transition-all text-white/90 hover:text-white flex items-center justify-center gap-2"
                style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(14px, 2.5vw, 15px)', fontWeight: '500' }}
              >
                <Mic className="w-4 h-4" />
                Request Permission
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
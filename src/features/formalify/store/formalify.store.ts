import { create } from 'zustand'
import type { FormalityLevel, OutputFormat, ContextLabel, OutputType } from '../types/formalify.types'

interface FormalityState {
  // State
  rawText: string
  convertedText: string
  formalityLevel: FormalityLevel
  outputFormat: OutputFormat
  isRecording: boolean
  isLoading: boolean
  error: string | null
  isLengthControlEnabled: boolean
  lengthPercentage: number
  contextLabels: ContextLabel[]
  isAddLabelModalOpen: boolean
  newLabelInput: string
  isTypeEnabled: boolean
  selectedOutputType: OutputType
  isToneInfoModalOpen: boolean

  // Actions
  setRawText: (text: string) => void
  setConvertedText: (text: string) => void
  setFormalityLevel: (level: FormalityLevel) => void
  setOutputFormat: (format: OutputFormat) => void
  toggleRecording: () => void
  setIsRecording: (isRecording: boolean) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  toggleLengthControl: () => void
  setIsLengthControlEnabled: (enabled: boolean) => void
  setLengthPercentage: (percentage: number) => void
  addContextLabel: (labelName: string) => void
  updateContextLabelValue: (id: string, value: string) => void
  toggleContextLabelSelection: (id: string) => void
  removeContextLabel: (id: string) => void
  setIsAddLabelModalOpen: (isOpen: boolean) => void
  setNewLabelInput: (input: string) => void
  toggleTypeEnabled: () => void
  setSelectedOutputType: (type: OutputType) => void
  setToneInfoModalOpen: (isOpen: boolean) => void
  reset: () => void
}

// Load from localStorage
const loadContextLabels = (): ContextLabel[] => {
  try {
    const stored = localStorage.getItem('formalify_context_labels')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load context labels from localStorage:', error)
  }
  
  // Default predefined fields
  return [
    { id: 'yourName', label: 'Your Name', value: '', isCompulsory: true, isPredefined: true, isSelected: true },
    { id: 'emailAddress', label: 'Your Email Address', value: '', isCompulsory: false, isPredefined: true, isSelected: false },
    { id: 'phoneNumber', label: 'Your Phone Number', value: '', isCompulsory: false, isPredefined: true, isSelected: false },
  ]
}

// Save to localStorage
const saveContextLabels = (labels: ContextLabel[]) => {
  try {
    localStorage.setItem('formalify_context_labels', JSON.stringify(labels))
  } catch (error) {
    console.error('Failed to save context labels to localStorage:', error)
  }
}

export const useFormalityStore = create<FormalityState>((set) => ({
  // Initial State
  rawText: '',
  convertedText: '',
  formalityLevel: 'casual',
  outputFormat: 'text',
  isRecording: false,
  isLoading: false,
  error: null,
  isLengthControlEnabled: false,
  lengthPercentage: 50, // 0-100 scale
  contextLabels: loadContextLabels(),
  isAddLabelModalOpen: false,
  newLabelInput: '',
  isTypeEnabled: false,
  selectedOutputType: 'default',
  isToneInfoModalOpen: false,

  // Actions
  setRawText: (text) => set({ rawText: text }),
  setConvertedText: (text) => set({ convertedText: text }),
  setFormalityLevel: (level) => set({ formalityLevel: level }),
  setOutputFormat: (format) => set({ outputFormat: format }),
  toggleRecording: () => set((state) => ({ isRecording: !state.isRecording })),
  setIsRecording: (isRecording) => set({ isRecording }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  toggleLengthControl: () => set((state) => ({ isLengthControlEnabled: !state.isLengthControlEnabled })),
  setIsLengthControlEnabled: (enabled) => set({ isLengthControlEnabled: enabled }),
  setLengthPercentage: (percentage) => set({ lengthPercentage: percentage }),
  toggleTypeEnabled: () => set((state) => ({ isTypeEnabled: !state.isTypeEnabled })),
  setSelectedOutputType: (type) => set({ selectedOutputType: type }),
  setToneInfoModalOpen: (isOpen) => set({ isToneInfoModalOpen: isOpen }),
  
  addContextLabel: (labelName) => set((state) => {
    const newLabel: ContextLabel = {
      id: `user_defined_${Date.now()}`,
      label: labelName,
      value: '',
      isCompulsory: false,
      isPredefined: false,
      isSelected: true,
    }
    const updatedLabels = [...state.contextLabels, newLabel]
    saveContextLabels(updatedLabels)
    return { contextLabels: updatedLabels, newLabelInput: '' }
  }),
  
  updateContextLabelValue: (id, value) => set((state) => {
    const updatedLabels = state.contextLabels.map((label) =>
      label.id === id ? { ...label, value } : label
    )
    saveContextLabels(updatedLabels)
    return { contextLabels: updatedLabels }
  }),
  
  toggleContextLabelSelection: (id) => set((state) => {
    const updatedLabels = state.contextLabels.map((label) =>
      label.id === id ? { ...label, isSelected: !label.isSelected } : label
    )
    saveContextLabels(updatedLabels)
    return { contextLabels: updatedLabels }
  }),
  
  removeContextLabel: (id) => set((state) => {
    const updatedLabels = state.contextLabels.filter((label) => label.id !== id)
    saveContextLabels(updatedLabels)
    return { contextLabels: updatedLabels }
  }),
  
  setIsAddLabelModalOpen: (isOpen) => set({ isAddLabelModalOpen: isOpen }),
  setNewLabelInput: (input) => set({ newLabelInput: input }),
  
  reset: () =>
    set({
      rawText: '',
      convertedText: '',
      formalityLevel: 'casual',
      outputFormat: 'text',
      isRecording: false,
      isLoading: false,
      error: null,
      isLengthControlEnabled: false,
      lengthPercentage: 50,
    }),
}))

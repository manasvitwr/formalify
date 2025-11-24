export type FormalityLevel = 'casual' | 'semi-formal' | 'professional'
export type OutputFormat = 'text' | 'email'
export type OutputType = 'default' | 'todo' | 'agenda' | 'eod'

export interface ContextLabel {
  id: string // Unique identifier (e.g., 'yourName', 'user_defined_1')
  label: string // Display name (e.g., "Your Name", "Institute Name")
  value: string // User-entered data
  isCompulsory: boolean // true for "Your Name"
  isPredefined: boolean // true for Your Name, Email, Phone
  isSelected: boolean // Controls inclusion in the API prompt
}

export interface ConvertTextParams {
  text: string
  formality: string
  format: string
  lengthControlEnabled: boolean
  lengthPercentage: number
  contextLabels?: ContextLabel[]
  isTypeEnabled: boolean
  selectedOutputType: OutputType
}

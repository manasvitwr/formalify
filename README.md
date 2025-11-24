# Formalify

AI-powered tool to transform casual text into formal emails, todos, agendas, and structured documents using Google's Gemini API.

## Features

- **Text Formatting**: Convert casual inputs into:
  - Todo lists
  - Daily agendas
  - End-of-day updates
- **Email Generation**: Create professional emails with AI assistance
- **Voice Input**: Speech-to-text support for hands-free input
- **Length Control**: Adjust output length with an intuitive slider
- **Context Labels**: Add custom fields for personalized email generation
- **Modern UI**: Beautiful glassmorphic design with smooth animations

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **AI**: Google Gemini API
- **Build Tool**: Vite
- **State Management**: Zustand
- **Voice Recognition**: Web Speech API
- **Data Fetching**: TanStack Query (React Query)

## Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- Google Gemini API key
- Microphone permissions must be granted for voice input
- Requires stable internet connection for AI processing

### Setup

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd formalify
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create `.env` file** in the project root:
   ```bash
   cp .env.example .env
   ```

4. **Add your Gemini API key** to `.env`:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

## Usage

### Development

Start the development server:
```bash
npm run dev
```

App will be available at `http://localhost:3000`

### Build

Build for production:
```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```


## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key | Yes |

## How It Works

1. **Input**: Type or speak your casual text
2. **Configure**: Choose output format (Text/Email), adjust length, select type
3. **Convert**: Click the convert button to transform your text
4. **Copy**: Automatically copied to clipboard or use the copy button

## Detail

### Text Mode
- **Todo List**: Converts casual notes into structured todo items
- **Agenda**: Creates formatted meeting agendas
- **End-of-Day**: Generates professional EoD updates

### Email Mode
- **Context Labels**: Add recipient, subject, and custom fields
- **Professional Tone**: AI ensures formal, professional language
- **Smart Formatting**: Proper email structure with greetings and signatures

### Voice Input
- Click the microphone icon to speak your text
- Real-time transcription using Web Speech API
- Permission status indicators for easy troubleshooting

Contributions are welcome!

**Made with ❤️ by Manasvi**

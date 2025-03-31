# UX Interview AI Assistant

A web application that helps conduct UX interviews with real-time AI assistance. The app provides follow-up questions based on user responses and maintains a searchable archive of past interviews.

## Features

- Real-time speech-to-text transcription
- AI-powered follow-up questions based on user responses
- Interview archiving with search functionality
- Audio recording and playback
- Transcript export
- Mobile-friendly interface

## Setup

1. Clone the repository:
```bash
git clone [your-repo-url]
cd ux-interview-ai-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5174](http://localhost:5174) in your browser

## Usage

1. Click "Start Interview" to begin a new interview
2. Allow microphone access when prompted
3. Speak your responses - the app will transcribe them in real-time
4. AI will suggest follow-up questions based on your responses
5. Click "Stop Recording" when finished
6. View past interviews in the Archive section

## Security Notes

- The application uses browser's localStorage for storing interview data
- No sensitive data is stored or transmitted
- API keys and sensitive information should be stored in environment variables (not included in this repository)

## Development

- Built with React + TypeScript
- Uses Vite for fast development and building
- Material-UI for components
- Web Speech API for transcription

## License

MIT

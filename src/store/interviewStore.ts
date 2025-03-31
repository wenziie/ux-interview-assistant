import { create } from 'zustand';

interface TranscriptEntry {
  id: string;
  text: string;
  speaker: 'system' | 'user' | 'ai';
  timestamp: string;
  type?: 'silence' | 'keyword';
  triggerWords?: string[];
  questions?: string[];
}

interface InterviewStore {
  isRecording: boolean;
  isPaused: boolean;
  currentLanguage: 'en' | 'sv';
  context: string;
  transcript: TranscriptEntry[];
  startRecording: () => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  setLanguage: (lang: 'en' | 'sv') => void;
  setContext: (context: string) => void;
  addTranscriptEntry: (entry: Omit<TranscriptEntry, 'id'>) => void;
  updateTranscriptEntry: (id: string, updates: Partial<Omit<TranscriptEntry, 'id'>>) => void;
  clearTranscript: () => void;
}

const useInterviewStore = create<InterviewStore>((set) => ({
  isRecording: false,
  isPaused: false,
  currentLanguage: 'en',
  context: '',
  transcript: [],
  startRecording: () => set({ isRecording: true, isPaused: false }),
  stopRecording: () => set({ isRecording: false, isPaused: false }),
  pauseRecording: () => set({ isPaused: true }),
  resumeRecording: () => set({ isPaused: false }),
  setLanguage: (lang) => set({ currentLanguage: lang }),
  setContext: (context) => set({ context }),
  addTranscriptEntry: (entry) =>
    set((state) => ({
      transcript: [
        ...state.transcript,
        { ...entry, id: Date.now().toString() },
      ],
    })),
  updateTranscriptEntry: (id, updates) =>
    set((state) => ({
      transcript: state.transcript.map(entry =>
        entry.id === id ? { ...entry, ...updates } : entry
      ),
    })),
  clearTranscript: () => set({ transcript: [] }),
}));

export default useInterviewStore; 
import useInterviewStore from '../store/interviewStore';

class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private silenceTimeout: NodeJS.Timeout | null = null;
  private lastSpeechTime: number = 0;
  private hasSpeechOccurred: boolean = false;

  constructor() {
    this.handleDataAvailable = this.handleDataAvailable.bind(this);
    this.handleSilence = this.handleSilence.bind(this);
  }

  private handleDataAvailable(event: BlobEvent) {
    if (event.data.size > 0) {
      this.audioChunks.push(event.data);
    }
  }

  private handleSilence() {
    const store = useInterviewStore.getState();
    const currentTime = Date.now();
    const silenceDuration = (currentTime - this.lastSpeechTime) / 1000;

    // Only trigger silence detection if someone has spoken first
    if (this.hasSpeechOccurred && silenceDuration >= 8) {
      // First, add system message
      store.addTranscriptEntry({
        text: 'Silence detected',
        speaker: 'system',
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }),
      });
      
      // Then add AI suggestions with follow-up questions
      const aiQuestions = [
        "Could you elaborate a little more around that?",
        "Can you walk me through an example?"
      ];
      
      // Add AI entry with formatted questions
      store.addTranscriptEntry({
        text: `Assistant suggests:\n${aiQuestions.map(q => `• ${q}`).join('\n')}`,
        speaker: 'ai',
        type: 'silence',
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }),
        questions: aiQuestions,
      });
      
      // Reset the last speech time to something very recent to prevent multiple silence messages
      // until someone speaks again
      this.lastSpeechTime = Number.MAX_SAFE_INTEGER; // This effectively pauses the silence detection
    }
  }

  // Modified to accept language AND mode
  async startRecording(language: 'en' | 'sv', mode: 'hardcoded' | 'ai'): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.lastSpeechTime = Date.now();
      this.hasSpeechOccurred = false;

      this.mediaRecorder.ondataavailable = this.handleDataAvailable;
      this.mediaRecorder.start(1000); 

      // Clear any existing timer first
      if (this.silenceTimeout) {
        clearInterval(this.silenceTimeout);
        this.silenceTimeout = null;
      }

      // Only start silence detection timer if in hardcoded mode AND English
      if (mode === 'hardcoded' && language === 'en') {
        console.log("Starting silence detection interval (Hardcoded mode, English).");
        this.silenceTimeout = setInterval(this.handleSilence, 1000);
      } else {
        console.log("Silence detection disabled (AI mode or non-English language).");
      }

      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      return false;
    }
  }

  async stopRecording(): Promise<Blob | null> {
    if (!this.mediaRecorder) return null;

    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());
        this.mediaRecorder = null;
        
        // Clear silence detection interval
        if (this.silenceTimeout) {
          clearInterval(this.silenceTimeout);
          this.silenceTimeout = null;
        }
        
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  // Call this method when speech is detected to reset silence timer
  updateLastSpeechTime() {
    this.lastSpeechTime = Date.now();
    this.hasSpeechOccurred = true; // Mark that speech has occurred
  }
}

export const audioRecorder = new AudioRecorder(); 
interface AnalysisResult {
  questions: string[];
  triggerWords: string[];
}

const TRIGGER_WORDS = {
  user: ['stakeholder', 'end-user', 'client', 'customer journey', 'user experience', 'user interface', 'user'],
  problem: ['obstacle', 'bottleneck', 'frustration', 'pain point', 'inefficiency', 'friction', 'problem', 'issue'],
  solution: ['implementation', 'workaround', 'resolution', 'approach', 'methodology', 'framework', 'solution', 'fix'],
  emotion: ['frustrated', 'overwhelmed', 'delighted', 'confused', 'dissatisfied', 'enthusiastic', 'happy', 'sad'],
  feature: ['functionality', 'capability', 'integration', 'component', 'module', 'enhancement', 'feature', 'function'],
};

export const generateSummary = (transcript: string, context: string): string => {
  // This is a placeholder implementation that will be replaced with actual AI integration
  // For now, we'll create a simple summary based on the transcript length and context
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const keyPoints = sentences.slice(0, 3).map(s => s.trim());
  
  return `Summary of Interview:
Context: ${context}

Key Points:
${keyPoints.map((point, index) => `${index + 1}. ${point}`).join('\n')}

Total Length: ${transcript.length} characters
Number of Sentences: ${sentences.length}`;
};

export const generateFollowUpQuestion = (transcript: string, context: string): string => {
  // This is a placeholder implementation that will be replaced with actual AI integration
  // For now, we'll return a generic follow-up question
  return "Could you tell me more about that?";
};

export const analyzeTranscript = (transcript: string): AnalysisResult => {
  console.log("Analyzing transcript in aiUtils:", transcript);
  
  if (!transcript || transcript.trim().length === 0) {
    return { questions: [], triggerWords: [] };
  }
  
  // Convert transcript to lowercase for case-insensitive matching
  const transcriptLower = transcript.toLowerCase().trim();
  const words = transcriptLower.split(/\s+/);
  const foundTriggerWords: string[] = [];
  const questions: string[] = [];

  console.log("Looking for trigger words in:", transcriptLower);
  console.log("Words:", words);

  // Simpler, more reliable trigger word detection
  // First check single words (most reliable)
  words.forEach(word => {
    Object.entries(TRIGGER_WORDS).forEach(([category, triggers]) => {
      triggers.forEach(trigger => {
        // Only check single-word triggers first
        if (trigger.indexOf(' ') === -1 && word === trigger.toLowerCase()) {
          console.log(`Found exact trigger word match: ${trigger}`);
          foundTriggerWords.push(trigger);
        }
      });
    });
  });
  
  // Then check for phrases if no single words were found
  if (foundTriggerWords.length === 0) {
    Object.entries(TRIGGER_WORDS).forEach(([category, triggers]) => {
      triggers.forEach(trigger => {
        // Only check multi-word triggers
        if (trigger.indexOf(' ') !== -1 && transcriptLower.includes(trigger.toLowerCase())) {
          console.log(`Found trigger phrase: ${trigger}`);
          foundTriggerWords.push(trigger);
        }
      });
    });
  }

  console.log("Found trigger words:", foundTriggerWords);

  // Generate questions based on trigger words (limit to 2)
  if (foundTriggerWords.length > 0) {
    if (foundTriggerWords.some(word => TRIGGER_WORDS.user.some(w => w.toLowerCase() === word.toLowerCase()))) {
      questions.push("How does this affect the user's daily workflow?");
    }
    if (questions.length < 2 && foundTriggerWords.some(word => TRIGGER_WORDS.problem.some(w => w.toLowerCase() === word.toLowerCase()))) {
      questions.push("What are the main challenges they're facing?");
    }
    if (questions.length < 2 && foundTriggerWords.some(word => TRIGGER_WORDS.solution.some(w => w.toLowerCase() === word.toLowerCase()))) {
      questions.push("What solutions have they tried so far?");
    }
    if (questions.length < 2 && foundTriggerWords.some(word => TRIGGER_WORDS.emotion.some(w => w.toLowerCase() === word.toLowerCase()))) {
      questions.push("How does this make them feel?");
    }
    if (questions.length < 2 && foundTriggerWords.some(word => TRIGGER_WORDS.feature.some(w => w.toLowerCase() === word.toLowerCase()))) {
      questions.push("What features would help solve this problem?");
    }
  }

  // If no specific questions were generated, add a default question
  if (questions.length === 0 && foundTriggerWords.length > 0) {
    questions.push(`Can you elaborate more about ${foundTriggerWords[0]}?`);
    // Always add at least one more generic question
    questions.push("How does this impact the overall experience?");
  }

  console.log("Generated questions:", questions);

  return {
    questions: questions.slice(0, 2), // Ensure max 2 questions
    triggerWords: foundTriggerWords,
  };
}; 
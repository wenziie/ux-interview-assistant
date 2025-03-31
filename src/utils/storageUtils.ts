interface Interview {
  id: string;
  date: string;
  context: string;
  transcript: string;
  audioUrl?: string;
}

const STORAGE_KEY = 'ux_interviews';

export const saveInterview = (interview: Interview): void => {
  const interviews = getInterviews();
  interviews.push(interview);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(interviews));
};

export const getInterviews = (): Interview[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const getInterviewById = (id: string): Interview | undefined => {
  const interviews = getInterviews();
  return interviews.find(interview => interview.id === id);
};

export const deleteInterview = (id: string): void => {
  const interviews = getInterviews();
  const filtered = interviews.filter(interview => interview.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const updateInterview = (id: string, updates: Partial<Interview>): void => {
  const interviews = getInterviews();
  const index = interviews.findIndex(interview => interview.id === id);
  if (index !== -1) {
    interviews[index] = { ...interviews[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(interviews));
  }
}; 
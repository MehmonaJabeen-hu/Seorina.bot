export interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: number;
  audioBase64?: string;
  isVoiceNote?: boolean;
  photoUrl?: string;
  photoCaption?: string;
  isStreaming?: boolean;
  isGeneratingVoice?: boolean;
}

export interface UserProfile {
  nickname: string;
  autoVoice: boolean;
  soundEffects: boolean;
}

export interface Memory {
  id: string;
  note: string;
  createdAt: number;
}

export interface Moment {
  id: string;
  title: string;
  location: string;
  timeAgo: string;
  image: string;
  caption: string;
}

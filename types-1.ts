
export interface Sentence {
  id: number;
  enText: string; // The text being learned
  faText: string; // The translation
  enAudio?: AudioBuffer;
  faAudio?: AudioBuffer;
}

export enum PlaybackState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  PLAYING_EN = 'PLAYING_EN',
  PLAYING_FA = 'PLAYING_FA',
  PAUSED = 'PAUSED'
}

export interface Chapter {
  id: string;
  title: string;
  sentences: Sentence[];
}

export interface Book {
  id: string;
  title: string;
  sourceLang: string;
  targetLang: string;
  chapters: Chapter[];
  createdAt: number;
}

export interface Definition {
  word: string;
  definition: string;
  example?: string;
}

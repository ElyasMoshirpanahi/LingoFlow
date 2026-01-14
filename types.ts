
export interface Sentence {
  id: number;
  enText: string;
  faText: string;
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
  title: string;
  sentences: Sentence[];
}

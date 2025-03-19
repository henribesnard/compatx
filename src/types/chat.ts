import { Source } from '.';

export interface StreamOptions {
  partie?: number;
  chapitre?: number;
  n_results?: number;
  include_sources?: boolean;
  save_to_conversation?: string;
  create_conversation?: boolean;
}

export interface StreamProgress {
  status: 'retrieving' | 'analyzing' | 'generating';
  completion: number;
}

export type StreamStatus = 
  | 'idle' 
  | 'connecting' 
  | 'streaming' 
  | 'complete' 
  | 'error';

export interface StreamCallbacks {
  onStart?: (data: any) => void;
  onProgress?: (data: StreamProgress) => void;
  onChunk?: (text: string) => void;
  onComplete?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface SSEEvent {
  type: string;
  data: string;
}
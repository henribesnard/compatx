export interface ApiSource {
    document_id: string;
    metadata?: {
      title?: string;
      partie?: number;
      chapitre?: number;
      document_type?: string;
    };
    relevance_score: number;
    preview?: string;
  }
  
  export interface ApiPerformance {
    search_time_seconds?: number;
    context_time_seconds?: number;
    generation_time_seconds?: number;
    total_time_seconds: number;
  }
  
  export interface ApiQueryResponse {
    id: string;
    query: string;
    answer: string;
    sources?: ApiSource[];
    performance: ApiPerformance;
    timestamp: number;
    conversation_id?: string;
    user_message_id?: string;
    ia_message_id?: string;
  }
  
  export interface ApiConversation {
    conversation_id: string;
    title: string;
    user_id: string;
    created_at: string;
    updated_at: string;
    message_count?: number;
    first_message?: string;
    messages?: ApiMessage[];
  }
  
  export interface ApiMessage {
    message_id: string;
    conversation_id: string;
    user_id: string;
    is_user: boolean;
    content: string;
    created_at: string;
    metadata?: {
      performance?: ApiPerformance;
      sources?: ApiSource[];
      feedback?: {
        rating: number;
        comment?: string;
      };
    };
  }
  
  export interface ApiError {
    detail?: string;
    message?: string;
    status?: string;
    errors?: Record<string, string[]>;
  }
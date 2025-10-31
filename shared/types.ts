export interface DemoItem {
  id: string;
  name: string;
  value: number;
}
export interface Message {
  id: string;
  text: string;
  timestamp: string; // ISO string
  mockSenderId?: string; // Optional mock sender ID for chat differentiation
}
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface RateLimitState {
  [ip: string]: number; // IP address to last request timestamp (ms)
}
export interface UserSession {
  token: string;
  expiresAt: string; // ISO string
  createdAt: string; // ISO string
}
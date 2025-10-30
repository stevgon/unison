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
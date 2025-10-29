export interface DemoItem {
  id: string;
  name: string;
  value: number;
}
export interface Message {
  id: string;
  text: string;
  timestamp: string; // ISO string
}
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
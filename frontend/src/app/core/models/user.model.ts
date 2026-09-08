export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token: string;
  user: User;
}

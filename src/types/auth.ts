export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
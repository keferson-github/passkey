import { createContext } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
  is_admin: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  profile: Profile | null;
  refetchProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

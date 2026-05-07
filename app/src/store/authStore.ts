import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { fetchMe } from '../lib/api';

interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  setSession: (session: any) => void;
  loadProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,

  setSession: (session) => {
    set({ session });
    if (session) get().loadProfile();
    else set({ user: null, loading: false });
  },

  loadProfile: async () => {
    try {
      const user = await fetchMe();
      set({ user, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  refreshProfile: async () => {
    const user = await fetchMe();
    set({ user });
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUp: async (email, password, username) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
}));

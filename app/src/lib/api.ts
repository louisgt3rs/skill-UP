import axios from 'axios';
import { supabase } from './supabase';
import { Match, User, Dispute } from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Matches ──────────────────────────────────────────────────

export const fetchMatches = async (params?: {
  status?: string;
  game?: string;
  format?: string;
}): Promise<Match[]> => {
  const { data } = await api.get('/api/matches', { params });
  return data;
};

export const fetchMatch = async (id: string): Promise<Match> => {
  const { data } = await api.get(`/api/matches/${id}`);
  return data;
};

export const createMatch = async (payload: {
  game: string;
  format: string;
  rules?: string;
  entry_cost: number;
}): Promise<Match> => {
  const { data } = await api.post('/api/matches', payload);
  return data;
};

export const joinMatch = async (matchId: string, team: 1 | 2): Promise<void> => {
  await api.post(`/api/matches/${matchId}/join`, { team });
};

export const submitResult = async (
  matchId: string,
  claimed_result: 'win' | 'loss'
): Promise<void> => {
  await api.post(`/api/matches/${matchId}/result`, { claimed_result });
};

// ── Proofs ───────────────────────────────────────────────────

export const uploadProof = async (
  matchId: string,
  fileUri: string,
  mimeType: string
): Promise<{ file_url: string; signed_url: string }> => {
  const formData = new FormData();
  formData.append('match_id', matchId);
  formData.append('file', {
    uri: fileUri,
    name: `proof.${mimeType.split('/')[1]}`,
    type: mimeType,
  } as any);

  const { data } = await api.post('/api/proofs/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const getSignedUrl = async (path: string): Promise<string> => {
  const { data } = await api.get('/api/proofs/signed-url', { params: { path } });
  return data.signed_url;
};

// ── Users ────────────────────────────────────────────────────

export const fetchMe = async (): Promise<User> => {
  const { data } = await api.get('/api/users/me');
  return data;
};

export const fetchUser = async (id: string): Promise<User> => {
  const { data } = await api.get(`/api/users/${id}`);
  return data;
};

export const updateProfile = async (payload: {
  username?: string;
  avatar_url?: string;
}): Promise<User> => {
  const { data } = await api.put('/api/users/me', payload);
  return data;
};

export const fetchMyMatches = async () => {
  const { data } = await api.get('/api/users/me/matches');
  return data;
};

// ── Disputes ─────────────────────────────────────────────────

export const reportMatch = async (matchId: string): Promise<void> => {
  await api.post(`/api/disputes/${matchId}/report`);
};

export const fetchDisputes = async (): Promise<Dispute[]> => {
  const { data } = await api.get('/api/disputes');
  return data;
};

export const resolveDispute = async (
  matchId: string,
  winner_team: 1 | 2,
  admin_notes?: string
): Promise<void> => {
  await api.post(`/api/disputes/${matchId}/resolve`, { winner_team, admin_notes });
};

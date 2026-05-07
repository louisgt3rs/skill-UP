export interface User {
  id: string;
  username: string;
  avatar_url: string | null;
  credits: number;
  reputation: number;
  is_admin: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  game: string;
  format: '1v1' | '2v2' | '3v3';
  rules: string | null;
  entry_cost: number;
  status: 'pending' | 'active' | 'completed' | 'disputed';
  creator_id: string;
  winner_team: 1 | 2 | null;
  max_players: number;
  created_at: string;
  updated_at: string;
  creator?: Pick<User, 'id' | 'username' | 'avatar_url' | 'reputation'>;
  match_participants?: MatchParticipant[];
  proofs?: Proof[];
  disputes?: Dispute[];
}

export interface MatchParticipant {
  id?: string;
  match_id: string;
  user_id: string;
  team: 1 | 2;
  result_submitted: boolean;
  claimed_result: 'win' | 'loss' | null;
  credits_locked: boolean;
  joined_at: string;
  users?: Pick<User, 'id' | 'username' | 'avatar_url' | 'reputation'>;
}

export interface Proof {
  id: string;
  match_id: string;
  user_id: string;
  file_url: string;
  file_type: 'image' | 'video';
  created_at: string;
  signed_url?: string;
}

export interface Dispute {
  id: string;
  match_id: string;
  status: 'open' | 'resolved';
  winner_team: 1 | 2 | null;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  MatchDetail: { matchId: string };
  SubmitResult: { matchId: string; matchGame: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  CreateMatch: undefined;
  ProfileTab: undefined;
};

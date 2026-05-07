export interface Profile {
  id: string;
  username: string;
  hashtag: string;
  credits: number;
  created_at: string;
}

export interface Match {
  id: string;
  game: string;
  challenger_id: string;
  opponent_id: string;
  wager: number;
  status: 'pending' | 'active' | 'finished' | 'completed' | 'disputed';
  challenger_result: 'win' | 'loss' | null;
  opponent_result: 'win' | 'loss' | null;
  winner_id: string | null;
  created_at: string;
  challenger?: Profile;
  opponent?: Profile;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

export const GAMES: GameDef[] = [
  {
    slug: 'brawl-stars',
    name: 'Brawl Stars',
    emoji: '🌟',
    color: '#FFDE59',
    bg: '#1A1200',
    description: 'Duels 1v1 — le meilleur score en 3 parties gagne',
    players: '2 joueurs',
  },
  {
    slug: 'clash-royale',
    name: 'Clash Royale',
    emoji: '👑',
    color: '#4A90D9',
    bg: '#0A1520',
    description: 'Battle 1v1 — premier à 2 victoires',
    players: '2 joueurs',
    comingSoon: true,
  },
  {
    slug: 'fifa',
    name: 'FC Mobile',
    emoji: '⚽',
    color: '#10B981',
    bg: '#001A0A',
    description: 'Match complet — score final',
    players: '2 joueurs',
    comingSoon: true,
  },
];

export interface GameDef {
  slug: string;
  name: string;
  emoji: string;
  color: string;
  bg: string;
  description: string;
  players: string;
  comingSoon?: boolean;
}

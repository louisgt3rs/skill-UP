export interface Profile {
  id: string;
  username: string;
  hashtag: string;
  credits: number;
  wins: number;
  losses: number;
  win_streak: number;
  discord_id: string | null;
  discord_username: string | null;
  discord_avatar: string | null;
  discord_linked_at: string | null;
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

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'match_win' | 'match_loss' | 'match_wager' | 'refund';
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount_credits: number;
  amount_eur: number;
  full_name: string;
  iban: string | null;
  method: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// ── Games ─────────────────────────────────────────────────

export interface GameDef {
  slug: string;
  name: string;
  emoji: string;
  color: string;
  bg: string;
  description: string;
  rules: string;
  platform: string;
  available: boolean;
}

export const GAMES: GameDef[] = [
  {
    slug: 'brawl-stars',
    name: 'Brawl Stars',
    emoji: '🌟',
    color: '#FFDE59',
    bg: '#1A1200',
    description: 'Duels 1v1 en mode Showdown ou Duel',
    rules: 'Le joueur avec le meilleur score sur 3 parties gagne.',
    platform: 'Mobile',
    available: true,
  },
  {
    slug: 'clash-royale',
    name: 'Clash Royale',
    emoji: '👑',
    color: '#60A5FA',
    bg: '#0A1520',
    description: 'Batailles de cartes en 1v1',
    rules: 'Premier à 2 victoires remporte le duel.',
    platform: 'Mobile',
    available: false,
  },
  {
    slug: 'fc-mobile',
    name: 'FC Mobile',
    emoji: '⚽',
    color: '#34D399',
    bg: '#001A0A',
    description: 'Football 1v1 sur mobile',
    rules: 'Score final du match complet.',
    platform: 'Mobile',
    available: false,
  },
  {
    slug: 'fortnite',
    name: 'Fortnite',
    emoji: '🎯',
    color: '#A78BFA',
    bg: '#0D0A1F',
    description: 'Battle Royale — kills et placement',
    rules: 'Le joueur avec le plus de kills gagne. En cas d\'égalité, le mieux classé l\'emporte.',
    platform: 'PC / Console',
    available: false,
  },
  {
    slug: 'rocket-league',
    name: 'Rocket League',
    emoji: '🚀',
    color: '#F97316',
    bg: '#1A0800',
    description: 'Football avec des voitures en 1v1',
    rules: 'Match complet — score final.',
    platform: 'PC / Console',
    available: false,
  },
  {
    slug: 'ea-fc',
    name: 'EA FC 25',
    emoji: '🏟️',
    color: '#22D3EE',
    bg: '#001520',
    description: 'Football sur PC / Console',
    rules: 'Match Ultimate Team complet — score final.',
    platform: 'PC / Console',
    available: false,
  },
];

// ── Badges ────────────────────────────────────────────────

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  check: (stats: PlayerStats) => boolean;
}

export interface PlayerStats {
  wins: number;
  losses: number;
  totalDuels: number;
  winStreak: number;
  discordLinked: boolean;
}

export const BADGES: BadgeDef[] = [
  {
    id: 'first_win',
    name: 'Première victoire',
    description: 'Remporter son tout premier duel',
    icon: '🥇',
    condition: '1 victoire',
    check: s => s.wins >= 1,
  },
  {
    id: 'hot_streak',
    name: 'Série chaude',
    description: '3 victoires consécutives',
    icon: '🔥',
    condition: '3 victoires d\'affilée',
    check: s => s.winStreak >= 3,
  },
  {
    id: 'win_machine',
    name: 'Machine à gagner',
    description: 'Accumuler 10 victoires',
    icon: '💪',
    condition: '10 victoires',
    check: s => s.wins >= 10,
  },
  {
    id: 'unbeaten',
    name: 'Invaincu',
    description: '5 victoires sans aucune défaite',
    icon: '🛡️',
    condition: '5 wins, 0 défaite',
    check: s => s.wins >= 5 && s.losses === 0,
  },
  {
    id: 'verified',
    name: 'Joueur vérifié',
    description: 'Compte Discord lié au profil',
    icon: '✅',
    condition: 'Discord lié',
    check: s => s.discordLinked,
  },
  {
    id: 'big_player',
    name: 'Gros joueur',
    description: 'Participer à 50 duels',
    icon: '🎮',
    condition: '50 duels joués',
    check: s => s.totalDuels >= 50,
  },
  {
    id: 'legend',
    name: 'Légende SkillUp',
    description: 'Atteindre 100 victoires',
    icon: '👑',
    condition: '100 victoires',
    check: s => s.wins >= 100,
  },
];

export function computeStats(matches: Match[], userId: string, discordLinked: boolean): PlayerStats {
  const completed = matches.filter(m => m.status === 'completed');
  const wins   = completed.filter(m => m.winner_id === userId).length;
  const losses = completed.filter(m => m.winner_id !== null && m.winner_id !== userId).length;
  const totalDuels = wins + losses;

  let winStreak = 0;
  for (const m of [...completed].reverse()) {
    if (m.winner_id === userId) winStreak++;
    else break;
  }

  return { wins, losses, totalDuels, winStreak, discordLinked };
}

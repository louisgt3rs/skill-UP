const { supabase } = require('./supabase');

function getMaxPlayers(format) {
  const n = parseInt(format.split('v')[0], 10);
  return n * 2;
}

function getPlayersPerTeam(format) {
  return parseInt(format.split('v')[0], 10);
}

async function checkAndFinalizeMatch(matchId) {
  const { data: participants, error } = await supabase
    .from('match_participants')
    .select('user_id, team, result_submitted, claimed_result')
    .eq('match_id', matchId);

  if (error || !participants) return;

  const allSubmitted = participants.every(p => p.result_submitted);
  if (!allSubmitted) return;

  const team1 = participants.filter(p => p.team === 1);
  const team2 = participants.filter(p => p.team === 2);

  // All team members must agree internally
  const team1Results = [...new Set(team1.map(p => p.claimed_result))];
  const team2Results = [...new Set(team2.map(p => p.claimed_result))];

  const team1Unanimous = team1Results.length === 1;
  const team2Unanimous = team2Results.length === 1;

  if (!team1Unanimous || !team2Unanimous) {
    await createDispute(matchId);
    return;
  }

  const t1 = team1Results[0];
  const t2 = team2Results[0];

  if (t1 === 'win' && t2 === 'loss') {
    await supabase.rpc('distribute_winnings', { p_match_id: matchId, p_winner_team: 1 });
  } else if (t1 === 'loss' && t2 === 'win') {
    await supabase.rpc('distribute_winnings', { p_match_id: matchId, p_winner_team: 2 });
  } else {
    await createDispute(matchId);
  }
}

async function createDispute(matchId) {
  await supabase.from('disputes').upsert({ match_id: matchId, status: 'open' });
  await supabase
    .from('matches')
    .update({ status: 'disputed', updated_at: new Date().toISOString() })
    .eq('id', matchId);
}

module.exports = { getMaxPlayers, getPlayersPerTeam, checkAndFinalizeMatch };

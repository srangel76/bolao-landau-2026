// Configuração do Supabase
const SUPABASE_URL = 'https://nhowdqksjqpjlorlfgoj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ob3dkcWtzanFwamxvcmxmZ29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NDU4NTUsImV4cCI6MjA2NDEyMTg1NX0.YqhzOdQz8vV4V1TKLLlQyJJ4R0VqXXGqVy1XM5oiXKs';

// Inicializar cliente Supabase (usando CDN)
let supabase;

// Função para inicializar o Supabase
function initSupabase() {
  if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase inicializado com sucesso');
    return true;
  }
  console.error('Biblioteca Supabase não carregada');
  return false;
}

// Funções de autenticação
async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

async function signUpWithEmail(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
      }
    }
  });
  return { data, error };
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Funções de banco de dados
async function getGames() {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('game_date', { ascending: true });
  return { data, error };
}

async function getBets(userId) {
  const { data, error } = await supabase
    .from('bets')
    .select('*, games(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return { data, error };
}

async function createBet(userId, gameId, goalsA, goalsB) {
  const { data, error } = await supabase
    .from('bets')
    .insert([{
      user_id: userId,
      game_id: gameId,
      predicted_goals_a: goalsA,
      predicted_goals_b: goalsB
    }]);
  return { data, error };
}

async function getRanking() {
  const { data, error } = await supabase
    .from('bets')
    .select('user_id, points, users(name, email)')
    .order('points', { ascending: false });
  
  if (error) return { data: null, error };
  
  // Agrupar por usuário e somar pontos
  const ranking = {};
  data.forEach(bet => {
    const userId = bet.user_id;
    if (!ranking[userId]) {
      ranking[userId] = {
        name: bet.users.name,
        email: bet.users.email,
        points: 0
      };
    }
    ranking[userId].points += bet.points || 0;
  });
  
  // Converter para array e ordenar
  const rankingArray = Object.values(ranking).sort((a, b) => b.points - a.points);
  
  return { data: rankingArray, error: null };
}

async function getUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('is_approved', true)
    .order('name', { ascending: true });
  return { data, error };
}

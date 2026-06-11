'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchAPI } from '../../../lib/api';

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id;

  const [ranking, setRanking] = useState<any[]>([]);
  const [groupName, setGroupName] = useState('');
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados locais para controlar os inputs dos placares antes de salvar
  const [localGuesses, setLocalGuesses] = useState<Record<number, { a: string, b: string }>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        // Carrega o ranking do grupo
        const rankData = await fetchAPI(`/groups/${groupId}/ranking`);
        setRanking(rankData.ranking);
        setGroupName(rankData.group_name);

        // Carrega a lista de jogos e os palpites do usuário
        const matchData = await fetchAPI('/guesses/matches');
        setMatches(matchData);

        // Preenche os estados locais com os palpites já salvos no banco
        const initialGuesses: Record<number, { a: string, b: string }> = {};
        matchData.forEach((match: any) => {
          if (match.my_guess) {
            initialGuesses[match.id] = { 
              a: match.my_guess.guess_a.toString(), 
              b: match.my_guess.guess_b.toString() 
            };
          }
        });
        setLocalGuesses(initialGuesses);

      } catch (err) {
        alert("Erro ao carregar dados do grupo.");
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [groupId, router]);

  const handleSaveGuess = async (matchId: number) => {
    const guess = localGuesses[matchId];
    if (!guess || guess.a === '' || guess.b === '') {
      alert("Preencha os dois placares!");
      return;
    }

    try {
      await fetchAPI(`/guesses/match?match_id=${matchId}&guess_a=${guess.a}&guess_b=${guess.b}`, { 
        method: 'POST' 
      });
      alert("Palpite salvo com sucesso!");
    } catch (err: any) {
      alert(err.message || "Erro ao salvar palpite. O jogo já começou?");
    }
  };

  const handleGuessChange = (matchId: number, team: 'a' | 'b', value: string) => {
    setLocalGuesses(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId] || { a: '', b: '' },
        [team]: value
      }
    }));
  };

  if (loading) return <div className="p-10 text-center">Carregando arena...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <nav className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold">Grupo: {groupName}</h1>
        <button onClick={() => router.push('/dashboard')} className="text-sm bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded">
          Voltar
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: RANKING */}
        <div className="md:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            🏆 Classificação
          </h2>
          <div className="space-y-3">
            {ranking.map((user, index) => (
              <div key={user.user_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                    {index + 1}º
                  </span>
                  <span className="font-medium text-gray-800">{user.name}</span>
                </div>
                <span className="font-bold text-blue-600">{user.points} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* COLUNA DIREITA: JOGOS E PALPITES */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            ⚽ Jogos e Palpites
          </h2>
          
          {matches.map((match) => {
            // Verifica se o jogo já começou (bloqueia edição)
            const isLocked = new Date() >= new Date(match.match_date);
            const guess = localGuesses[match.id] || { a: '', b: '' };

            return (
              <div key={match.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="text-center text-sm text-gray-500 mb-2">
                  {new Date(match.match_date).toLocaleString('pt-BR')}
                </div>
                
                <div className="flex justify-between items-center gap-4">
                  {/* Time A */}
                  <div className="flex-1 text-right font-bold text-gray-700 truncate">{match.team_a}</div>
                  
                  {/* Placar / Inputs */}
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="0"
                      disabled={isLocked}
                      className="w-12 h-10 text-center font-bold text-lg border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                      value={guess.a}
                      onChange={(e) => handleGuessChange(match.id, 'a', e.target.value)}
                    />
                    <span className="font-bold text-gray-400">X</span>
                    <input 
                      type="number" 
                      min="0"
                      disabled={isLocked}
                      className="w-12 h-10 text-center font-bold text-lg border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                      value={guess.b}
                      onChange={(e) => handleGuessChange(match.id, 'b', e.target.value)}
                    />
                  </div>

                  {/* Time B */}
                  <div className="flex-1 text-left font-bold text-gray-700 truncate">{match.team_b}</div>
                </div>

                {/* Botão Salvar ou Resultado Real */}
                <div className="mt-4 text-center">
                  {!isLocked ? (
                    <button 
                      onClick={() => handleSaveGuess(match.id)}
                      className="bg-green-100 hover:bg-green-200 text-green-700 px-6 py-1 rounded-full text-sm font-medium transition"
                    >
                      Salvar Palpite
                    </button>
                  ) : (
                    <div className="text-sm bg-gray-100 py-1 rounded-full text-gray-600 font-medium inline-block px-4">
                      {match.status === 'finished' 
                        ? `Resultado Real: ${match.score_a} x ${match.score_b}` 
                        : 'Jogo em andamento / Encerrado'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
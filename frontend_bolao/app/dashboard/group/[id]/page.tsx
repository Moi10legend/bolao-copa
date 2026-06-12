'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchAPI } from '../../../lib/api';

// Mapeamento dos nomes que você insere no banco para os códigos da FlagCDN
const countryCodes: Record<string, string> = {
  "Brasil": "br",
  "Espanha": "es",
  "Croácia": "hr",
  "México": "mx",
  "Polônia": "pl",
  "Suíça": "ch",
  "Argentina": "ar",
  "Arábia Saudita": "sa",
  "França": "fr",
  "Alemanha": "de",
  "Portugal": "pt",
  "Holanda": "nl",
  "Itália": "it",
  "Bélgica": "be",
  "Uruguai": "uy",
  "Colômbia": "co",
  "Canadá": "ca",
  "Bósnia e Hezergovina": "ba",
  "Estados Unidos": "us",
  "Paraguai": "py",
  "Catar": "qa",
  "Marrocos": "ma",
  "Coreia do Sul": "kr",
  "Tchéquia": "cz",
  "África do Sul": "za",
  "Haiti": "ht",
  "Inglaterra": "gb-eng",
  "Escócia": "gb-sct",
  "Austrália": "au",
  "Turquia": "tr",
  "Curaçao": "cw",
  "Japão": "jp",
  "Costa do Marfim": "ci",
  "Equador": "ec",
  "Suécia": "se",
  "Tunísia": "tn",
  "Cabo Verde": "cv",
  "Egito": "eg",
  "Irã": "ir",
  "Nova Zelândia": "nz",
  "Iraque": "iq",
  "Senegal": "sn",
  "Argélia": "dz",
  "Noruega": "no",
  "Áustria": "at",
  "Jordânia": "jo",
  "RD Congo": "cd",
  "Uzbequistão": "uz",
  "Panamá": "pa",
  "Gana": "gh"
  // Conforme for adicionando mais países no banco, é só listar o código minúsculo dele aqui!
};

// Função auxiliar para gerar a URL da bandeira
const getFlagUrl = (teamName: string) => {
  const code = countryCodes[teamName];
  return code ? `https://flagcdn.com/w40/${code}.png` : undefined;
};

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
            // Garante que o JS entenda que a data que veio do banco é UTC
            const safeDateStr = match.match_date.endsWith('Z') || match.match_date.includes('+') 
              ? match.match_date 
              : `${match.match_date}Z`;
              
            const matchDateObj = new Date(safeDateStr);

            // Agora o bloqueio funciona perfeitamente sincronizado com a hora real
            const isLocked = new Date() >= matchDateObj;
            const guess = localGuesses[match.id] || { a: '', b: '' };

            return (
              <div key={match.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="text-center text-sm text-gray-500 mb-2">
                  {/* Formata para a hora local do celular do usuário sem os segundos, para ficar mais limpo */}
                  {matchDateObj.toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
                
                <div className="flex justify-between items-center gap-4">
                  {/* Time A (Alinhado à Direita) */}
                  <div className="flex-1 flex items-center justify-end gap-2 font-bold text-gray-700 truncate">
                    <span>{match.team_a}</span>
                    {getFlagUrl(match.team_a) && (
                      <img 
                        src={getFlagUrl(match.team_a)} 
                        alt={match.team_a} 
                        className="w-6 h-4 object-cover rounded shadow-sm border border-gray-100 flex-shrink-0" 
                      />
                    )}
                  </div>
                  
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

                  {/* Time B (Alinhado à Esquerda) */}
                  <div className="flex-1 flex items-center justify-start gap-2 font-bold text-gray-700 truncate">
                    {getFlagUrl(match.team_b) && (
                      <img 
                        src={getFlagUrl(match.team_b)} 
                        alt={match.team_b} 
                        className="w-6 h-4 object-cover rounded shadow-sm border border-gray-100 flex-shrink-0" 
                      />
                    )}
                    <span>{match.team_b}</span>
                  </div>
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
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '../../lib/api';

export default function TournamentGuessesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Estado do formulário
  const [formData, setFormData] = useState({
    champion: '',
    top_scorer: '',
    top_assists: '',
    best_defense: '',
    best_attack: '',
    brazil_stage: ''
  });

  // Busca os palpites existentes quando a página carrega
  useEffect(() => {
    const loadGuesses = async () => {
      try {
        const data = await fetchAPI('/guesses/tournament');
        if (data) {
          setFormData({
            champion: data.champion || '',
            top_scorer: data.top_scorer || '',
            top_assists: data.top_assists || '',
            best_defense: data.best_defense || '',
            best_attack: data.best_attack || '',
            brazil_stage: data.brazil_stage || ''
          });
        }
      } catch (err: any) {
        // Se der 404, significa apenas que o usuário ainda não fez palpites, o que é normal.
        if (!err.message.includes('ainda não fez')) {
          setMessage({ type: 'error', text: 'Erro ao carregar seus palpites anteriores.' });
        }
      } finally {
        setLoading(false);
      }
    };
    loadGuesses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Como a rota POST funciona como Upsert, enviamos o JSON completo
      await fetchAPI('/guesses/tournament', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setMessage({ type: 'success', text: 'Palpites do torneio salvos com sucesso!' });
    } catch (err: any) {
      // Aqui vai estourar o erro 400 se o segundo jogo já tiver começado
      setMessage({ type: 'error', text: err.message || 'Erro ao salvar os palpites.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando formulário...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <nav className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold">Palpites do Torneio</h1>
        <button onClick={() => router.push('/dashboard')} className="text-sm bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition">
          Voltar ao Painel
        </button>
      </nav>

      <main className="max-w-2xl mx-auto px-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Suas Apostas Finais</h2>
            <p className="text-sm text-gray-500 mt-1">
              Preencha quem vai se destacar na Copa. <strong className="text-red-500">Atenção:</strong> Estas opções serão bloqueadas assim que o segundo jogo do torneio começar!
            </p>
          </div>

          {message.text && (
            <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campeão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seleção Campeã</label>
              <input 
                type="text" 
                name="champion" 
                list="selecoes" /* A MÁGICA AQUI: Conecta com o datalist */
                required 
                placeholder="Comece a digitar..." 
                value={formData.champion} 
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Melhor Ataque */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Melhor Ataque</label>
                <input 
                  type="text"
                  name="best_attack" 
                  list="selecoes"
                  required placeholder="Ex: França" 
                  value={formData.best_attack} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              {/* Melhor Defesa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Melhor Defesa</label>
                <input 
                  type="text" 
                  name="best_defense" 
                  list="selecoes"
                  required placeholder="Ex: Argentina" 
                  value={formData.best_defense} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Artilheiro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Artilheiro (Jogador)</label>
                <input 
                  type="text" 
                  name="top_scorer" 
                  list="jogadores"
                  required placeholder="Ex: Mbappé" 
                  value={formData.top_scorer} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              {/* Líder de Assistências */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Líder de Assistências</label>
                <input 
                  type="text" 
                  name="top_assists" 
                  list='jogadores'
                  required placeholder="Ex: De Bruyne" 
                  value={formData.top_assists} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>

            {/* Fase do Brasil */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Até que fase o Brasil chega?</label>
              <select name="brazil_stage" required value={formData.brazil_stage} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="" disabled>Selecione a fase...</option>
                <option value="Fase de Grupos">Cai na Fase de Grupos</option>
                <option value="Oitavas de Final">Oitavas de Final</option>
                <option value="Quartas de Final">Quartas de Final</option>
                <option value="Semifinal">Semifinal (Disputa 3º lugar)</option>
                <option value="Vice-campeão">Chega na Final (Vice)</option>
                <option value="Campeão">É HEXA! (Campeão)</option>
              </select>
            </div>

            <button type="submit" disabled={saving} className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold py-3 px-4 rounded-lg mt-6 transition disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar Palpites Oficiais'}
            </button>
          </form>
          {/* Listas de Autocomplete Nativas */}
          <datalist id="selecoes">
            <option value="Argentina" />
            <option value="Brasil" />
            <option value="França" />
            <option value="Inglaterra" />
            <option value="Espanha" />
            <option value="Alemanha" />
            <option value="Portugal" />
            <option value="Holanda" />
            <option value="Itália" />
            <option value="Bélgica" />
            <option value="Uruguai" />
            <option value="Colômbia" />
            {/* Você pode adicionar as outras seleções depois */}
          </datalist>

          <datalist id="jogadores">
            <option value="Kylian Mbappé (FRA)" />
            <option value="Vinícius Júnior (BRA)" />
            <option value="Jude Bellingham (ING)" />
            <option value="Harry Kane (ING)" />
            <option value="Lionel Messi (ARG)" />
            <option value="Kevin De Bruyne (BEL)" />
            <option value="Désiré Doué (FRA)" />
            <option value="Erling Haaland (NOR)" />
            <option value="Cristiano Ronaldo (POR)" />
            <option value="Bukayo Saka (ING)" />
            <option value="Endrick (BRA)" />
            <option value="Raphinha (BRA)" />
            <option value="Neymar (BRA)" />
            <option value="Bruno Guimarães (BRA)" />
            <option value="Igor Thiago (BRA)" />
            <option value="Bruno Fernandes (POR)" />
            <option value="Nuno Mendes (POR)" />
            <option value="Vitinha (POR)" />
            <option value="Michael Olise (FRA)" />
            <option value="Nico Williams (ESP)" />
            <option value="Lamine Yamal (ESP)" />
            {/* Adicione os favoritos aqui */}
          </datalist>
        </div>
      </main>
    </div>
  );
}
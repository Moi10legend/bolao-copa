'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '../lib/api';

// Tipagem simples para o TypeScript não reclamar
interface Group {
  id: number;
  name: string;
  code: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para os formulários
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  // Busca os grupos assim que a página carrega
  const loadGroups = async () => {
    try {
      const data = await fetchAPI('/groups/me');
      setGroups(data);
    } catch (err: any) {
      if (err.message.includes('401') || err.message.includes('credenciais')) {
        router.push('/login'); // Se o token expirou, manda pro login
      } else {
        setError('Erro ao carregar seus grupos.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchAPI(`/groups/create?name=${encodeURIComponent(newGroupName)}`, { method: 'POST' });
      setNewGroupName('');
      loadGroups(); // Recarrega a lista
    } catch (err: any) {
      alert(err.message || 'Erro ao criar grupo');
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchAPI(`/groups/join/${joinCode.toUpperCase()}`, { method: 'POST' });
      setJoinCode('');
      loadGroups(); // Recarrega a lista
    } catch (err: any) {
      alert(err.message || 'Erro ao entrar no grupo');
    }
  };

  // Função para sair (Logout)
  const handleLogout = () => {
    localStorage.removeItem('bolao_token');
    router.push('/login');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando painel...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      
      <nav className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">Meu Bolão</h1>
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => router.push('/dashboard/tournament')} 
            className="text-sm bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold px-4 py-2 rounded transition"
          >
            🏆 Palpites do Torneio
          </button>
          <button 
            onClick={handleLogout} 
            className="text-sm bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition"
          >
            Sair
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto mt-8 px-4">
        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">{error}</div>}

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* Card: Criar Grupo */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Criar um novo Bolão</h2>
            <form onSubmit={handleCreateGroup} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Nome do grupo (ex: Família)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition">
                Criar
              </button>
            </form>
          </div>

          {/* Card: Entrar com Código */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Entrar com Código</h2>
            <form onSubmit={handleJoinGroup} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Código (ex: X7F2B)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              />
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition">
                Entrar
              </button>
            </form>
          </div>
        </div>

        {/* Lista de Grupos */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Meus Grupos</h2>
          
          {groups.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100 text-gray-500">
              Você ainda não está em nenhum grupo. Crie um ou use um código para entrar!
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {groups.map((group) => (
                <div 
                  key={group.id} 
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer"
                  onClick={() => router.push(`/dashboard/group/${group.id}`)}
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{group.name}</h3>
                  <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                    Código: {group.code}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
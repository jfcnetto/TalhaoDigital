'use client';

import { useState, useEffect } from 'react';
import { dbLocal } from '@/lib/db-local';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendentes, setPendentes] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);

  useEffect(() => {
    // Inicializa o status
    setIsOnline(navigator.onLine);
    atualizarContador();

    const handleOnline = () => {
      setIsOnline(true);
      sincronizarComBackend();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Também tentamos sincronizar quando o app carrega, caso ele tenha voltado com internet
    if (navigator.onLine) {
      sincronizarComBackend();
    }

    // Listener para o banco local avisando que novos dados foram inseridos
    const observer = new MutationObserver(() => atualizarContador());
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-sync-update'] });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      observer.disconnect();
    };
  }, []);

  const atualizarContador = async () => {
    try {
      const qtd = await dbLocal.calculosPendentes.where('sincronizado').equals(0).count();
      setPendentes(qtd);
    } catch (e) {
      console.error("Erro ao ler Dexie", e);
    }
  };

  const sincronizarComBackend = async () => {
    try {
      const dadosPendentes = await dbLocal.calculosPendentes.where('sincronizado').equals(0).toArray();
      if (dadosPendentes.length === 0) return;

      setSincronizando(true);

      const response = await fetch('/api/calculadoras/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens: dadosPendentes })
      });

      if (response.ok) {
        // Marca como sincronizado ou deleta. Aqui optamos por deletar para manter o BD limpo.
        const ids = dadosPendentes.map(item => item.id as number);
        await dbLocal.calculosPendentes.bulkDelete(ids);
        await atualizarContador();
      }
    } catch (error) {
      console.error('Falha ao sincronizar com backend:', error);
    } finally {
      setSincronizando(false);
    }
  };

  return (
    <>
      {/* Banner de Modo Offline */}
      {!isOnline && (
        <div className="bg-red-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
          <WifiOff className="h-4 w-4" />
          <span>🔴 Você está em Modo Offline (Modo Roça).</span>
          <span className="font-medium hidden sm:inline"> Seus cálculos serão salvos localmente e sincronizados assim que a conexão retornar.</span>
          {pendentes > 0 && (
            <span className="ml-2 bg-red-800 px-2 py-0.5 rounded-full">{pendentes} na fila</span>
          )}
        </div>
      )}

      {/* Indicador de Sincronização rodando */}
      {isOnline && (pendentes > 0 || sincronizando) && (
        <div className="bg-amber-500 text-white text-xs font-bold px-4 py-1.5 flex items-center justify-center gap-2 sticky top-0 z-50">
          <RefreshCw className={`h-3 w-3 ${sincronizando ? 'animate-spin' : ''}`} />
          Sincronizando {pendentes} laudo(s) pendente(s) com a nuvem...
        </div>
      )}

      {children}
    </>
  );
}

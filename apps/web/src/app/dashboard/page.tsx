'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { WalletList } from '@/components/WalletList';
import { TradeHistory } from '@/components/TradeHistory';
import { BotStatus } from '@/components/BotStatus';

export default function Dashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalTrades: 0,
    volume24h: 0,
    activeWallets: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    };
    fetchStats();
  }, []);

  if (!session) {
    return <div>Access Denied</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Trading Bot Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Total Trades</h3>
          <p className="text-2xl">{stats.totalTrades}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">24h Volume</h3>
          <p className="text-2xl">{stats.volume24h} SOL</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Active Wallets</h3>
          <p className="text-2xl">{stats.activeWallets}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BotStatus />
        <WalletList />
        <TradeHistory />
      </div>
    </div>
  );
}

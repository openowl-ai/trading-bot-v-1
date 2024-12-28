'use client';

import { useState, useEffect } from 'react';

interface Wallet {
  publicKey: string;
  balance: number;
  label: string;
}

export function WalletList() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const res = await fetch('/api/wallets');
        const data = await res.json();
        setWallets(data);
      } catch (error) {
        console.error('Failed to fetch wallets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWallets();
  }, []);

  const handleGenerateWallet = async () => {
    try {
      const res = await fetch('/api/wallets/generate', {
        method: 'POST',
      });
      const newWallet = await res.json();
      setWallets([...wallets, newWallet]);
    } catch (error) {
      console.error('Failed to generate wallet:', error);
    }
  };

  if (isLoading) {
    return <div>Loading wallets...</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Wallets</h2>
        <button
          onClick={handleGenerateWallet}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Generate New Wallet
        </button>
      </div>

      <div className="space-y-4">
        {wallets.map((wallet) => (
          <div
            key={wallet.publicKey}
            className="border p-3 rounded-lg hover:bg-gray-50"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{wallet.label}</p>
                <p className="text-sm text-gray-500">{wallet.publicKey}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{wallet.balance} SOL</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

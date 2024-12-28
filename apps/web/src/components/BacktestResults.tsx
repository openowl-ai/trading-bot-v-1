'use client';

import { useState } from 'react';
import { Line } from 'react-chartjs-2';

interface BacktestResultsProps {
  results: {
    trades: any[];
    metrics: {
      totalReturn: number;
      sharpeRatio: number;
      maxDrawdown: number;
      winRate: number;
      profitFactor: number;
    };
    equity: number[];
  };
}

export function BacktestResults({ results }: BacktestResultsProps) {
  const [selectedMetric, setSelectedMetric] = useState('equity');

  const chartData = {
    labels: results.equity.map((_, i) => i),
    datasets: [
      {
        label: 'Equity Curve',
        data: results.equity,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Backtest Results</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="text-sm text-gray-500">Total Return</h3>
          <p className="text-xl font-bold">{results.metrics.totalReturn.toFixed(2)}%</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="text-sm text-gray-500">Sharpe Ratio</h3>
          <p className="text-xl font-bold">{results.metrics.sharpeRatio.toFixed(2)}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="text-sm text-gray-500">Max Drawdown</h3>
          <p className="text-xl font-bold">{(results.metrics.maxDrawdown * 100).toFixed(2)}%</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="text-sm text-gray-500">Win Rate</h3>
          <p className="text-xl font-bold">{(results.metrics.winRate * 100).toFixed(2)}%</p>
        </div>
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="text-sm text-gray-500">Profit Factor</h3>
          <p className="text-xl font-bold">{results.metrics.profitFactor.toFixed(2)}</p>
        </div>
      </div>

      <div className="h-80">
        <Line data={chartData} options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: false
            }
          }
        }} />
      </div>

      <div className="mt-6">
        <h3 className="font-bold mb-2">Recent Trades</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Entry</th>
                <th className="px-4 py-2">Exit</th>
                <th className="px-4 py-2">P&L</th>
              </tr>
            </thead>
            <tbody>
              {results.trades.slice(-5).map((trade, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2">{trade.type}</td>
                  <td className="px-4 py-2">${trade.entry.price.toFixed(2)}</td>
                  <td className="px-4 py-2">${trade.exit.price.toFixed(2)}</td>
                  <td className={`px-4 py-2 ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${trade.pnl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

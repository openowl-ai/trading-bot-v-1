'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

export function Monitoring() {
  const [metrics, setMetrics] = useState({
    trades: [],
    alerts: [],
    performance: {}
  });

  useEffect(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'metrics') {
        setMetrics(prev => ({
          ...prev,
          ...data.metrics
        }));
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
        <Line
          data={metrics.trades}
          options={{
            responsive: true,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }}
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Recent Alerts</h3>
        <div className="space-y-2">
          {metrics.alerts.map((alert: any, index: number) => (
            <div
              key={index}
              className={`p-2 rounded ${
                alert.severity === 'critical'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              <p className="font-medium">{alert.type}</p>
              <p className="text-sm">{alert.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

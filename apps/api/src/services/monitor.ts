import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import { telegramBot } from './telegram';
import { CONFIG } from '../config';

interface MetricData {
  timestamp: number;
  value: number;
  type: string;
  tags?: Record<string, string>;
}

interface Alert {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
  metadata?: any;
}

export class EnhancedMonitoringService extends EventEmitter {
  private metrics: MetricData[] = [];
  private alerts: Alert[] = [];
  private wsClients: Set<WebSocket> = new Set();
  private healthChecks: Map<string, boolean> = new Map();
  private performanceMetrics: Map<string, number> = new Map();

  constructor() {
    super();
    this.setupPerformanceMonitoring();
    this.setupMetricAggregation();
  }

  private setupPerformanceMonitoring() {
    setInterval(() => {
      this.calculatePerformanceMetrics();
      this.checkSystemHealth();
      this.broadcastMetrics();
    }, 5000); // Every 5 seconds
  }

  private setupMetricAggregation() {
    setInterval(() => {
      this.aggregateMetrics();
    }, 60000); // Every minute
  }

  addMetric(data: MetricData) {
    this.metrics.push(data);
    this.emit('metric', data);
    this.broadcastMetrics();
  }

  async alert(alert: Alert) {
    this.alerts.push(alert);
    this.emit('alert', alert);

    if (alert.severity === 'critical') {
      await this.notifyTelegram(alert);
    }

    this.broadcastMetrics();
  }

  private async notifyTelegram(alert: Alert) {
    const message = `🚨 ALERT: ${alert.type}\n\n${alert.message}\n\nSeverity: ${alert.severity}`;
    await telegramBot.sendMessage(message);
  }

  private calculatePerformanceMetrics() {
    // Calculate various performance metrics
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 3600000); // Last hour

    this.performanceMetrics.set('tradeCount', recentMetrics.filter(m => m.type === 'trade').length);
    this.performanceMetrics.set('successRate', this.calculateSuccessRate(recentMetrics));
    this.performanceMetrics.set('averageLatency', this.calculateAverageLatency(recentMetrics));
    this.performanceMetrics.set('errorRate', this.calculateErrorRate(recentMetrics));
  }

  private calculateSuccessRate(metrics: MetricData[]): number {
    const trades = metrics.filter(m => m.type === 'trade');
    if (trades.length === 0) return 0;
    
    const successful = trades.filter(t => t.value > 0).length;
    return successful / trades.length;
  }

  private calculateAverageLatency(metrics: MetricData[]): number {
    const latencies = metrics
      .filter(m => m.type === 'latency')
      .map(m => m.value);
    
    if (latencies.length === 0) return 0;
    
    return latencies.reduce((a, b) => a + b, 0) / latencies.length;
  }

  private calculateErrorRate(metrics: MetricData[]): number {
    const total = metrics.length;
    if (total === 0) return 0;
    
    const errors = metrics.filter(m => m.type === 'error').length;
    return errors / total;
  }

  private aggregateMetrics() {
    const now = Date.now();
    const oneHourAgo = now - 3600000;
    
    // Remove old metrics
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    this.alerts = this.alerts.filter(a => a.timestamp > oneHourAgo);
  }

  private async checkSystemHealth() {
    const checks = {
      jupiter: await this.checkJupiterConnection(),
      helius: await this.checkHeliusConnection(),
      telegram: await this.checkTelegramConnection(),
      memory: this.checkMemoryUsage(),
      cpu: this.checkCPUUsage()
    };

    this.healthChecks = new Map(Object.entries(checks));

    if (Object.values(checks).some(check => !check)) {
      await this.alert({
        type: 'SYSTEM_HEALTH',
        severity: 'critical',
        message: 'One or more system checks failed',
        timestamp: Date.now(),
        metadata: checks
      });
    }
  }

  private checkMemoryUsage(): boolean {
    const used = process.memoryUsage();
    return used.heapUsed / used.heapTotal < 0.9; // Alert if heap usage > 90%
  }

  private checkCPUUsage(): boolean {
    // Implement CPU usage check
    return true;
  }

  addWebSocketClient(ws: WebSocket) {
    this.wsClients.add(ws);
    ws.on('close', () => this.wsClients.delete(ws));
  }

  private broadcastMetrics() {
    const data = {
      metrics: this.performanceMetrics,
      alerts: this.alerts.slice(-10), // Last 10 alerts
      health: Object.fromEntries(this.healthChecks)
    };

    for (const client of this.wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    }
  }
}

export const monitoringService = new EnhancedMonitoringService();

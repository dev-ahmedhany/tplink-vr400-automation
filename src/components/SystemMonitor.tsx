import { useState, useEffect } from 'react';
import { getSystemInfo, SystemInfo } from '@/utils/api';

interface SystemMonitorProps {
  refreshInterval?: number; // in milliseconds, default 30 seconds
}

export default function SystemMonitor({ refreshInterval = 30000 }: SystemMonitorProps) {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemInfo = async () => {
    try {
      setError(null);
      const info = await getSystemInfo();
      setSystemInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system information');
      console.error('Error fetching system info:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemInfo();
    
    const interval = setInterval(fetchSystemInfo, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getTemperatureColor = (temp: number | null): string => {
    if (!temp) return '#666';
    if (temp < 50) return '#28a745'; // Green
    if (temp < 65) return '#ffc107'; // Yellow
    if (temp < 75) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
  };

  const getUsageColor = (usage: number | null): string => {
    if (!usage) return '#666';
    if (usage < 50) return '#28a745'; // Green
    if (usage < 75) return '#ffc107'; // Yellow
    if (usage < 90) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: '#333' }}>
          🖥️ Raspberry Pi System Status
        </h3>
        <p style={{ margin: 0, color: '#666' }}>Loading system information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#f8d7da',
        borderRadius: '8px',
        padding: '20px',
        border: '1px solid #f5c6cb'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: '#721c24' }}>
          🖥️ Raspberry Pi System Status
        </h3>
        <p style={{ margin: 0, color: '#721c24' }}>Error: {error}</p>
      </div>
    );
  }

  if (!systemInfo) {
    return null;
  }

  return (
    <div style={{
      padding: '1.5rem'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🖥️ System Status
        </h2>
        <div style={{ 
          fontSize: '0.875rem', 
          color: '#6b7280',
          background: '#f3f4f6',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          fontWeight: '500'
        }}>
          Updated {new Date(systemInfo.timestamp).toLocaleTimeString()}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {/* CPU Temperature */}
        <div style={{ 
          background: '#f9fafb',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🌡️</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500' }}>
            CPU Temperature
          </div>
          <div style={{ 
            fontSize: '1.75rem', 
            fontWeight: '700', 
            color: getTemperatureColor(systemInfo.cpuTemp),
            marginBottom: '0.25rem'
          }}>
            {systemInfo.cpuTemp !== null ? `${systemInfo.cpuTemp.toFixed(1)}°C` : 'N/A'}
          </div>
        </div>

        {/* CPU Usage */}
        <div style={{ 
          background: '#f9fafb',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500' }}>
            CPU Usage
          </div>
          <div style={{ 
            fontSize: '1.75rem', 
            fontWeight: '700', 
            color: getUsageColor(systemInfo.cpuUsage),
            marginBottom: '0.25rem'
          }}>
            {systemInfo.cpuUsage !== null ? `${systemInfo.cpuUsage.toFixed(1)}%` : 'N/A'}
          </div>
        </div>

        {/* Memory Usage */}
        <div style={{ 
          background: '#f9fafb',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🧠</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500' }}>
            Memory Usage
          </div>
          <div style={{ 
            fontSize: '1.75rem', 
            fontWeight: '700', 
            color: getUsageColor(systemInfo.memoryUsage),
            marginBottom: '0.25rem'
          }}>
            {systemInfo.memoryUsage !== null ? `${systemInfo.memoryUsage.toFixed(1)}%` : 'N/A'}
          </div>
          {systemInfo.memoryTotal && systemInfo.memoryUsed && (
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {systemInfo.memoryUsed}MB / {systemInfo.memoryTotal}MB
            </div>
          )}
        </div>

        {/* Disk Usage */}
        <div style={{ 
          background: '#f9fafb',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💽</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500' }}>
            Disk Usage
          </div>
          <div style={{ 
            fontSize: '1.75rem', 
            fontWeight: '700', 
            color: getUsageColor(systemInfo.diskUsage),
            marginBottom: '0.25rem'
          }}>
            {systemInfo.diskUsage !== null ? `${systemInfo.diskUsage.toFixed(1)}%` : 'N/A'}
          </div>
          {systemInfo.diskUsed && systemInfo.diskTotal && (
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {systemInfo.diskUsed} / {systemInfo.diskTotal}
            </div>
          )}
        </div>

        {/* Voltage */}
        {systemInfo.voltage && (
          <div style={{ 
            background: '#f9fafb',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⚡</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500' }}>
              Core Voltage
            </div>
            <div style={{ 
              fontSize: '1.75rem', 
              fontWeight: '700', 
              color: systemInfo.voltage < 1.2 ? '#dc3545' : '#28a745',
              marginBottom: '0.25rem'
            }}>
              {systemInfo.voltage.toFixed(2)}V
            </div>
          </div>
        )}

        {/* Load Average */}
        {systemInfo.loadAverage && (
          <div style={{ 
            background: '#f9fafb',
            borderRadius: '12px',
            padding: '1.25rem',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📊</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500' }}>
              Load Average
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' }}>
              {systemInfo.loadAverage['1min'].toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {systemInfo.loadAverage['5min'].toFixed(2)} | {systemInfo.loadAverage['15min'].toFixed(2)}
            </div>
          </div>
        )}

        {/* Uptime */}
        <div style={{ 
          background: '#f9fafb',
          borderRadius: '12px',
          padding: '1.25rem',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏰</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500' }}>
            Uptime
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
            {formatUptime(systemInfo.uptime)}
          </div>
        </div>
      </div>

      {/* Throttling Warnings */}
      {systemInfo.throttling && (
        <div style={{ marginTop: '1.5rem' }}>
          {(systemInfo.throttling.currentlyThrottled || 
            systemInfo.throttling.underVoltageDetected || 
            systemInfo.throttling.temperatureLimit) && (
            <div style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              color: 'white',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ⚠️ Current Issues
              </div>
              <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                {systemInfo.throttling.underVoltageDetected && '• Under-voltage detected\n'}
                {systemInfo.throttling.currentlyThrottled && '• Currently throttled\n'}
                {systemInfo.throttling.temperatureLimit && '• Temperature limit reached\n'}
                {systemInfo.throttling.armFrequencyCapped && '• ARM frequency capped\n'}
              </div>
            </div>
          )}

          {(systemInfo.throttling.throttlingOccurred || 
            systemInfo.throttling.underVoltageOccurred || 
            systemInfo.throttling.temperatureLimitOccurred) && (
            <div style={{
              background: '#e0f2fe',
              border: '1px solid #b3e5fc',
              borderRadius: '12px',
              padding: '1rem',
              color: '#01579b'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ℹ️ Past Events
              </div>
              <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                {systemInfo.throttling.underVoltageOccurred && '• Under-voltage occurred\n'}
                {systemInfo.throttling.throttlingOccurred && '• Throttling occurred\n'}
                {systemInfo.throttling.temperatureLimitOccurred && '• Temperature limit reached\n'}
                {systemInfo.throttling.armFrequencyCappingOccurred && '• ARM frequency capping occurred\n'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

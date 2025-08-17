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
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      padding: '20px',
      border: '1px solid #dee2e6',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>
          🖥️ Raspberry Pi System Status
        </h3>
        <span style={{ fontSize: '0.8rem', color: '#666' }}>
          Last updated: {new Date(systemInfo.timestamp).toLocaleTimeString()}
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        {/* CPU Temperature */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>CPU Temperature</div>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: getTemperatureColor(systemInfo.cpuTemp) 
          }}>
            {systemInfo.cpuTemp !== null ? `${systemInfo.cpuTemp.toFixed(1)}°C` : 'N/A'}
          </div>
        </div>

        {/* CPU Usage */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>CPU Usage</div>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: getUsageColor(systemInfo.cpuUsage) 
          }}>
            {systemInfo.cpuUsage !== null ? `${systemInfo.cpuUsage.toFixed(1)}%` : 'N/A'}
          </div>
        </div>

        {/* Memory Usage */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>Memory Usage</div>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: getUsageColor(systemInfo.memoryUsage) 
          }}>
            {systemInfo.memoryUsage !== null ? `${systemInfo.memoryUsage.toFixed(1)}%` : 'N/A'}
          </div>
          {systemInfo.memoryTotal && systemInfo.memoryUsed && (
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              {systemInfo.memoryUsed}MB / {systemInfo.memoryTotal}MB
            </div>
          )}
        </div>

        {/* Disk Usage */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>Disk Usage</div>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: getUsageColor(systemInfo.diskUsage) 
          }}>
            {systemInfo.diskUsage !== null ? `${systemInfo.diskUsage.toFixed(1)}%` : 'N/A'}
          </div>
          {systemInfo.diskUsed && systemInfo.diskTotal && (
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              {systemInfo.diskUsed} / {systemInfo.diskTotal}
            </div>
          )}
        </div>

        {/* Voltage */}
        {systemInfo.voltage && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>Core Voltage</div>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: systemInfo.voltage < 1.2 ? '#dc3545' : '#28a745'
            }}>
              {systemInfo.voltage.toFixed(2)}V
            </div>
          </div>
        )}

        {/* Load Average */}
        {systemInfo.loadAverage && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>Load Average</div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#333' }}>
              {systemInfo.loadAverage['1min'].toFixed(2)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>
              {systemInfo.loadAverage['5min'].toFixed(2)} | {systemInfo.loadAverage['15min'].toFixed(2)}
            </div>
          </div>
        )}

        {/* Uptime */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>Uptime</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333' }}>
            {formatUptime(systemInfo.uptime)}
          </div>
        </div>
      </div>

      {/* Throttling Warnings */}
      {systemInfo.throttling && (
        <div style={{ marginTop: '15px' }}>
          {(systemInfo.throttling.currentlyThrottled || 
            systemInfo.throttling.underVoltageDetected || 
            systemInfo.throttling.temperatureLimit) && (
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '5px',
              padding: '10px',
              marginBottom: '10px'
            }}>
              <div style={{ fontWeight: 'bold', color: '#856404', marginBottom: '5px' }}>
                ⚠️ Current Issues:
              </div>
              <div style={{ fontSize: '0.9rem', color: '#856404' }}>
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
              backgroundColor: '#d1ecf1',
              border: '1px solid #bee5eb',
              borderRadius: '5px',
              padding: '10px'
            }}>
              <div style={{ fontWeight: 'bold', color: '#0c5460', marginBottom: '5px' }}>
                ℹ️ Past Events:
              </div>
              <div style={{ fontSize: '0.9rem', color: '#0c5460' }}>
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

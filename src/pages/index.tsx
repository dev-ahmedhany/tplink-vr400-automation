import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "@/styles/Home.module.css";
import EnhancedAreaChart from "@/components/EnhancedAreaChart";
import SystemMonitor from "@/components/SystemMonitor";
import { getUsageData, ProcessedUsageData } from "@/utils/api";

export default function Home() {
  const [data, setData] = useState<ProcessedUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (filters?: { startDate?: string; endDate?: string; hours?: number }) => {
    try {
      setLoading(true);
      setError(null);
      const usageData = await getUsageData(filters);
      setData(usageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching usage data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up polling every 5 minutes to refresh data
    const interval = setInterval(() => fetchData(), 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleFiltersChange = (filters: { startDate?: string; endDate?: string; hours?: number }) => {
    fetchData(filters);
  };

  const formatLastUpdated = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString("en-EG");
    } catch {
      return 'Unknown';
    }
  };

  return (
    <>
      <Head>
        <title>TP-Link Usage Dashboard</title>
        <meta name="description" content="TP-Link VR400 Router Usage Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        position: 'relative'
      }}>
        {/* Loading Overlay */}
        {loading && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(245, 247, 250, 0.9)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e5e7eb',
                borderTop: '4px solid #667eea',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 1rem'
              }}></div>
              <p style={{ margin: 0, color: '#374151', fontSize: '1rem' }}>Updating data...</p>
            </div>
          </div>
        )}

        {/* Error Overlay */}
        {error && (
          <div style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #fecaca',
            maxWidth: '400px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>Connection Error</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>{error}</div>
            </div>
            <button 
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '1.25rem',
                padding: '0.25rem'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Header */}
        <header style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '2rem 0',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                fontWeight: '600',
                letterSpacing: '-0.02em'
              }}>
                🌐 Network Dashboard
              </h1>
              <p style={{
                margin: '0.5rem 0 0 0',
                fontSize: '1rem',
                opacity: 0.9,
                fontWeight: '300'
              }}>
                Real-time monitoring & analytics
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                {data?.devices?.length || 0} devices
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '2rem 1rem'
        }}>
          {/* System Monitor Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem',
            overflow: 'hidden'
          }}>
            <SystemMonitor refreshInterval={30000} />
          </div>

          {/* Usage Analytics Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
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
                📊 Usage Analytics
              </h2>
            </div>
            
            <EnhancedAreaChart 
              csvData={data?.csvData} 
              onFiltersChange={handleFiltersChange}
            />
          </div>

          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Total Usage Card */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  fontSize: '1.5rem'
                }}>💾</div>
                <h3 style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  opacity: 0.9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Total Usage
                </h3>
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '0.25rem'
              }}>
                {Math.round((data?.total || 0) / 1024 / 1024 / 1024)}GB
              </div>
              <div style={{
                fontSize: '0.875rem',
                opacity: 0.8
              }}>
                Across all devices
              </div>
            </div>

            {/* Last Updated Card */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  fontSize: '1.5rem'
                }}>🔄</div>
                <h3 style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Last Updated
                </h3>
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '0.25rem'
              }}>
                {formatLastUpdated(data?.lastUpdated || (new Date()).toString())}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                Auto-refresh every 5 min
              </div>
            </div>

            {/* Active Devices Card */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  fontSize: '1.5rem'
                }}>📱</div>
                <h3 style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Active Devices
                </h3>
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '0.25rem'
              }}>
                {data?.devices?.length || 0}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                Currently tracked
              </div>
            </div>
          </div>

          {/* Device List (if you want to show top devices) */}
          {data?.devices && data.devices.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
              padding: '1.5rem'
            }}>
              <h2 style={{
                margin: '0 0 1.5rem 0',
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📋 Top Devices
              </h2>
              <div style={{
                display: 'grid',
                gap: '0.75rem'
              }}>
                {data.devices.slice(0, 5).map((device, index) => (
                  <div key={device.mac} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        background: index < 3 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                        color: index < 3 ? 'white' : '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}>
                        {index + 1}
                      </div>
                      <div>
                        <div style={{
                          fontWeight: '500',
                          color: '#1f2937',
                          marginBottom: '0.25rem'
                        }}>
                          {device.name}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          fontFamily: 'monospace'
                        }}>
                          {device.mac}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'right'
                    }}>
                      <div style={{
                        fontWeight: '600',
                        color: '#1f2937',
                        fontSize: '1rem'
                      }}>
                        {device.usageMB >= 1024 ? 
                          `${(device.usageMB / 1024).toFixed(1)} GB` : 
                          `${device.usageMB} MB`
                        }
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}>
                        Total usage
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top People Section */}
          {data?.devices && data.devices.length > 0 && (() => {
            // Group devices by first 4 letters of device name
            const peopleMap = new Map();
            
            data.devices.forEach(device => {
              const personKey = device.name.substring(0, 4).toLowerCase();
              if (!peopleMap.has(personKey)) {
                peopleMap.set(personKey, {
                  name: device.name.substring(0, 4),
                  devices: [],
                  totalUsageMB: 0
                });
              }
              const person = peopleMap.get(personKey);
              person.devices.push(device);
              person.totalUsageMB += device.usageMB;
            });

            // Convert to array and sort by total usage
            const people = Array.from(peopleMap.values())
              .sort((a, b) => b.totalUsageMB - a.totalUsageMB)
              .slice(0, 5);

            return people.length > 1 ? (
              <div style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
                padding: '1.5rem',
                marginTop: '2rem'
              }}>
                <h2 style={{
                  margin: '0 0 1.5rem 0',
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#1f2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  👥 Top People
                </h2>
                <div style={{
                  display: 'grid',
                  gap: '0.75rem'
                }}>
                  {people.map((person, index) => (
                    <div key={person.name} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      background: '#f9fafb',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <div style={{
                          width: '2rem',
                          height: '2rem',
                          borderRadius: '50%',
                          background: index < 3 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : '#e5e7eb',
                          color: index < 3 ? 'white' : '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600',
                          fontSize: '0.875rem'
                        }}>
                          {index + 1}
                        </div>
                        <div>
                          <div style={{
                            fontWeight: '500',
                            color: '#1f2937',
                            marginBottom: '0.25rem'
                          }}>
                            {person.name.toUpperCase()}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}>
                            {person.devices.length} device{person.devices.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{
                        textAlign: 'right'
                      }}>
                        <div style={{
                          fontWeight: '600',
                          color: '#1f2937',
                          fontSize: '1rem'
                        }}>
                          {person.totalUsageMB >= 1024 ? 
                            `${(person.totalUsageMB / 1024).toFixed(1)} GB` : 
                            `${person.totalUsageMB} MB`
                          }
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}>
                          Combined usage
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}
        </main>

        {/* Footer */}
        <footer style={{
          background: '#1f2937',
          color: '#9ca3af',
          padding: '2rem 0',
          marginTop: '3rem'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 1rem',
            textAlign: 'center'
          }}>
            <p style={{
              margin: 0,
              fontSize: '0.875rem'
            }}>
              TP-Link VR400 Router Dashboard • Real-time network monitoring
            </p>
          </div>
        </footer>

        {/* Global Styles */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
}

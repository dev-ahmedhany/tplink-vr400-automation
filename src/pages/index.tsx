import Head from "next/head";
import { useState, useEffect } from "react";
import styles from "@/styles/Home.module.css";
import EnhancedAreaChart from "@/components/EnhancedAreaChart";
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

  if (loading) {
    return (
      <>
        <Head>
          <title>TP-Link Usage Dashboard</title>
          <meta name="description" content="TP-Link VR400 Router Usage Dashboard" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className={styles.main}>
          <div className={styles.center}>
            <p>Loading usage data...</p>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>TP-Link Usage Dashboard</title>
          <meta name="description" content="TP-Link VR400 Router Usage Dashboard" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className={styles.main}>
          <div className={styles.center}>
            <p>Error loading data: {error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Head>
          <title>TP-Link Usage Dashboard</title>
          <meta name="description" content="TP-Link VR400 Router Usage Dashboard" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className={styles.main}>
          <div className={styles.center}>
            <p>No data available</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>TP-Link Usage Dashboard</title>
        <meta name="description" content="TP-Link VR400 Router Usage Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>TP-Link Usage Dashboard</h1>
        </div>
        
        <EnhancedAreaChart 
          csvData={data.csvData} 
          onFiltersChange={handleFiltersChange}
        />
        
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ margin: '5px 0', fontSize: '18px', fontWeight: 'bold' }}>
            Total usage: {Math.round(data.total / 1024 / 1024 / 1024)}GB
          </p>
          <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
            Last updated: {formatLastUpdated(data.lastUpdated)}
          </p>
          {data.devices && data.devices.length > 0 && (
            <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
              Tracking {data.devices.length} devices
            </p>
          )}
        </div>
      </main>
    </>
  );
}

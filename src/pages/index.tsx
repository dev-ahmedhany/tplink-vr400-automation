import Head from "next/head";
import { Inter } from "next/font/google";
import { useState, useEffect } from "react";
import styles from "@/styles/Home.module.css";
import AreaChart from "@/components/StackedArea";
import { getUsageData, ProcessedUsageData } from "@/utils/api";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [data, setData] = useState<ProcessedUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const usageData = await getUsageData();
        setData(usageData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        console.error('Error fetching usage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up polling every 5 minutes to refresh data
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

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
        <main className={`${styles.main} ${inter.className}`}>
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
        <main className={`${styles.main} ${inter.className}`}>
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
        <main className={`${styles.main} ${inter.className}`}>
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
      <main className={`${styles.main} ${inter.className}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>TP-Link Usage Dashboard</h1>
        </div>
        <div className={styles.center}></div>
        <AreaChart csvData={data.csvData} />
        Total usage: {Math.round(data.total / 1024 / 1024 / 1024)}GB
        <br />
        Last updated: {formatLastUpdated(data.lastUpdated)}
      </main>
    </>
  );
}

import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "@/styles/Home.module.css";
import { getDevices, getUsageData, deleteDevice, DevicesData, ProcessedUsageData } from "@/utils/api";

interface DeviceWithUsage {
  mac: string;
  name: string;
  usageMB: number;
  usage: number;
}

export default function DeleteDevices() {
  const [devices, setDevices] = useState<DeviceWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both devices and usage data
      const [devicesData, usageData] = await Promise.all([
        getDevices(),
        getUsageData()
      ]);
      
      // Combine device names with usage information
      const devicesWithUsage: DeviceWithUsage[] = usageData.devices.map(device => ({
        mac: device.mac,
        name: devicesData[device.mac] || device.name || "Unknown Device",
        usageMB: device.usageMB,
        usage: device.usage
      }));
      
      // Sort by usage (highest first)
      devicesWithUsage.sort((a, b) => b.usageMB - a.usageMB);
      
      setDevices(devicesWithUsage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (mac: string, deviceName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${deviceName}" (${mac})?\n\nThis will permanently remove:\n• All usage history for this device\n• The device name mapping\n\nThis action cannot be undone.`
    );
    
    if (!confirmDelete) return;
    
    try {
      setDeleting(mac);
      setError(null);
      setSuccessMessage(null);
      
      const result = await deleteDevice(mac);
      
      if (result.success) {
        setSuccessMessage(
          `Successfully deleted "${result.deletedDevice.name}" (${result.deletedDevice.mac}). ` +
          `Removed from ${result.entriesAffected} usage entries.`
        );
        
        // Remove the device from the local state
        setDevices(prev => prev.filter(device => device.mac !== mac));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete device');
      console.error('Error deleting device:', err);
    } finally {
      setDeleting(null);
    }
  };

  const formatUsage = (usageMB: number) => {
    if (usageMB >= 1024) {
      return `${(usageMB / 1024).toFixed(2)} GB`;
    }
    return `${usageMB} MB`;
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Delete Devices - TP-Link Usage Dashboard</title>
          <meta name="description" content="Delete devices from TP-Link VR400 Router Usage Dashboard" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <main className={styles.main}>
          <div className={styles.center}>
            <p>Loading devices...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Delete Devices - TP-Link Usage Dashboard</title>
        <meta name="description" content="Delete devices from TP-Link VR400 Router Usage Dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>Delete Devices</h1>
            <Link 
              href="/" 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#0070f3', 
                color: 'white', 
                textDecoration: 'none', 
                borderRadius: '5px',
                fontSize: '14px'
              }}
            >
              ← Back to Dashboard
            </Link>
          </div>
          
          {error && (
            <div style={{ 
              backgroundColor: '#fee', 
              color: '#c33', 
              padding: '15px', 
              borderRadius: '5px', 
              marginBottom: '20px',
              border: '1px solid #fcc'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {successMessage && (
            <div style={{ 
              backgroundColor: '#efe', 
              color: '#363', 
              padding: '15px', 
              borderRadius: '5px', 
              marginBottom: '20px',
              border: '1px solid #cfc'
            }}>
              <strong>Success:</strong> {successMessage}
            </div>
          )}
          
          {devices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>No devices found to delete.</p>
              <button 
                onClick={fetchData}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                Refresh
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '20px', color: '#666' }}>
                <p>⚠️ <strong>Warning:</strong> Deleting a device will permanently remove all its usage history and cannot be undone.</p>
                <p>Found <strong>{devices.length}</strong> devices with usage data.</p>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gap: '15px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
              }}>
                {devices.map((device) => (
                  <div 
                    key={device.mac}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '20px',
                      backgroundColor: '#f9f9f9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#333' }}>
                        {device.name}
                      </h3>
                      <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#666', fontFamily: 'monospace' }}>
                        {device.mac}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                        Total Usage: <strong>{formatUsage(device.usageMB)}</strong>
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(device.mac, device.name)}
                      disabled={deleting === device.mac}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: deleting === device.mac ? '#ccc' : '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: deleting === device.mac ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        marginLeft: '15px'
                      }}
                    >
                      {deleting === device.mac ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button 
                  onClick={fetchData}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Refresh List
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}

import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "@/styles/Home.module.css";
import { getDevices, getUsageData, deleteDevice, changeMacAddress, DevicesData, ProcessedUsageData } from "@/utils/api";

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
  const [changingMac, setChangingMac] = useState<string | null>(null);
  const [showChangeMacModal, setShowChangeMacModal] = useState<string | null>(null);
  const [newMacAddress, setNewMacAddress] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');

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

  const handleChangeMac = async (oldMac: string, deviceName: string) => {
    if (!newMacAddress.trim()) {
      setError('Please enter a new MAC address');
      return;
    }
    
    // Basic MAC address validation
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(newMacAddress)) {
      setError('Please enter a valid MAC address (e.g., AA:BB:CC:DD:EE:FF)');
      return;
    }
    
    const confirmChange = window.confirm(
      `Are you sure you want to change MAC address for "${deviceName}"?\n\nOld MAC: ${oldMac}\nNew MAC: ${newMacAddress}\n\nThis will:\n• Combine all usage history from old MAC to new MAC\n• Update the device name mapping\n• This action cannot be undone.`
    );
    
    if (!confirmChange) return;
    
    try {
      setChangingMac(oldMac);
      setError(null);
      setSuccessMessage(null);
      
      const result = await changeMacAddress(oldMac, newMacAddress, newDeviceName || deviceName);
      
      if (result.success) {
        setSuccessMessage(
          `Successfully changed MAC address for "${result.deviceName}" from ${result.oldMac} to ${result.newMac}. ` +
          `Updated ${result.entriesAffected} usage entries.`
        );
        
        // Close modal and refresh data
        setShowChangeMacModal(null);
        setNewMacAddress('');
        setNewDeviceName('');
        await fetchData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change MAC address');
      console.error('Error changing MAC address:', err);
    } finally {
      setChangingMac(null);
    }
  };

  const openChangeMacModal = (mac: string, deviceName: string) => {
    setShowChangeMacModal(mac);
    setNewMacAddress('');
    setNewDeviceName(deviceName);
    setError(null);
    setSuccessMessage(null);
  };

  const closeChangeMacModal = () => {
    setShowChangeMacModal(null);
    setNewMacAddress('');
    setNewDeviceName('');
    setError(null);
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
          <title>Manage Devices - TP-Link Usage Dashboard</title>
          <meta name="description" content="Manage devices in TP-Link VR400 Router Usage Dashboard - delete devices or change MAC addresses" />
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
        <title>Manage Devices - TP-Link Usage Dashboard</title>
        <meta name="description" content="Manage devices in TP-Link VR400 Router Usage Dashboard - delete devices or change MAC addresses" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>Manage Devices</h1>
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
              <p>No devices found to manage.</p>
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
                <p>⚠️ <strong>Device Management:</strong></p>
                <ul style={{ marginLeft: '20px', marginTop: '5px' }}>
                  <li><strong>Change MAC:</strong> Combines usage history from old MAC to new MAC address</li>
                  <li><strong>Delete:</strong> Permanently removes all usage history (cannot be undone)</li>
                </ul>
                <p style={{ marginTop: '10px' }}>Found <strong>{devices.length}</strong> devices with usage data.</p>
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
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '15px' }}>
                      <button
                        onClick={() => openChangeMacModal(device.mac, device.name)}
                        disabled={changingMac === device.mac || deleting === device.mac}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: changingMac === device.mac ? '#ccc' : '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: changingMac === device.mac || deleting === device.mac ? 'not-allowed' : 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {changingMac === device.mac ? 'Changing...' : 'Change MAC'}
                      </button>
                      
                      <button
                        onClick={() => handleDelete(device.mac, device.name)}
                        disabled={deleting === device.mac || changingMac === device.mac}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: deleting === device.mac ? '#ccc' : '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: deleting === device.mac || changingMac === device.mac ? 'not-allowed' : 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        {deleting === device.mac ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
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
        
        {/* Change MAC Address Modal */}
        {showChangeMacModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80%',
              overflow: 'auto'
            }}>
              <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', color: '#333' }}>
                Change MAC Address
              </h2>
              
              {(() => {
                const device = devices.find(d => d.mac === showChangeMacModal);
                return device ? (
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '1rem', fontWeight: 'bold' }}>
                      {device.name}
                    </p>
                    <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#666', fontFamily: 'monospace' }}>
                      Current MAC: {device.mac}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                      Total Usage: {formatUsage(device.usageMB)}
                    </p>
                  </div>
                ) : null;
              })()}
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  New MAC Address *
                </label>
                <input
                  type="text"
                  value={newMacAddress}
                  onChange={(e) => setNewMacAddress(e.target.value.toUpperCase())}
                  placeholder="AA:BB:CC:DD:EE:FF"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Enter the new MAC address in the format AA:BB:CC:DD:EE:FF
                </small>
              </div>
              
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                  Device Name (optional)
                </label>
                <input
                  type="text"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  placeholder="Enter device name"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Leave empty to keep current device name
                </small>
              </div>
              
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px', border: '1px solid #ffeaa7' }}>
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#856404' }}>
                  ⚠️ Important Notes:
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404', fontSize: '14px' }}>
                  <li>All usage history from the old MAC will be combined with the new MAC</li>
                  <li>If the new MAC already has usage data, it will be added together</li>
                  <li>This action cannot be undone</li>
                  <li>The old MAC address will be removed from the system</li>
                </ul>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={closeChangeMacModal}
                  disabled={changingMac === showChangeMacModal}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: changingMac === showChangeMacModal ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const device = devices.find(d => d.mac === showChangeMacModal);
                    if (device) {
                      handleChangeMac(device.mac, device.name);
                    }
                  }}
                  disabled={changingMac === showChangeMacModal || !newMacAddress.trim()}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: changingMac === showChangeMacModal || !newMacAddress.trim() ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: changingMac === showChangeMacModal || !newMacAddress.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {changingMac === showChangeMacModal ? 'Changing...' : 'Change MAC Address'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

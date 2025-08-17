// API utility to fetch data from local server instead of Firebase

// Use environment variable or default to current host with port 3001
const getApiBaseUrl = () => {
  // return 'http://192.168.1.200:3001/api';
  if (typeof window !== 'undefined') {
    // Client-side: use current host with port 3001
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:3001/api`;
  } else {
    // Server-side: use localhost (for build-time if needed)
    return 'http://localhost:3001/api';
  }
};

export interface UsageData {
  [key: string]: {
    usage: string;
    name: string;
  };
}

export interface ProcessedUsageData {
  csvData: string;
  total: number;
  lastUpdated: string;
  devices: Array<{
    mac: string;
    name: string;
    usage: number;
    usageMB: number;
  }>;
}

export interface DevicesData {
  [mac: string]: string;
}

export interface DeleteDeviceResponse {
  success: boolean;
  message: string;
  deletedDevice: {
    mac: string;
    name: string;
  };
  entriesAffected: number;
  remainingDevices: number;
}

export interface ChangeMacResponse {
  success: boolean;
  message: string;
  oldMac: string;
  newMac: string;
  deviceName: string;
  entriesAffected: number;
}

export interface ServerStatus {
  status: string;
  version: string;
  uptime: number;
  lastScrape: string | null;
  totalEntries: number;
  nextScheduledScrape: string;
}

// Fetch processed usage data for the frontend
export async function getUsageData(filters?: {
  startDate?: string;
  endDate?: string;
  hours?: number;
}): Promise<ProcessedUsageData> {
  try {
    const API_BASE_URL = getApiBaseUrl();
    const queryParams = new URLSearchParams();
    
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.hours) queryParams.append('hours', filters.hours.toString());
    
    const url = `${API_BASE_URL}/usage${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching usage data:', error);
    throw error;
  }
}

// Fetch raw usage data
export async function getRawUsageData(): Promise<any[]> {
  try {
    const API_BASE_URL = getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/usage/raw`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching raw usage data:', error);
    throw error;
  }
}

// Trigger manual scraping
export async function triggerScraping(): Promise<any> {
  try {
    const API_BASE_URL = getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error triggering scraping:', error);
    throw error;
  }
}

// Get server status
export async function getServerStatus(): Promise<ServerStatus> {
  try {
    const API_BASE_URL = getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/status`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching server status:', error);
    throw error;
  }
}

// Health check
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  try {
    const API_BASE_URL = getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error performing health check:', error);
    throw error;
  }
}

// Get devices data
export async function getDevices(): Promise<DevicesData> {
  try {
    const API_BASE_URL = getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/devices`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching devices data:', error);
    throw error;
  }
}

// Delete device by MAC address
export async function deleteDevice(mac: string): Promise<DeleteDeviceResponse> {
  try {
    const API_BASE_URL = getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/devices/${encodeURIComponent(mac)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error deleting device:', error);
    throw error;
  }
}

// Change MAC address for a device (combines usage from old MAC to new MAC)
export async function changeMacAddress(oldMac: string, newMac: string, deviceName?: string): Promise<ChangeMacResponse> {
  try {
    const API_BASE_URL = getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/devices/${encodeURIComponent(oldMac)}/change-mac`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ newMac, deviceName }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error changing MAC address:', error);
    throw error;
  }
}

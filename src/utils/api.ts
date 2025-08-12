// API utility to fetch data from local server instead of Firebase

// Use environment variable or default to current host with port 3001
const getApiBaseUrl = () => {
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
    usageGB: number;
  }>;
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
export async function getUsageData(): Promise<ProcessedUsageData> {
  try {
    const API_BASE_URL = getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/usage`);
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

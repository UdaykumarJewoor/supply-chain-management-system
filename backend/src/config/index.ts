import dotenv from 'dotenv';

// Load initial env file variables
dotenv.config();

class ConfigManager {
  public url: string = process.env.ERPNEXT_URL || 'http://localhost:8000';
  public apiKey: string = process.env.ERPNEXT_API_KEY || '';
  public apiSecret: string = process.env.ERPNEXT_API_SECRET || '';
  public connected: boolean = false;

  constructor() {
    this.url = this.url.replace(/\/$/, ''); // sanitize trailing slash
  }

  // Update variables dynamically
  public update(url?: string, key?: string, secret?: string) {
    if (url) this.url = url.replace(/\/$/, '');
    if (key !== undefined) this.apiKey = key;
    if (secret !== undefined) this.apiSecret = secret;
    this.connected = false;
  }

  // Get request headers for ERPNext resource fetches
  public getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `token ${this.apiKey}:${this.apiSecret}`,
    };
  }
}

export const config = new ConfigManager();
export default config;

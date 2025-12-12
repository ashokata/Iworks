import { database, jobsCollection, customersCollection } from '../../db';
import { apiClient } from '../api/client';
import { SYNC_CONFIG, APP_CONFIG } from '../../constants/config';
import NetInfo from '@react-native-community/netinfo';

/**
 * Sync Status Types
 */
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

export interface SyncState {
  status: SyncStatus;
  lastSyncTime: Date | null;
  pendingChanges: number;
  error: string | null;
}

/**
 * Sync Manager
 * Handles bidirectional sync between local WatermelonDB and PostgreSQL backend
 */
class SyncManager {
  private syncInProgress = false;
  private lastSyncTime: Date | null = null;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(state: SyncState) => void> = new Set();
  private pendingChanges = 0;
  private lastError: string | null = null;

  /**
   * Subscribe to sync state changes
   */
  subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current sync state
   */
  getState(): SyncState {
    return {
      status: this.syncInProgress ? 'syncing' : (this.lastError ? 'error' : 'idle'),
      lastSyncTime: this.lastSyncTime,
      pendingChanges: this.pendingChanges,
      error: this.lastError,
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  /**
   * Start automatic background sync
   */
  startAutoSync() {
    if (this.syncInterval) {
      return; // Already running
    }

    console.log('[Sync Manager] Starting auto sync');
    
    // Initial sync
    this.sync();

    // Set up interval
    this.syncInterval = setInterval(() => {
      this.sync();
    }, SYNC_CONFIG.SYNC_INTERVAL);

    // Listen for network changes
    NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        console.log('[Sync Manager] Network connected, triggering sync');
        this.sync();
      }
    });
  }

  /**
   * Stop automatic background sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[Sync Manager] Auto sync stopped');
    }
  }

  /**
   * Perform a full sync
   */
  async sync(): Promise<void> {
    // Check if already syncing
    if (this.syncInProgress) {
      console.log('[Sync Manager] Sync already in progress, skipping');
      return;
    }

    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      console.log('[Sync Manager] No network connection, skipping sync');
      return;
    }

    this.syncInProgress = true;
    this.lastError = null;
    this.notifyListeners();

    try {
      console.log('[Sync Manager] Starting sync...');

      // Step 1: Push local changes to server
      await this.pushChanges();

      // Step 2: Pull changes from server
      await this.pullChanges();

      // Update last sync time
      this.lastSyncTime = new Date();
      this.pendingChanges = 0;
      this.lastError = null;
      
      console.log('[Sync Manager] Sync completed successfully');
    } catch (error: any) {
      console.error('[Sync Manager] Sync failed:', error);
      this.lastError = error.message || 'Sync failed';
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  /**
   * Push local changes to server
   */
  private async pushChanges(): Promise<void> {
    console.log('[Sync Manager] Pushing local changes...');

    // Get all pending changes from offline queue
    // In a real implementation, we'd query the offline_queue table
    // and process each pending operation

    // For now, we'll use WatermelonDB's built-in sync
    // which tracks _status and _changed fields

    // Process pending photo uploads
    await this.uploadPendingPhotos();

    // Process pending signature uploads
    await this.uploadPendingSignatures();

    // Process pending time entries
    await this.syncTimeEntries();
  }

  /**
   * Pull changes from server
   */
  private async pullChanges(): Promise<void> {
    console.log('[Sync Manager] Pulling changes from server...');

    const tenantId = APP_CONFIG.DEFAULT_TENANT_ID;
    
    // Calculate date range for jobs to sync
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - SYNC_CONFIG.OFFLINE_DAYS_BEHIND);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + SYNC_CONFIG.OFFLINE_DAYS_AHEAD);

    try {
      // Fetch jobs for the date range
      const jobs = await apiClient.get<any[]>('/jobs', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      // Fetch assigned customers
      const customers = await apiClient.get<any[]>('/customers');

      // Fetch price book (services and materials)
      const services = await apiClient.get<any[]>('/services');
      const materials = await apiClient.get<any[]>('/materials');

      // Update local database
      await this.updateLocalDatabase({
        jobs,
        customers,
        services,
        materials,
      });

      console.log('[Sync Manager] Pulled data:', {
        jobs: jobs?.length || 0,
        customers: customers?.length || 0,
        services: services?.length || 0,
        materials: materials?.length || 0,
      });
    } catch (error) {
      console.error('[Sync Manager] Failed to pull changes:', error);
      throw error;
    }
  }

  /**
   * Update local database with server data
   */
  private async updateLocalDatabase(data: {
    jobs?: any[];
    customers?: any[];
    services?: any[];
    materials?: any[];
  }): Promise<void> {
    await database.write(async () => {
      // Update jobs
      if (data.jobs) {
        for (const job of data.jobs) {
          await this.upsertJob(job);
        }
      }

      // Update customers
      if (data.customers) {
        for (const customer of data.customers) {
          await this.upsertCustomer(customer);
        }
      }

      // Services and materials would be similar
    });
  }

  /**
   * Upsert a job record
   */
  private async upsertJob(serverJob: any): Promise<void> {
    try {
      // Check if job exists locally
      const existingJobs = await jobsCollection
        .query()
        // @ts-ignore - WatermelonDB typing issue
        .where('server_id', serverJob.id)
        .fetch();

      if (existingJobs.length > 0) {
        // Update existing
        await existingJobs[0].update((record: any) => {
          record.title = serverJob.title;
          record.status = serverJob.status;
          record.priority = serverJob.priority;
          record.description = serverJob.description;
          record.scheduledStart = serverJob.scheduledStart ? new Date(serverJob.scheduledStart).getTime() : null;
          record.scheduledEnd = serverJob.scheduledEnd ? new Date(serverJob.scheduledEnd).getTime() : null;
          record.customerName = serverJob.customer?.displayName;
          record.customerPhone = serverJob.customer?.phone;
          record.addressStreet = serverJob.address?.street1;
          record.addressCity = serverJob.address?.city;
          record.addressState = serverJob.address?.state;
          record.addressZip = serverJob.address?.zipCode;
        });
      } else {
        // Create new
        await jobsCollection.create((record: any) => {
          record.serverId = serverJob.id;
          record.tenantId = serverJob.tenantId;
          record.customerId = serverJob.customerId;
          record.title = serverJob.title;
          record.status = serverJob.status;
          record.priority = serverJob.priority || 'NORMAL';
          record.source = serverJob.source || 'MANUAL';
          record.description = serverJob.description;
          record.scheduledStart = serverJob.scheduledStart ? new Date(serverJob.scheduledStart).getTime() : null;
          record.scheduledEnd = serverJob.scheduledEnd ? new Date(serverJob.scheduledEnd).getTime() : null;
          record.customerName = serverJob.customer?.displayName;
          record.customerPhone = serverJob.customer?.phone;
          record.addressStreet = serverJob.address?.street1;
          record.addressCity = serverJob.address?.city;
          record.addressState = serverJob.address?.state;
          record.addressZip = serverJob.address?.zipCode;
        });
      }
    } catch (error) {
      console.error('[Sync Manager] Failed to upsert job:', error);
    }
  }

  /**
   * Upsert a customer record
   */
  private async upsertCustomer(serverCustomer: any): Promise<void> {
    try {
      const existingCustomers = await customersCollection
        .query()
        // @ts-ignore
        .where('server_id', serverCustomer.id)
        .fetch();

      if (existingCustomers.length > 0) {
        await existingCustomers[0].update((record: any) => {
          record.displayName = serverCustomer.displayName;
          record.firstName = serverCustomer.firstName;
          record.lastName = serverCustomer.lastName;
          record.companyName = serverCustomer.companyName;
          record.type = serverCustomer.type;
          record.email = serverCustomer.email;
          record.phone = serverCustomer.phone;
          record.altPhone = serverCustomer.altPhone;
          record.notes = serverCustomer.notes;
          record.isActive = serverCustomer.isActive ?? true;
        });
      } else {
        await customersCollection.create((record: any) => {
          record.serverId = serverCustomer.id;
          record.tenantId = serverCustomer.tenantId;
          record.displayName = serverCustomer.displayName;
          record.firstName = serverCustomer.firstName;
          record.lastName = serverCustomer.lastName;
          record.companyName = serverCustomer.companyName;
          record.type = serverCustomer.type || 'RESIDENTIAL';
          record.email = serverCustomer.email;
          record.phone = serverCustomer.phone;
          record.altPhone = serverCustomer.altPhone;
          record.notes = serverCustomer.notes;
          record.isActive = serverCustomer.isActive ?? true;
        });
      }
    } catch (error) {
      console.error('[Sync Manager] Failed to upsert customer:', error);
    }
  }

  /**
   * Upload pending photos
   */
  private async uploadPendingPhotos(): Promise<void> {
    // Implementation would query job_photos where uploaded = false
    // and upload each to S3, then update the record
    console.log('[Sync Manager] Uploading pending photos...');
  }

  /**
   * Upload pending signatures
   */
  private async uploadPendingSignatures(): Promise<void> {
    // Implementation would query job_signatures where uploaded = false
    // and upload each to the server
    console.log('[Sync Manager] Uploading pending signatures...');
  }

  /**
   * Sync time entries
   */
  private async syncTimeEntries(): Promise<void> {
    // Implementation would query time_entries where synced = false
    // and push to server
    console.log('[Sync Manager] Syncing time entries...');
  }

  /**
   * Add an item to the offline queue
   */
  async queueOperation(
    entityType: string,
    entityId: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    payload: any
  ): Promise<void> {
    this.pendingChanges++;
    this.notifyListeners();

    // In a full implementation, this would add to the offline_queue table
    console.log('[Sync Manager] Queued operation:', { entityType, entityId, operation });

    // Try to sync immediately if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      this.sync();
    }
  }

  /**
   * Clear all local data and reset database
   */
  async resetLocalData(): Promise<void> {
    console.log('[Sync Manager] Resetting local database...');
    await database.write(async () => {
      await database.unsafeResetDatabase();
    });
    this.lastSyncTime = null;
    this.pendingChanges = 0;
    this.notifyListeners();
  }
}

// Export singleton instance
export const syncManager = new SyncManager();


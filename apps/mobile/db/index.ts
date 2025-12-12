import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { modelClasses } from './models';

/**
 * WatermelonDB Database Setup
 * 
 * This creates a local SQLite database for offline data storage.
 * The database syncs with the PostgreSQL backend when online.
 */

// Create the SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  // Database file name
  dbName: 'fieldsmartpro',
  // Enable JSI for better performance (React Native only)
  jsi: true,
  // Optional: migrations for schema updates
  // migrations,
  // Enable WAL mode for better concurrency
  onSetUpError: (error) => {
    console.error('Database setup error:', error);
  },
});

// Create the database instance
export const database = new Database({
  adapter,
  modelClasses,
});

// Export collections for easy access
export const jobsCollection = database.get('jobs');
export const customersCollection = database.get('customers');
// export const addressesCollection = database.get('addresses');
// export const jobLineItemsCollection = database.get('job_line_items');
// export const jobChecklistsCollection = database.get('job_checklists');
// export const jobChecklistItemsCollection = database.get('job_checklist_items');
// export const jobPhotosCollection = database.get('job_photos');
// export const jobSignaturesCollection = database.get('job_signatures');
// export const servicesCollection = database.get('services');
// export const materialsCollection = database.get('materials');
// export const timeEntriesCollection = database.get('time_entries');
// export const offlineQueueCollection = database.get('offline_queue');

// Database helper functions
export const resetDatabase = async () => {
  await database.write(async () => {
    await database.unsafeResetDatabase();
  });
};

export const getDatabaseInfo = () => {
  return {
    schema: schema,
    version: schema.version,
    tables: schema.tables.map((t: any) => t.name),
  };
};


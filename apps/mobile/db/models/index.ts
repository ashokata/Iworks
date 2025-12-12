import Job from './Job';
import Customer from './Customer';

// Export all models
export { Job, Customer };

// Model registry for database initialization
export const modelClasses = [
  Job,
  Customer,
  // Add more models as needed:
  // Address,
  // JobLineItem,
  // JobChecklist,
  // JobChecklistItem,
  // JobPhoto,
  // JobSignature,
  // Service,
  // Material,
  // TimeEntry,
  // OfflineQueue,
];


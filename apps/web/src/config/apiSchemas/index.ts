/**
 * API Schemas - Central Export
 * 
 * This barrel file re-exports all schema transformers and utilities.
 * Import from here to keep imports clean and maintainable.
 * 
 * Example usage:
 * import { transformJobFromApi, extractODataResponse } from '@/config/apiSchemas';
 */

// Job Schema
export {
  JOB_FIELD_MAP,
  transformJobFromApi,
  transformJobToApi,
  transformCreateJobToApi,
  transformUpdateJobToApi,
} from './job.schema';

// Customer Schema
export {
  CUSTOMER_FIELD_MAP,
  transformCustomerFromApi,
  transformCustomerToApi,
} from './customer.schema';

// Invoice Schema
export {
  INVOICE_FIELD_MAP,
  transformInvoiceFromApi,
  transformInvoiceToApi,
} from './invoice.schema';

// Technician Schema (using Employee schema)
export {
  EMPLOYEE_FIELD_MAP as TECHNICIAN_FIELD_MAP,
  transformEmployeeFromApi as transformTechnicianFromApi,
  transformEmployeeToApi as transformTechnicianToApi,
} from './employee.schema';

// Pricing Schema
export {
  PRICING_FIELD_MAP,
  transformPricingFromApi,
  transformPricingToApi,
  transformCreatePricingToApi,
  transformUpdatePricingToApi,
} from './pricing.schema';

// Utility Functions
export {
  extractODataResponse,
  transformDate,
  transformNumber,
  transformString,
} from './utils';

/**
 * Customer API Schema Mappings
 * Based on OpenAPI spec: /odata/iworks/v1/Customers
 * Supports expand: CustomerAddresses, Jobs
 */

/**
 * Address Type enum
 */
export type AddressType = 'Primary' | 'Billing' | 'Service';

/**
 * Job Title enum from OData
 */
export type JobTitle = 'No_title' | 'Mr_' | 'Ms_' | 'Mrs_' | 'Miss_' | 'Dr_';

/**
 * Format job title for display (converts "Dr_" to "Dr.", etc.)
 */
export const formatJobTitle = (title: string | null): string | null => {
  if (!title || title === 'No_title') return null;
  return title.replace(/_$/, '.'); // Replace trailing underscore with period
};


/**
 * Customer Address interface matching OData API
 */
export interface CustomerAddressAPI {
  AddressID: string | number;  // OData returns as string, but can be parsed as integer
  AddressType: AddressType;
  Address_Line1: string;
  Address_Line_2?: string;
  City: string;
  State: string;
  ZipCode: string;
  County?: string;
  Country?: string;
  changedDate?: string;
  createdDate?: string;
}

/**
 * API Field Mapping for Customers from Mendix OData
 */
export const CUSTOMER_FIELD_MAP = {
  // Backend → Frontend
  CustomerID: 'id',
  FirstName: 'firstName',
  LastName: 'lastName',
  Email: 'email',
  BillableEmail: 'billableEmail',
  BillableName: 'billableName',
  BillablePhoneNumber: 'billablePhoneNumber',
  DisplayName: 'displayName',
  MobileNumber: 'mobileNumber',
  HomeNumber: 'homeNumber',
  WorkNumber: 'workNumber',
  Company: 'company',
  JobTitle: 'jobTitle',
  Notes: 'notes',
  NotificationEnabled: 'notificationEnabled',
  Archived: 'archived',
  IsContractor: 'isContractor',
  HasImprovedCardOnFile: 'hasImprovedCardOnFile',
  DoNotService: 'doNotService',
  IsActive: 'isActive',
  changedDate: 'updatedAt',
  createdDate: 'createdAt',
} as const;

/**
 * Transform CustomerAddress from API to Frontend format
 */
export const transformCustomerAddressFromApi = (apiAddress: CustomerAddressAPI): any => {
  return {
    id: typeof apiAddress.AddressID === 'string' ? parseInt(apiAddress.AddressID, 10) : apiAddress.AddressID,
    street: apiAddress.Address_Line1,
    city: apiAddress.City,
    state: apiAddress.State,
    zipCode: apiAddress.ZipCode,
    isPrimary: apiAddress.AddressType === 'Primary',
    addressType: apiAddress.AddressType,
    street2: apiAddress.Address_Line_2 || null,
    county: apiAddress.County || null,
    country: apiAddress.Country || null,
    createdAt: apiAddress.createdDate,
    updatedAt: apiAddress.changedDate,
  };
};

/**
 * Transform CustomerAddress to API format (Frontend to OData PascalCase)
 */
export const transformCustomerAddressToApi = (address: any): Partial<CustomerAddressAPI> => {
  return {
    AddressType: address.addressType || (address.isPrimary ? 'Primary' : 'Service'),
    Address_Line1: address.street,
    Address_Line_2: address.street2 || address.Address_Line_2,
    City: address.city,
    State: address.state,
    ZipCode: address.zipCode || address.postalCode,
    County: address.county,
    Country: address.country,
  };
};

/**
 * Transform Customer from API (OData format) to Frontend format (snake_case)
 */
export const transformCustomerFromApi = (apiCustomer: any): any => {
  const addresses = apiCustomer.CustomerAddresses 
    ? (Array.isArray(apiCustomer.CustomerAddresses) 
        ? apiCustomer.CustomerAddresses.map(transformCustomerAddressFromApi)
        : [])
    : [];
  
  // Generate display name with fallback
  const displayName = apiCustomer.DisplayName || 
    `${apiCustomer.FirstName || ''} ${apiCustomer.LastName || ''}`.trim() || 
    'Unnamed Customer';
  
  return {
    // Core identification
    object: 'customer',
    id: String(apiCustomer.CustomerID || apiCustomer.id),
    
    // Name fields
    first_name: apiCustomer.FirstName || '',
    last_name: apiCustomer.LastName || null,
    display_name: displayName,
    
    // Contact information
    email: apiCustomer.Email || null,
    mobile_number: apiCustomer.MobileNumber || null,
    home_number: apiCustomer.HomeNumber || null,
    work_number: apiCustomer.WorkNumber || null,
    
    // Billing information
    billable_email: apiCustomer.BillableEmail || apiCustomer.Email || null,
    billable_name: apiCustomer.BillableName || displayName,
    billable_phone_number: apiCustomer.BillablePhoneNumber || apiCustomer.MobileNumber || null,
    
    // Business information
    company: apiCustomer.Company || null,
    job_title: formatJobTitle(apiCustomer.JobTitle),
    type: apiCustomer.Company ? 'business' : 'homeowner',
    
    // Additional details
    notes: apiCustomer.Notes || null,
    
    // Flags and settings
    notifications_enabled: apiCustomer.NotificationEnabled !== undefined ? apiCustomer.NotificationEnabled : true,
    archived: apiCustomer.Archived !== undefined ? apiCustomer.Archived : false,
    is_contractor: apiCustomer.IsContractor !== undefined ? apiCustomer.IsContractor : false,
    has_improved_card_on_file: apiCustomer.HasImprovedCardOnFile !== undefined ? apiCustomer.HasImprovedCardOnFile : false,
    do_not_service: apiCustomer.DoNotService !== undefined ? apiCustomer.DoNotService : false,
    
    // Timestamps
    created_at: apiCustomer.createdDate || new Date().toISOString(),
    updated_at: apiCustomer.changedDate || new Date().toISOString(),
    
    // Related data
    addresses: {
      object: 'list',
      data: addresses,
      url: `/customers/${apiCustomer.CustomerID}/addresses`
    },
    tags: {
      object: 'list',
      data: [],
      url: `/customers/${apiCustomer.CustomerID}/tags`
    },
    
    // Resource URL
    url: `/customers/${apiCustomer.CustomerID}`,
    
    // Parent relationship
    parent_customer_id: null,
  };
};

/**
 * Transform Customer to API format (Frontend snake_case to OData PascalCase)
 * @param customer - Customer data
 * @param isCreate - Set to true when creating a new customer (excludes CustomerID)
 */
export const transformCustomerToApi = (customer: any, isCreate: boolean = false): any => {
  // Convert job_title to OData enum format or set to null
  let jobTitle = null;
  if (customer.job_title || customer.jobTitle) {
    const title = customer.job_title || customer.jobTitle;
    // Map common titles to OData enum values
    const titleMap: Record<string, string> = {
      'mr': 'Mr_',
      'mr.': 'Mr_',
      'ms': 'Ms_',
      'ms.': 'Ms_',
      'mrs': 'Mrs_',
      'mrs.': 'Mrs_',
      'miss': 'Miss_',
      'dr': 'Dr_',
      'dr.': 'Dr_',
    };
    jobTitle = titleMap[title.toLowerCase()] || 'No_title';
  }
  
  const apiData: any = {
    FirstName: customer.first_name || customer.firstName,
    LastName: customer.last_name || customer.lastName || null,
    Email: customer.email || null,
    BillableEmail: customer.billable_email || customer.billableEmail || customer.email || null,
    BillableName: customer.billable_name || customer.billableName || `${customer.first_name || customer.firstName || ''} ${customer.last_name || customer.lastName || ''}`.trim() || null,
    BillablePhoneNumber: customer.billable_phone_number || customer.billablePhoneNumber || customer.mobile_number || customer.mobileNumber || null,
    DisplayName: customer.display_name || customer.displayName || `${customer.first_name || customer.firstName || ''} ${customer.last_name || customer.lastName || ''}`.trim(),
    MobileNumber: customer.mobile_number || customer.mobileNumber || null,
    HomeNumber: customer.home_number || customer.homeNumber || null,
    WorkNumber: customer.work_number || customer.workNumber || null,
    Company: customer.company || null,
    JobTitle: jobTitle,
    Notes: customer.notes || null,
    NotificationEnabled: customer.notifications_enabled !== undefined ? customer.notifications_enabled : (customer.notificationEnabled !== undefined ? customer.notificationEnabled : true),
    Archived: customer.archived !== undefined ? customer.archived : false,
    IsContractor: customer.is_contractor !== undefined ? customer.is_contractor : (customer.isContractor !== undefined ? customer.isContractor : false),
    HasImprovedCardOnFile: customer.has_improved_card_on_file !== undefined ? customer.has_improved_card_on_file : (customer.hasImprovedCardOnFile !== undefined ? customer.hasImprovedCardOnFile : false),
    DoNotService: customer.do_not_service !== undefined ? customer.do_not_service : (customer.doNotService !== undefined ? customer.doNotService : false),
    IsActive: true, // Always set to true for active customers
  };
  
  // Only include CustomerID for updates, not for creation
  if (!isCreate && customer.id) {
    apiData.CustomerID = customer.id;
  }
  
  return apiData;
};

// This service provides a unified interface to all entity relationships in the system
// It serves as documentation and a reference point for implementation

import { apiClient } from './apiClient';

export interface EntityRelationship {
  sourceEntity: string;
  targetEntity: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  description: string;
}

export interface EntityDefinition {
  name: string;
  description: string;
  attributes: {
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }[];
  relationships: EntityRelationship[];
  implemented: boolean | 'partial';
  apiEndpoint?: string;
}

const entityRelationships: EntityRelationship[] = [
  {
    sourceEntity: 'Technician',
    targetEntity: 'ServiceJob',
    type: 'one-to-many',
    description: 'A technician can be assigned to multiple service jobs'
  },
  {
    sourceEntity: 'Technician',
    targetEntity: 'Skill',
    type: 'many-to-many',
    description: 'Technicians possess multiple skills, and skills can be possessed by multiple technicians'
  },
  {
    sourceEntity: 'Technician',
    targetEntity: 'ServiceArea',
    type: 'many-to-many',
    description: 'Technicians cover multiple service areas, and service areas can be covered by multiple technicians'
  },
  {
    sourceEntity: 'ServiceJob',
    targetEntity: 'Customer',
    type: 'many-to-one',
    description: 'Multiple service jobs can belong to one customer'
  },
  {
    sourceEntity: 'ServiceJob',
    targetEntity: 'JobMaterial',
    type: 'one-to-many',
    description: 'A service job can use multiple materials'
  },
  {
    sourceEntity: 'JobMaterial',
    targetEntity: 'Inventory',
    type: 'many-to-one',
    description: 'Job materials are sourced from inventory'
  }
];

const entityDefinitions: EntityDefinition[] = [
  {
    name: 'Technician',
    description: 'Field service personnel with skills, availability, and service areas',
    attributes: [
      { name: 'id', type: 'string', description: 'Unique identifier', required: true },
      { name: 'name', type: 'string', description: 'Full name of the technician', required: true },
      { name: 'email', type: 'string', description: 'Contact email', required: true },
      { name: 'phone', type: 'string', description: 'Contact phone number', required: true },
      { name: 'skills', type: 'string[]', description: 'List of skill IDs', required: true },
      { name: 'rating', type: 'number', description: 'Performance rating (1-5)', required: false },
      { name: 'tenantId', type: 'string', description: 'Multi-tenant identifier', required: true },
      { name: 'yearsOfExperience', type: 'number', description: 'Years of professional experience', required: false },
      { name: 'status', type: 'string', description: 'Current status (Available, Assigned, Off Duty)', required: true },
      { name: 'profileImage', type: 'string', description: 'URL to profile image', required: false },
      { name: 'employeeId', type: 'string', description: 'Reference to employee record', required: false }
    ],
    relationships: [
      {
        sourceEntity: 'Technician',
        targetEntity: 'ServiceJob',
        type: 'one-to-many',
        description: 'A technician can be assigned to multiple service jobs'
      },
      {
        sourceEntity: 'Technician',
        targetEntity: 'Skill',
        type: 'many-to-many',
        description: 'Technicians possess multiple skills'
      },
      {
        sourceEntity: 'Technician',
        targetEntity: 'ServiceArea',
        type: 'many-to-many',
        description: 'Technicians cover multiple service areas'
      },
      {
        sourceEntity: 'Technician',
        targetEntity: 'Schedule',
        type: 'one-to-many',
        description: 'A technician has many schedule events'
      },
      {
        sourceEntity: 'Technician',
        targetEntity: 'Employee',
        type: 'many-to-one',
        description: 'A technician is linked to an employee record'
      }
    ],
    implemented: true,
    apiEndpoint: '/api/technicians'
  },
  {
    name: 'ServiceJob',
    description: 'Work orders assigned to technicians',
    attributes: [
      { name: 'id', type: 'string', description: 'Unique identifier', required: true },
      { name: 'title', type: 'string', description: 'Job title', required: true },
      { name: 'customer', type: 'string', description: 'Customer ID', required: true },
      { name: 'startTime', type: 'datetime', description: 'Scheduled start time', required: true },
      { name: 'endTime', type: 'datetime', description: 'Scheduled end time', required: true },
      { name: 'status', type: 'string', description: 'Job status (Scheduled, In Progress, Completed, etc.)', required: true },
      { name: 'address', type: 'string', description: 'Service location address', required: true },
      { name: 'description', type: 'string', description: 'Detailed job description', required: false },
      { name: 'jobType', type: 'string', description: 'Type of service job', required: true },
      { name: 'priority', type: 'string', description: 'Job priority (Low, Medium, High, Emergency)', required: true },
      { name: 'notes', type: 'string', description: 'Additional job notes', required: false },
      { name: 'tenantId', type: 'string', description: 'Multi-tenant identifier', required: true },
      { name: 'customerId', type: 'string', description: 'Customer ID reference', required: true },
      { name: 'createdAt', type: 'datetime', description: 'Creation timestamp', required: true },
      { name: 'updatedAt', type: 'datetime', description: 'Last update timestamp', required: true },
      { name: 'estimatedHours', type: 'number', description: 'Estimated hours to complete', required: false },
      { name: 'actualHours', type: 'number', description: 'Actual hours spent', required: false }
    ],
    relationships: [
      {
        sourceEntity: 'ServiceJob',
        targetEntity: 'Technician',
        type: 'many-to-one',
        description: 'A service job is assigned to one technician'
      },
      {
        sourceEntity: 'ServiceJob',
        targetEntity: 'Customer',
        type: 'many-to-one',
        description: 'A service job belongs to one customer'
      },
      {
        sourceEntity: 'ServiceJob',
        targetEntity: 'JobMaterial',
        type: 'one-to-many',
        description: 'A service job can use multiple materials'
      },
      {
        sourceEntity: 'ServiceJob',
        targetEntity: 'Invoice',
        type: 'one-to-one',
        description: 'A service job can generate one invoice'
      },
      {
        sourceEntity: 'ServiceJob',
        targetEntity: 'Schedule',
        type: 'one-to-many',
        description: 'A service job appears on schedule events'
      }
    ],
    implemented: true,
    apiEndpoint: '/api/jobs'
  },
  {
    name: 'Customer',
    description: 'Clients requesting service work',
    attributes: [
      { name: 'id', type: 'string', description: 'Unique identifier', required: true },
      { name: 'name', type: 'string', description: 'Customer name', required: true },
      { name: 'email', type: 'string', description: 'Contact email', required: true },
      { name: 'phone', type: 'string', description: 'Contact phone number', required: true },
      { name: 'address', type: 'string', description: 'Primary address', required: true },
      { name: 'type', type: 'string', description: 'Customer type (Residential, Commercial)', required: true },
      { name: 'notes', type: 'string', description: 'Additional notes', required: false },
      { name: 'isActive', type: 'boolean', description: 'Whether the customer is active', required: true },
      { name: 'tenantId', type: 'string', description: 'Multi-tenant identifier', required: true },
      { name: 'createdAt', type: 'datetime', description: 'Creation timestamp', required: true },
      { name: 'updatedAt', type: 'datetime', description: 'Last update timestamp', required: true },
      { name: 'billingAddress', type: 'string', description: 'Billing address if different', required: false },
      { name: 'paymentTerms', type: 'string', description: 'Payment terms', required: false }
    ],
    relationships: [
      {
        sourceEntity: 'Customer',
        targetEntity: 'ServiceJob',
        type: 'one-to-many',
        description: 'A customer can request multiple service jobs'
      },
      {
        sourceEntity: 'Customer',
        targetEntity: 'Invoice',
        type: 'one-to-many',
        description: 'A customer can receive multiple invoices'
      }
    ],
    implemented: true,
    apiEndpoint: '/api/customers'
  },
  {
    name: 'Invoice',
    description: 'Billing documents for completed service jobs',
    attributes: [
      { name: 'id', type: 'string', description: 'Unique identifier', required: true },
      { name: 'customerId', type: 'string', description: 'Customer ID', required: true },
      { name: 'jobId', type: 'string', description: 'Service job ID', required: true },
      { name: 'amount', type: 'number', description: 'Base invoice amount', required: true },
      { name: 'status', type: 'string', description: 'Invoice status (Draft, Sent, Paid, Overdue)', required: true },
      { name: 'dueDate', type: 'datetime', description: 'Payment due date', required: true },
      { name: 'issuedDate', type: 'datetime', description: 'Date invoice was issued', required: true },
      { name: 'paidDate', type: 'datetime', description: 'Date invoice was paid', required: false },
      { name: 'notes', type: 'string', description: 'Additional notes', required: false },
      { name: 'tenantId', type: 'string', description: 'Multi-tenant identifier', required: true },
      { name: 'tax', type: 'number', description: 'Tax amount', required: false },
      { name: 'discount', type: 'number', description: 'Discount amount', required: false },
      { name: 'total', type: 'number', description: 'Total invoice amount', required: true }
    ],
    relationships: [
      {
        sourceEntity: 'Invoice',
        targetEntity: 'Customer',
        type: 'many-to-one',
        description: 'An invoice is issued to one customer'
      },
      {
        sourceEntity: 'Invoice',
        targetEntity: 'ServiceJob',
        type: 'one-to-one',
        description: 'An invoice is for one service job'
      },
      {
        sourceEntity: 'Invoice',
        targetEntity: 'Payment',
        type: 'one-to-many',
        description: 'An invoice can receive multiple payments'
      }
    ],
    implemented: 'partial',
    apiEndpoint: '/api/invoices'
  },
  {
    name: 'Employee',
    description: 'Company staff members with different roles',
    attributes: [
      { name: 'id', type: 'string', description: 'Unique identifier', required: true },
      { name: 'name', type: 'string', description: 'Full name', required: true },
      { name: 'email', type: 'string', description: 'Work email', required: true },
      { name: 'phone', type: 'string', description: 'Contact phone number', required: true },
      { name: 'role', type: 'string', description: 'Job role', required: true },
      { name: 'department', type: 'string', description: 'Department', required: true },
      { name: 'managerId', type: 'string', description: 'ID of manager employee', required: false },
      { name: 'isActive', type: 'boolean', description: 'Whether employee is active', required: true },
      { name: 'tenantId', type: 'string', description: 'Multi-tenant identifier', required: true },
      { name: 'hireDate', type: 'datetime', description: 'Date employee was hired', required: true },
      { name: 'salary', type: 'number', description: 'Annual salary', required: false },
      { name: 'employmentType', type: 'string', description: 'Type of employment (Full-time, Part-time, Contract)', required: true }
    ],
    relationships: [
      {
        sourceEntity: 'Employee',
        targetEntity: 'Technician',
        type: 'one-to-one',
        description: 'An employee can be a technician'
      }
    ],
    implemented: false,
    apiEndpoint: '/api/employees'
  },
  {
    name: 'Schedule',
    description: 'Calendar events for technicians and jobs',
    attributes: [
      { name: 'id', type: 'string', description: 'Unique identifier', required: true },
      { name: 'technicianId', type: 'string', description: 'Technician ID', required: true },
      { name: 'jobId', type: 'string', description: 'Service job ID', required: false },
      { name: 'title', type: 'string', description: 'Event title', required: true },
      { name: 'startTime', type: 'datetime', description: 'Start time', required: true },
      { name: 'endTime', type: 'datetime', description: 'End time', required: true },
      { name: 'type', type: 'string', description: 'Event type (Job, Break, Meeting, Training)', required: true },
      { name: 'notes', type: 'string', description: 'Additional notes', required: false },
      { name: 'isAllDay', type: 'boolean', description: 'Whether event is all day', required: true },
      { name: 'recurrence', type: 'string', description: 'Recurrence pattern', required: false },
      { name: 'status', type: 'string', description: 'Event status', required: true }
    ],
    relationships: [
      {
        sourceEntity: 'Schedule',
        targetEntity: 'Technician',
        type: 'many-to-one',
        description: 'A schedule event belongs to one technician'
      },
      {
        sourceEntity: 'Schedule',
        targetEntity: 'ServiceJob',
        type: 'many-to-one',
        description: 'A schedule event can be related to a service job'
      }
    ],
    implemented: 'partial',
    apiEndpoint: '/api/schedule'
  },
  {
    name: 'Skill',
    description: 'Capabilities required for different types of service work',
    attributes: [
      { name: 'id', type: 'string', description: 'Unique identifier', required: true },
      { name: 'name', type: 'string', description: 'Skill name', required: true },
      { name: 'description', type: 'string', description: 'Detailed description', required: false },
      { name: 'category', type: 'string', description: 'Skill category', required: false },
      { name: 'requiresCertification', type: 'boolean', description: 'Whether the skill requires certification', required: false },
      { name: 'tenantId', type: 'string', description: 'Multi-tenant identifier', required: true },
      { name: 'createdAt', type: 'datetime', description: 'Creation timestamp', required: true },
      { name: 'updatedAt', type: 'datetime', description: 'Last update timestamp', required: true }
    ],
    relationships: [
      {
        sourceEntity: 'Skill',
        targetEntity: 'Technician',
        type: 'many-to-many',
        description: 'Skills can be possessed by multiple technicians'
      }
    ],
    implemented: 'partial',
    apiEndpoint: '/api/skills'
  },
  {
    name: 'ServiceArea',
    description: 'Geographic regions covered by technicians',
    attributes: [
      { name: 'id', type: 'string', description: 'Unique identifier', required: true },
      { name: 'name', type: 'string', description: 'Area name', required: true },
      { name: 'description', type: 'string', description: 'Area description', required: false },
      { name: 'zipCodes', type: 'string[]', description: 'ZIP/Postal codes in this area', required: true },
      { name: 'city', type: 'string', description: 'Primary city', required: false },
      { name: 'state', type: 'string', description: 'State/Province', required: false },
      { name: 'country', type: 'string', description: 'Country', required: false },
      { name: 'isActive', type: 'boolean', description: 'Whether this area is currently active', required: true },
      { name: 'tenantId', type: 'string', description: 'Multi-tenant identifier', required: true },
      { name: 'createdAt', type: 'datetime', description: 'Creation timestamp', required: true },
      { name: 'updatedAt', type: 'datetime', description: 'Last update timestamp', required: true }
    ],
    relationships: [
      {
        sourceEntity: 'ServiceArea',
        targetEntity: 'Technician',
        type: 'many-to-many',
        description: 'Service areas can be covered by multiple technicians'
      }
    ],
    implemented: 'partial',
    apiEndpoint: '/api/service-areas'
  },
  {
    name: 'JobMaterial',
    description: 'Parts and materials used in service jobs',
    attributes: [
      { name: 'id', type: 'string', description: 'Unique identifier', required: true },
      { name: 'jobId', type: 'string', description: 'Service job ID', required: true },
      { name: 'itemName', type: 'string', description: 'Material name', required: true },
      { name: 'quantity', type: 'number', description: 'Quantity used', required: true },
      { name: 'unitPrice', type: 'number', description: 'Price per unit', required: true },
      { name: 'total', type: 'number', description: 'Total cost', required: true },
      { name: 'notes', type: 'string', description: 'Additional notes', required: false }
    ],
    relationships: [
      {
        sourceEntity: 'JobMaterial',
        targetEntity: 'ServiceJob',
        type: 'many-to-one',
        description: 'Materials are used in one service job'
      },
      {
        sourceEntity: 'JobMaterial',
        targetEntity: 'Inventory',
        type: 'many-to-one',
        description: 'Materials are sourced from inventory'
      }
    ],
    implemented: false,
    apiEndpoint: '/api/job-materials'
  },
  {
    name: 'Inventory',
    description: 'Available parts and materials',
    attributes: [
      { name: 'id', type: 'string', description: 'Unique identifier', required: true },
      { name: 'name', type: 'string', description: 'Item name', required: true },
      { name: 'description', type: 'string', description: 'Item description', required: false },
      { name: 'category', type: 'string', description: 'Item category', required: false },
      { name: 'sku', type: 'string', description: 'Stock keeping unit', required: true },
      { name: 'quantity', type: 'number', description: 'Quantity in stock', required: true },
      { name: 'unitPrice', type: 'number', description: 'Price per unit', required: true },
      { name: 'reorderLevel', type: 'number', description: 'Quantity at which to reorder', required: false },
      { name: 'location', type: 'string', description: 'Storage location', required: false },
      { name: 'tenantId', type: 'string', description: 'Multi-tenant identifier', required: true }
    ],
    relationships: [
      {
        sourceEntity: 'Inventory',
        targetEntity: 'JobMaterial',
        type: 'one-to-many',
        description: 'Inventory items are used as materials in jobs'
      }
    ],
    implemented: false,
    apiEndpoint: '/api/inventory'
  },
  {
    name: 'Payment',
    description: 'Payments received against invoices',
    attributes: [
      { name: 'id', type: 'string', description: 'Unique identifier', required: true },
      { name: 'invoiceId', type: 'string', description: 'Invoice ID', required: true },
      { name: 'amount', type: 'number', description: 'Payment amount', required: true },
      { name: 'date', type: 'datetime', description: 'Payment date', required: true },
      { name: 'method', type: 'string', description: 'Payment method (Credit Card, Check, etc.)', required: true },
      { name: 'status', type: 'string', description: 'Payment status (Processed, Pending, Failed)', required: true },
      { name: 'referenceNumber', type: 'string', description: 'External reference number', required: false }
    ],
    relationships: [
      {
        sourceEntity: 'Payment',
        targetEntity: 'Invoice',
        type: 'many-to-one',
        description: 'A payment is applied to one invoice'
      }
    ],
    implemented: false,
    apiEndpoint: '/api/payments'
  }
];

export const entityModelService = {
  getEntityRelationships: () => {
    return entityRelationships;
  },
  
  getEntityDefinitions: () => {
    return entityDefinitions;
  },
  
  getEntityDefinition: (entityName: string) => {
    return entityDefinitions.find(entity => entity.name === entityName);
  },
  
  getImplementationStatus: () => {
    const total = entityDefinitions.length;
    const implemented = entityDefinitions.filter(e => e.implemented === true).length;
    const partial = entityDefinitions.filter(e => e.implemented === 'partial').length;
    const notStarted = entityDefinitions.filter(e => e.implemented === false).length;
    
    return {
      total,
      implemented,
      partial,
      notStarted,
      percentComplete: Math.round(((implemented + (partial * 0.5)) / total) * 100)
    };
  },
  
  // For future implementation: fetch entity schema from backend
  fetchEntitySchema: async (entityName: string) => {
    try {
      const response = await apiClient.get(`/api/schema/${entityName}`);
      return response;
    } catch (error) {
      console.error(`Error fetching schema for ${entityName}:`, error);
      throw error;
    }
  }
};

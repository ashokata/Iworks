import { appSchema, tableSchema } from '@nozbe/watermelondb';

/**
 * WatermelonDB Schema
 * Defines the local SQLite database structure for offline support
 * 
 * This schema mirrors the PostgreSQL schema but is optimized for local storage.
 * Sync-related fields (_status, _changed) are handled by WatermelonDB automatically.
 */
export const schema = appSchema({
  version: 1,
  tables: [
    // ============================================================================
    // JOBS TABLE
    // ============================================================================
    tableSchema({
      name: 'jobs',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true }, // UUID from server
        { name: 'tenant_id', type: 'string', isIndexed: true },
        { name: 'customer_id', type: 'string', isIndexed: true },
        { name: 'job_type_id', type: 'string', isOptional: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'status', type: 'string', isIndexed: true },
        { name: 'priority', type: 'string' },
        { name: 'source', type: 'string' },
        { name: 'scheduled_start', type: 'number', isOptional: true, isIndexed: true },
        { name: 'scheduled_end', type: 'number', isOptional: true },
        { name: 'actual_start', type: 'number', isOptional: true },
        { name: 'actual_end', type: 'number', isOptional: true },
        { name: 'estimated_duration', type: 'number', isOptional: true },
        { name: 'internal_notes', type: 'string', isOptional: true },
        { name: 'customer_notes', type: 'string', isOptional: true },
        { name: 'address_id', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        // Denormalized customer info for offline display
        { name: 'customer_name', type: 'string', isOptional: true },
        { name: 'customer_phone', type: 'string', isOptional: true },
        // Denormalized address for offline display
        { name: 'address_street', type: 'string', isOptional: true },
        { name: 'address_city', type: 'string', isOptional: true },
        { name: 'address_state', type: 'string', isOptional: true },
        { name: 'address_zip', type: 'string', isOptional: true },
      ],
    }),

    // ============================================================================
    // CUSTOMERS TABLE
    // ============================================================================
    tableSchema({
      name: 'customers',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'tenant_id', type: 'string', isIndexed: true },
        { name: 'display_name', type: 'string' },
        { name: 'first_name', type: 'string', isOptional: true },
        { name: 'last_name', type: 'string', isOptional: true },
        { name: 'company_name', type: 'string', isOptional: true },
        { name: 'type', type: 'string' }, // RESIDENTIAL, COMMERCIAL, CONTRACTOR
        { name: 'email', type: 'string', isOptional: true },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'alt_phone', type: 'string', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'tags', type: 'string', isOptional: true }, // JSON array
        { name: 'is_active', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ============================================================================
    // ADDRESSES TABLE
    // ============================================================================
    tableSchema({
      name: 'addresses',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'customer_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' }, // SERVICE, BILLING, BOTH
        { name: 'street1', type: 'string' },
        { name: 'street2', type: 'string', isOptional: true },
        { name: 'city', type: 'string' },
        { name: 'state', type: 'string' },
        { name: 'zip_code', type: 'string' },
        { name: 'country', type: 'string' },
        { name: 'is_primary', type: 'boolean' },
        { name: 'latitude', type: 'number', isOptional: true },
        { name: 'longitude', type: 'number', isOptional: true },
      ],
    }),

    // ============================================================================
    // JOB LINE ITEMS TABLE
    // ============================================================================
    tableSchema({
      name: 'job_line_items',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'job_id', type: 'string', isIndexed: true },
        { name: 'service_id', type: 'string', isOptional: true },
        { name: 'material_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'type', type: 'string' }, // SERVICE, MATERIAL, LABOR, etc.
        { name: 'quantity', type: 'number' },
        { name: 'unit_price', type: 'number' },
        { name: 'total_price', type: 'number' },
        { name: 'is_taxable', type: 'boolean' },
        { name: 'sort_order', type: 'number' },
      ],
    }),

    // ============================================================================
    // JOB CHECKLISTS TABLE
    // ============================================================================
    tableSchema({
      name: 'job_checklists',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'job_id', type: 'string', isIndexed: true },
        { name: 'template_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'sort_order', type: 'number' },
      ],
    }),

    // ============================================================================
    // JOB CHECKLIST ITEMS TABLE
    // ============================================================================
    tableSchema({
      name: 'job_checklist_items',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'checklist_id', type: 'string', isIndexed: true },
        { name: 'label', type: 'string' },
        { name: 'value_type', type: 'string' }, // BOOLEAN, TEXT, NUMBER, etc.
        { name: 'value', type: 'string', isOptional: true },
        { name: 'is_required', type: 'boolean' },
        { name: 'sort_order', type: 'number' },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'completed_by', type: 'string', isOptional: true },
      ],
    }),

    // ============================================================================
    // JOB PHOTOS TABLE (Local Storage)
    // ============================================================================
    tableSchema({
      name: 'job_photos',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true }, // null until uploaded
        { name: 'job_id', type: 'string', isIndexed: true },
        { name: 'local_uri', type: 'string' }, // Local file path
        { name: 'remote_url', type: 'string', isOptional: true }, // S3 URL after upload
        { name: 'caption', type: 'string', isOptional: true },
        { name: 'type', type: 'string' }, // BEFORE, AFTER, DAMAGE, etc.
        { name: 'uploaded', type: 'boolean' },
        { name: 'upload_error', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // ============================================================================
    // JOB SIGNATURES TABLE
    // ============================================================================
    tableSchema({
      name: 'job_signatures',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'job_id', type: 'string', isIndexed: true },
        { name: 'signature_data', type: 'string' }, // Base64 PNG
        { name: 'signer_name', type: 'string' },
        { name: 'signer_type', type: 'string' }, // CUSTOMER, TECHNICIAN
        { name: 'uploaded', type: 'boolean' },
        { name: 'created_at', type: 'number' },
      ],
    }),

    // ============================================================================
    // SERVICES TABLE (Price Book)
    // ============================================================================
    tableSchema({
      name: 'services',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'tenant_id', type: 'string', isIndexed: true },
        { name: 'category_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'sku', type: 'string', isOptional: true },
        { name: 'unit_price', type: 'number' },
        { name: 'cost', type: 'number', isOptional: true },
        { name: 'unit', type: 'string' },
        { name: 'is_taxable', type: 'boolean' },
        { name: 'is_active', type: 'boolean' },
      ],
    }),

    // ============================================================================
    // MATERIALS TABLE (Inventory)
    // ============================================================================
    tableSchema({
      name: 'materials',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'tenant_id', type: 'string', isIndexed: true },
        { name: 'category_id', type: 'string', isOptional: true },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'sku', type: 'string', isOptional: true },
        { name: 'unit_price', type: 'number' },
        { name: 'cost', type: 'number', isOptional: true },
        { name: 'unit', type: 'string' },
        { name: 'is_taxable', type: 'boolean' },
        { name: 'is_active', type: 'boolean' },
      ],
    }),

    // ============================================================================
    // TIME ENTRIES TABLE
    // ============================================================================
    tableSchema({
      name: 'time_entries',
      columns: [
        { name: 'server_id', type: 'string', isOptional: true },
        { name: 'job_id', type: 'string', isIndexed: true },
        { name: 'employee_id', type: 'string', isIndexed: true },
        { name: 'start_time', type: 'number' },
        { name: 'end_time', type: 'number', isOptional: true },
        { name: 'duration_minutes', type: 'number', isOptional: true },
        { name: 'type', type: 'string' }, // WORK, TRAVEL, BREAK
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'synced', type: 'boolean' },
      ],
    }),

    // ============================================================================
    // OFFLINE QUEUE TABLE (Pending Operations)
    // ============================================================================
    tableSchema({
      name: 'offline_queue',
      columns: [
        { name: 'entity_type', type: 'string' }, // job, customer, etc.
        { name: 'entity_id', type: 'string' },
        { name: 'operation', type: 'string' }, // CREATE, UPDATE, DELETE
        { name: 'payload', type: 'string' }, // JSON stringified data
        { name: 'created_at', type: 'number' },
        { name: 'retry_count', type: 'number' },
        { name: 'last_error', type: 'string', isOptional: true },
        { name: 'priority', type: 'number' }, // Higher = more important
      ],
    }),
  ],
});


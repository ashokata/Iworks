import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children, relation } from '@nozbe/watermelondb/decorators';

/**
 * Job Model - Local representation of a job for offline storage
 */
export default class Job extends Model {
  static table = 'jobs';

  static associations = {
    customers: { type: 'belongs_to' as const, key: 'customer_id' },
    job_line_items: { type: 'has_many' as const, foreignKey: 'job_id' },
    job_checklists: { type: 'has_many' as const, foreignKey: 'job_id' },
    job_photos: { type: 'has_many' as const, foreignKey: 'job_id' },
    job_signatures: { type: 'has_many' as const, foreignKey: 'job_id' },
    time_entries: { type: 'has_many' as const, foreignKey: 'job_id' },
  };

  // Server ID (UUID from PostgreSQL)
  @field('server_id') serverId!: string;
  @field('tenant_id') tenantId!: string;
  @field('customer_id') customerId!: string;
  @field('job_type_id') jobTypeId?: string;
  
  // Job details
  @field('title') title!: string;
  @field('description') description?: string;
  @field('status') status!: string;
  @field('priority') priority!: string;
  @field('source') source!: string;
  
  // Schedule
  @field('scheduled_start') scheduledStart?: number;
  @field('scheduled_end') scheduledEnd?: number;
  @field('actual_start') actualStart?: number;
  @field('actual_end') actualEnd?: number;
  @field('estimated_duration') estimatedDuration?: number;
  
  // Notes
  @field('internal_notes') internalNotes?: string;
  @field('customer_notes') customerNotes?: string;
  @field('address_id') addressId?: string;
  
  // Denormalized fields for offline display
  @field('customer_name') customerName?: string;
  @field('customer_phone') customerPhone?: string;
  @field('address_street') addressStreet?: string;
  @field('address_city') addressCity?: string;
  @field('address_state') addressState?: string;
  @field('address_zip') addressZip?: string;
  
  // Timestamps
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Relations
  @children('job_line_items') lineItems: any;
  @children('job_checklists') checklists: any;
  @children('job_photos') photos: any;
  @children('job_signatures') signatures: any;
  @children('time_entries') timeEntries: any;

  // Computed properties
  get scheduledStartDate(): Date | null {
    return this.scheduledStart ? new Date(this.scheduledStart) : null;
  }

  get scheduledEndDate(): Date | null {
    return this.scheduledEnd ? new Date(this.scheduledEnd) : null;
  }

  get formattedAddress(): string {
    const parts = [
      this.addressStreet,
      this.addressCity,
      this.addressState,
      this.addressZip,
    ].filter(Boolean);
    return parts.join(', ');
  }

  get isScheduled(): boolean {
    return this.status === 'SCHEDULED';
  }

  get isInProgress(): boolean {
    return this.status === 'IN_PROGRESS';
  }

  get isCompleted(): boolean {
    return this.status === 'COMPLETED';
  }
}


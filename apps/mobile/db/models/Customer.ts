import { Model } from '@nozbe/watermelondb';
import { field, date, readonly, children, json } from '@nozbe/watermelondb/decorators';

/**
 * Customer Model - Local representation of a customer for offline storage
 */
export default class Customer extends Model {
  static table = 'customers';

  static associations = {
    addresses: { type: 'has_many' as const, foreignKey: 'customer_id' },
    jobs: { type: 'has_many' as const, foreignKey: 'customer_id' },
  };

  // Server ID (UUID from PostgreSQL)
  @field('server_id') serverId!: string;
  @field('tenant_id') tenantId!: string;
  
  // Name fields
  @field('display_name') displayName!: string;
  @field('first_name') firstName?: string;
  @field('last_name') lastName?: string;
  @field('company_name') companyName?: string;
  
  // Type
  @field('type') type!: string; // RESIDENTIAL, COMMERCIAL, CONTRACTOR
  
  // Contact
  @field('email') email?: string;
  @field('phone') phone?: string;
  @field('alt_phone') altPhone?: string;
  
  // Other
  @field('notes') notes?: string;
  @json('tags', (json: any) => json || []) tags!: string[];
  @field('is_active') isActive!: boolean;
  
  // Timestamps
  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  // Relations
  @children('addresses') addresses: any;
  @children('jobs') jobs: any;

  // Computed properties
  get initials(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
    }
    return this.displayName.charAt(0).toUpperCase();
  }

  get formattedPhone(): string {
    if (!this.phone) return '';
    // Format: (XXX) XXX-XXXX
    const cleaned = this.phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return this.phone;
  }

  get isResidential(): boolean {
    return this.type === 'RESIDENTIAL';
  }

  get isCommercial(): boolean {
    return this.type === 'COMMERCIAL';
  }

  get isContractor(): boolean {
    return this.type === 'CONTRACTOR';
  }
}


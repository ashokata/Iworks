/**
 * Customer Factory
 * Creates test customer data
 */

import { CustomerType } from '@prisma/client';

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  type: CustomerType;
  tenantId: string;
}

export class CustomerFactory {
  private static counter = 0;

  /**
   * Build customer data (doesn't save to database)
   */
  static build(overrides: Partial<CustomerData> = {}): Omit<CustomerData, 'tenantId'> {
    this.counter++;

    return {
      name: `Test Customer ${this.counter}`,
      email: `customer${this.counter}@test.com`,
      phone: `555-${1000 + this.counter}`,
      type: CustomerType.RESIDENTIAL,
      ...overrides,
    };
  }

  /**
   * Build many customers
   */
  static buildMany(count: number, overrides: Partial<CustomerData> = {}): Array<Omit<CustomerData, 'tenantId'>> {
    return Array.from({ length: count }, () => this.build(overrides));
  }

  /**
   * Reset counter (useful between tests)
   */
  static reset(): void {
    this.counter = 0;
  }
}

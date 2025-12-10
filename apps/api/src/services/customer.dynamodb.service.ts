import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const CUSTOMERS_TABLE = process.env.DYNAMODB_CUSTOMERS_TABLE || 'fieldsmartpro-customers';

export interface Customer {
  customerId: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateCustomerInput {
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
}

export const customerDynamoDBService = {
  /**
   * Create a new customer in DynamoDB
   */
  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    const now = Date.now();
    const customer: Customer = {
      customerId: uuidv4(),
      tenantId: input.tenantId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      address: input.address,
      city: input.city,
      state: input.state,
      zipCode: input.zipCode,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    await docClient.send(
      new PutCommand({
        TableName: CUSTOMERS_TABLE,
        Item: customer,
        ConditionExpression: 'attribute_not_exists(customerId)',
      })
    );

    return customer;
  },

  /**
   * Get a customer by ID
   */
  async getCustomer(customerId: string): Promise<Customer | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: CUSTOMERS_TABLE,
        Key: { customerId },
      })
    );
    return result.Item as Customer | null;
  },

  /**
   * List customers for a tenant
   */
  async listCustomersByTenant(tenantId: string, limit: number = 50): Promise<Customer[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: CUSTOMERS_TABLE,
        IndexName: 'tenantId-index',
        KeyConditionExpression: 'tenantId = :tenantId',
        ExpressionAttributeValues: {
          ':tenantId': tenantId,
        },
        Limit: limit,
      })
    );
    return result.Items as Customer[] || [];
  },

  /**
   * Update a customer
   */
  async updateCustomer(customerId: string, updates: Partial<Omit<Customer, 'customerId' | 'tenantId' | 'createdAt'>>): Promise<Customer | null> {
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Always update updatedAt
    updates.updatedAt = Date.now();

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    if (updateExpressions.length === 0) {
      return this.getCustomer(customerId);
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: CUSTOMERS_TABLE,
        Key: { customerId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    return result.Attributes as Customer | null;
  },

  /**
   * Delete a customer
   */
  async deleteCustomer(customerId: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: CUSTOMERS_TABLE,
        Key: { customerId },
      })
    );
  },

  /**
   * Search customers by name or email
   */
  async searchCustomers(tenantId: string, searchTerm: string): Promise<Customer[]> {
    // Note: DynamoDB doesn't support full-text search natively
    // For production, consider using OpenSearch/Elasticsearch
    // This is a basic scan with filter - not efficient for large datasets
    const result = await docClient.send(
      new ScanCommand({
        TableName: CUSTOMERS_TABLE,
        FilterExpression: 'tenantId = :tenantId AND (contains(firstName, :search) OR contains(lastName, :search) OR contains(email, :search))',
        ExpressionAttributeValues: {
          ':tenantId': tenantId,
          ':search': searchTerm,
        },
      })
    );
    return result.Items as Customer[] || [];
  },
};


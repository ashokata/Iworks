import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const CONVERSATIONS_TABLE = process.env.DYNAMODB_CONVERSATIONS_TABLE || 'fieldsmartpro-conversations';
const CACHE_TABLE = process.env.DYNAMODB_CACHE_TABLE || 'fieldsmartpro-cache';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  conversationId: string;
  userId: string;
  tenantId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  ttl: number;
}

export const conversationService = {
  async saveConversation(conversation: Conversation): Promise<void> {
    await docClient.send(
      new PutCommand({
        TableName: CONVERSATIONS_TABLE,
        Item: conversation,
      })
    );
  },

  async getConversation(conversationId: string): Promise<Conversation | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: CONVERSATIONS_TABLE,
        Key: { conversationId },
      })
    );
    return result.Item as Conversation | null;
  },

  async getUserConversations(userId: string): Promise<Conversation[]> {
    const result = await docClient.send(
      new QueryCommand({
        TableName: CONVERSATIONS_TABLE,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      })
    );
    return result.Items as Conversation[] || [];
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: CONVERSATIONS_TABLE,
        Key: { conversationId },
      })
    );
  },
};

export const cacheService = {
  async set(key: string, value: any, ttlMinutes: number = 30): Promise<void> {
    const ttl = Math.floor(Date.now() / 1000) + ttlMinutes * 60;
    await docClient.send(
      new PutCommand({
        TableName: CACHE_TABLE,
        Item: {
          cacheKey: key,
          value,
          ttl,
        },
      })
    );
  },

  async get<T>(key: string): Promise<T | null> {
    const result = await docClient.send(
      new GetCommand({
        TableName: CACHE_TABLE,
        Key: { cacheKey: key },
      })
    );
    return result.Item?.value as T | null;
  },

  async delete(key: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: CACHE_TABLE,
        Key: { cacheKey: key },
      })
    );
  },
};

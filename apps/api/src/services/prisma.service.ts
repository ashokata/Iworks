import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client in Lambda environment
let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error'],
      // Connection pool settings optimized for Lambda
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  return prisma;
}

// For graceful shutdown
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

// Re-export types for convenience
export { PrismaClient };
export type { 
  Customer, 
  Address, 
  Job, 
  JobAssignment,
  JobLineItem,
  Employee, 
  Invoice, 
  InvoiceLineItem,
  Payment,
  Estimate,
  EstimateOption,
  EstimateLineItem,
  ServiceAgreement,
  ServicePlan,
  Tenant,
  User,
  Service,
  Material,
  Category,
  JobType,
  ChecklistTemplate,
  ChecklistTemplateItem,
  JobTemplate,
  EstimateTemplate,
  MessageTemplate,
  AiAgent,
  AiConversation,
  Message,
  TimeEntry,
  Skill,
  Tag,
} from '@prisma/client';


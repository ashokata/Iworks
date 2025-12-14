const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking Database Records...\n');
  
  try {
    // Get VAPI Config first
    const config = await prisma.vapiConfiguration.findFirst({
      where: { tenantId: 'demo-hvac-tenant' }
    });
    console.log('VAPI Config:', config ? config.id : 'Not found');
    
    // Check all voice call logs
    const calls = await prisma.voiceCallLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    console.log('\nVoice Call Logs:', calls.length);
    calls.forEach(c => console.log(' - ', c.vapiCallId, c.status, c.createdAt));
    
    // Check all service requests
    const requests = await prisma.serviceRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    console.log('\nService Requests:', requests.length);
    requests.forEach(r => console.log(' - ', r.id, r.status, r.category));
    
    // Check all customers
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    console.log('\nCustomers:', customers.length);
    customers.forEach(c => console.log(' - ', c.firstName, c.lastName, c.primaryPhone, c.createdSource));
    
  } catch (e) {
    console.error('Error:', e.message);
  }
  
  await prisma.$disconnect();
}
main();

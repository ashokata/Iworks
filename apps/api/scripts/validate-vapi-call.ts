import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateVapiCall() {
  console.log('\n========================================');
  console.log('  VAPI CALL VALIDATION REPORT');
  console.log('========================================\n');

  // Voice Call Logs
  const calls = await prisma.voiceCallLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log('📞 VOICE CALL LOGS:', calls.length);
  for (const c of calls) {
    console.log(`   - ${c.vapiCallId}`);
    console.log(`     Status: ${c.status}, Customer: ${c.customerId || 'N/A'}`);
  }

  // Customers from voice agent
  const customers = await prisma.customer.findMany({
    where: { createdSource: 'VOICE_AGENT' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { addresses: true },
  });
  console.log('\n👤 CUSTOMERS (Voice Agent):', customers.length);
  for (const c of customers) {
    console.log(`   - ${c.firstName} ${c.lastName} (${c.customerNumber})`);
    console.log(`     Phone: ${c.mobilePhone || c.primaryPhone}`);
    console.log(`     Status: ${c.verificationStatus}`);
    if (c.addresses[0]) {
      console.log(`     Address: ${c.addresses[0].street}, ${c.addresses[0].city}, ${c.addresses[0].state}`);
    }
  }

  // Service Requests from voice agent
  const requests = await prisma.serviceRequest.findMany({
    where: { createdSource: 'VOICE_AGENT' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log('\n🔧 SERVICE REQUESTS (Voice Agent):', requests.length);
  for (const r of requests) {
    console.log(`   - ${r.requestNumber}: ${r.title}`);
    console.log(`     Problem: ${r.problemType}, Urgency: ${r.urgency}`);
    console.log(`     Status: ${r.status}, Job: ${r.jobId || 'Not scheduled'}`);
  }

  // Jobs from phone
  const jobs = await prisma.job.findMany({
    where: { source: 'PHONE' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      assignments: {
        include: {
          employee: {
            include: { user: true },
          },
        },
      },
    },
  });
  console.log('\n📅 SCHEDULED JOBS (from calls):', jobs.length);
  for (const j of jobs) {
    const tech = j.assignments[0]?.employee?.user;
    const techName = tech ? `${tech.firstName} ${tech.lastName}` : 'Unassigned';
    console.log(`   - ${j.jobNumber}: ${j.title}`);
    console.log(`     Scheduled: ${j.scheduledStart}`);
    console.log(`     Technician: ${techName}`);
    console.log(`     Status: ${j.status}`);
  }

  console.log('\n========================================\n');

  await prisma.$disconnect();
}

validateVapiCall().catch(console.error);


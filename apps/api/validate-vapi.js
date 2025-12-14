const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function validateVapiCall() {
  console.log('\\n========================================');
  console.log('  VAPI CALL VALIDATION REPORT');
  console.log('========================================\\n');
  
  // 1. Voice Call Logs
  const calls = await prisma.voiceCallLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3
  });
  console.log('📞 VOICE CALL LOGS:', calls.length);
  calls.forEach(c => {
    console.log(\   └─ \\);
    console.log(\      Status: \, Duration: \s\);
    console.log(\      Customer ID: \\);
    console.log(\      Service Request ID: \\\n\);
  });

  // 2. Customers created by VOICE_AGENT
  const customers = await prisma.customer.findMany({
    where: { createdSource: 'VOICE_AGENT' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { addresses: true }
  });
  console.log('👤 CUSTOMERS (via Voice Agent):', customers.length);
  customers.forEach(c => {
    console.log(\   └─ \ \ (\)\);
    console.log(\      Phone: \\);
    console.log(\      Verification: \\);
    if (c.addresses[0]) {
      console.log(\      Address: \, \, \\\n\);
    }
  });

  // 3. Service Requests
  const requests = await prisma.serviceRequest.findMany({
    where: { createdSource: 'VOICE_AGENT' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('🔧 SERVICE REQUESTS (via Voice Agent):', requests.length);
  requests.forEach(r => {
    console.log(\   └─ \: \\);
    console.log(\      Category: \, Urgency: \\);
    console.log(\      Status: \\);
    console.log(\      Job ID: \\\n\);
  });

  // 4. Jobs (Appointments)
  const jobs = await prisma.job.findMany({
    where: { source: 'PHONE' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { 
      assignments: { include: { employee: { include: { user: true } } } }
    }
  });
  console.log('📅 SCHEDULED JOBS (from calls):', jobs.length);
  jobs.forEach(j => {
    const tech = j.assignments[0]?.employee?.user;
    const techName = tech ? \\ \\ : 'Unassigned';
    console.log(\   └─ \: \\);
    console.log(\      Scheduled: \\);
    console.log(\      Technician: \\);
    console.log(\      Status: \\\n\);
  });

  console.log('========================================');
  console.log('  END OF REPORT');
  console.log('========================================\\n');
  
  await prisma.\();
}
validateVapiCall().catch(console.error);

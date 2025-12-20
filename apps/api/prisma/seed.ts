import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with demo data...\n');

  // Create industry
  const industry = await prisma.industry.upsert({
    where: { slug: 'hvac' },
    update: {},
    create: {
      name: 'HVAC & Plumbing',
      slug: 'hvac',
      icon: '🔧',
      defaultServices: JSON.stringify(['AC Repair', 'Heating Service', 'Plumbing']),
    },
  });
  console.log('✅ Created industry:', industry.name);

  // Create plan
  const plan = await prisma.plan.upsert({
    where: { slug: 'pro' },
    update: {},
    create: {
      name: 'Pro Plan',
      slug: 'pro',
      tier: 'PRO',
      description: 'Full-featured plan for growing businesses',
      monthlyPrice: 99.00,
      annualPrice: 990.00,
      maxUsers: 25,
      maxCustomers: 5000,
      maxJobsPerMonth: 500,
      features: JSON.stringify({
        scheduling: true,
        invoicing: true,
        reporting: true,
        aiAssistant: true,
        multiUser: true,
      }),
    },
  });
  console.log('✅ Created plan:', plan.name);

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'local-tenant' },
    update: {},
    create: {
      id: 'local-tenant',
      name: 'Local Development',
      slug: 'local-tenant',
      status: 'ACTIVE',
      industryId: industry.id,
      timezone: 'America/Chicago',
    },
  });
  console.log('✅ Created tenant:', tenant.name);

  // Create subscription
  await prisma.subscription.upsert({
    where: { id: 'local-sub' },
    update: {},
    create: {
      id: 'local-sub',
      tenantId: tenant.id,
      planId: plan.id,
      status: 'ACTIVE',
      billingCycle: 'MONTHLY',
      seatCount: 5,
    },
  });
  console.log('✅ Created subscription');

  // Create demo users
  const adminUser = await prisma.user.upsert({
    where: { id: 'admin-user' },
    update: {},
    create: {
      id: 'admin-user',
      email: 'admin@fieldsmartpro.local',
      passwordHash: 'demo-hash',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      phone: '555-0100',
      tenantId: tenant.id,
      isActive: true,
      isVerified: true,
    },
  });

  const techUser1 = await prisma.user.upsert({
    where: { id: 'tech-user-1' },
    update: {},
    create: {
      id: 'tech-user-1',
      email: 'mike@fieldsmartpro.local',
      passwordHash: 'demo-hash',
      firstName: 'Mike',
      lastName: 'Johnson',
      role: 'FIELD_TECH',
      phone: '555-0101',
      tenantId: tenant.id,
      isActive: true,
      isVerified: true,
    },
  });

  const techUser2 = await prisma.user.upsert({
    where: { id: 'tech-user-2' },
    update: {},
    create: {
      id: 'tech-user-2',
      email: 'sarah@fieldsmartpro.local',
      passwordHash: 'demo-hash',
      firstName: 'Sarah',
      lastName: 'Williams',
      role: 'FIELD_TECH',
      phone: '555-0102',
      tenantId: tenant.id,
      isActive: true,
      isVerified: true,
    },
  });
  console.log('✅ Created 3 users');

  // Create employees for technicians
  const employee1 = await prisma.employee.upsert({
    where: { id: 'emp-1' },
    update: {},
    create: {
      id: 'emp-1',
      userId: techUser1.id,
      tenantId: tenant.id,
      employeeNumber: 'EMP-001',
      hireDate: new Date('2023-01-15'),
      jobTitle: 'Senior Technician',
      department: 'Field Service',
      colorHex: '#3B82F6',
      hourlyRate: 35.00,
      overtimeRate: 52.50,
      canBeBookedOnline: true,
      isDispatchEnabled: true,
    },
  });

  const employee2 = await prisma.employee.upsert({
    where: { id: 'emp-2' },
    update: {},
    create: {
      id: 'emp-2',
      userId: techUser2.id,
      tenantId: tenant.id,
      employeeNumber: 'EMP-002',
      hireDate: new Date('2023-06-01'),
      jobTitle: 'Technician',
      department: 'Field Service',
      colorHex: '#10B981',
      hourlyRate: 28.00,
      overtimeRate: 42.00,
      canBeBookedOnline: true,
      isDispatchEnabled: true,
    },
  });
  console.log('✅ Created 2 employees');

  // Create job types
  const jobTypes = await Promise.all([
    prisma.jobType.upsert({
      where: { id: 'jt-repair' },
      update: {},
      create: {
        id: 'jt-repair',
        tenantId: tenant.id,
        name: 'Repair',
        description: 'Equipment repair and troubleshooting',
        colorHex: '#EF4444',
        defaultDuration: 90,
        defaultPriority: 'NORMAL',
      },
    }),
    prisma.jobType.upsert({
      where: { id: 'jt-install' },
      update: {},
      create: {
        id: 'jt-install',
        tenantId: tenant.id,
        name: 'Installation',
        description: 'New equipment installation',
        colorHex: '#3B82F6',
        defaultDuration: 180,
        defaultPriority: 'NORMAL',
      },
    }),
    prisma.jobType.upsert({
      where: { id: 'jt-maintenance' },
      update: {},
      create: {
        id: 'jt-maintenance',
        tenantId: tenant.id,
        name: 'Maintenance',
        description: 'Scheduled maintenance and tune-ups',
        colorHex: '#10B981',
        defaultDuration: 60,
        defaultPriority: 'LOW',
      },
    }),
    prisma.jobType.upsert({
      where: { id: 'jt-emergency' },
      update: {},
      create: {
        id: 'jt-emergency',
        tenantId: tenant.id,
        name: 'Emergency',
        description: 'Emergency service calls',
        colorHex: '#DC2626',
        defaultDuration: 120,
        defaultPriority: 'EMERGENCY',
      },
    }),
  ]);
  console.log(`✅ Created ${jobTypes.length} job types`);

  // Create categories
  const serviceCategory = await prisma.category.upsert({
    where: { id: 'cat-service' },
    update: {},
    create: {
      id: 'cat-service',
      tenantId: tenant.id,
      name: 'Services',
      type: 'SERVICE',
    },
  });

  const materialCategory = await prisma.category.upsert({
    where: { id: 'cat-material' },
    update: {},
    create: {
      id: 'cat-material',
      tenantId: tenant.id,
      name: 'Materials',
      type: 'MATERIAL',
    },
  });
  console.log('✅ Created categories');

  // Create services
  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: 'svc-ac-repair' },
      update: {},
      create: {
        id: 'svc-ac-repair',
        tenantId: tenant.id,
        categoryId: serviceCategory.id,
        sku: 'SVC-001',
        name: 'AC Repair - Standard',
        description: 'Standard air conditioning repair service',
        unitPrice: 150.00,
        unitCost: 50.00,
        estimatedDuration: 90,
        isTaxable: true,
        isOnlineBookable: true,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-heating' },
      update: {},
      create: {
        id: 'svc-heating',
        tenantId: tenant.id,
        categoryId: serviceCategory.id,
        sku: 'SVC-002',
        name: 'Heating System Service',
        description: 'Furnace inspection and maintenance',
        unitPrice: 125.00,
        unitCost: 40.00,
        estimatedDuration: 60,
        isTaxable: true,
        isOnlineBookable: true,
      },
    }),
    prisma.service.upsert({
      where: { id: 'svc-plumbing' },
      update: {},
      create: {
        id: 'svc-plumbing',
        tenantId: tenant.id,
        categoryId: serviceCategory.id,
        sku: 'SVC-003',
        name: 'Plumbing Repair',
        description: 'General plumbing repair service',
        unitPrice: 100.00,
        unitCost: 30.00,
        estimatedDuration: 60,
        isTaxable: true,
        isOnlineBookable: true,
      },
    }),
  ]);
  console.log(`✅ Created ${services.length} services`);

  // Create materials
  const materials = await Promise.all([
    prisma.material.upsert({
      where: { id: 'mat-filter' },
      update: {},
      create: {
        id: 'mat-filter',
        tenantId: tenant.id,
        categoryId: materialCategory.id,
        sku: 'MAT-001',
        name: 'Air Filter - Standard',
        description: '16x25x1 HVAC air filter',
        unitCost: 8.00,
        markupPercent: 50.00,
        isTaxable: true,
        qtyOnHand: 50,
        reorderPoint: 10,
      },
    }),
    prisma.material.upsert({
      where: { id: 'mat-refrigerant' },
      update: {},
      create: {
        id: 'mat-refrigerant',
        tenantId: tenant.id,
        categoryId: materialCategory.id,
        sku: 'MAT-002',
        name: 'Refrigerant R-410A',
        description: 'AC refrigerant per pound',
        unitCost: 25.00,
        markupPercent: 60.00,
        unitOfMeasure: 'LB',
        isTaxable: true,
        qtyOnHand: 100,
        reorderPoint: 20,
      },
    }),
  ]);
  console.log(`✅ Created ${materials.length} materials`);

  // Create demo customers with addresses
  const customersData = [
    { firstName: 'John', lastName: 'Smith', email: 'john.smith@example.com', phone: '555-1001', street: '123 Main Street', city: 'Springfield', state: 'IL', zip: '62701', notes: 'Preferred customer - VIP service' },
    { firstName: 'Emily', lastName: 'Davis', email: 'emily.davis@example.com', phone: '555-1002', street: '456 Oak Avenue', city: 'Springfield', state: 'IL', zip: '62702' },
    { firstName: 'Robert', lastName: 'Brown', email: 'robert.brown@example.com', phone: '555-1003', street: '789 Pine Road', city: 'Riverside', state: 'IL', zip: '60546', notes: 'Commercial account', type: 'COMMERCIAL' as const },
    { firstName: 'Jennifer', lastName: 'Wilson', email: 'jennifer.wilson@example.com', phone: '555-1004', street: '321 Elm Street', city: 'Aurora', state: 'IL', zip: '60505' },
    { firstName: 'Michael', lastName: 'Taylor', email: 'michael.taylor@example.com', phone: '555-1005', street: '654 Maple Drive', city: 'Naperville', state: 'IL', zip: '60540', notes: 'New customer' },
    { firstName: 'Sarah', lastName: 'Martinez', email: 'sarah.martinez@example.com', phone: '555-1006', street: '890 Birch Lane', city: 'Joliet', state: 'IL', zip: '60431', notes: 'Property manager' },
    { firstName: 'David', lastName: 'Anderson', email: 'david.anderson@example.com', phone: '555-1007', street: '234 Cedar Court', city: 'Schaumburg', state: 'IL', zip: '60173' },
    { firstName: 'Lisa', lastName: 'Thompson', email: 'lisa.thompson@example.com', phone: '555-1008', street: '567 Willow Way', city: 'Evanston', state: 'IL', zip: '60201', notes: 'Monthly maintenance contract' },
    { firstName: 'James', lastName: 'Garcia', email: 'james.garcia@example.com', phone: '555-1009', street: '901 Spruce Street', city: 'Oak Park', state: 'IL', zip: '60302' },
    { firstName: 'Patricia', lastName: 'Rodriguez', email: 'patricia.rodriguez@example.com', phone: '555-1010', street: '1234 Ash Boulevard', city: 'Skokie', state: 'IL', zip: '60076', notes: 'Prefers afternoon appointments' },
  ];

  const customers = [];
  for (let i = 0; i < customersData.length; i++) {
    const data = customersData[i];
    const customer = await prisma.customer.upsert({
      where: { id: `customer-${i + 1}` },
      update: {},
      create: {
        id: `customer-${i + 1}`,
        tenantId: tenant.id,
        customerNumber: `CUST-${String(i + 1).padStart(6, '0')}`,
        type: data.type || 'RESIDENTIAL',
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        mobilePhone: data.phone,
        notes: data.notes,
        createdById: adminUser.id,
        addresses: {
          create: {
            type: 'SERVICE',
            street: data.street,
            city: data.city,
            state: data.state,
            zip: data.zip,
            country: 'US',
            isPrimary: true,
          },
        },
      },
      include: { addresses: true },
    });
    customers.push(customer);
  }
  console.log(`✅ Created ${customers.length} customers with addresses`);

  // Create demo jobs
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(10, 0, 0, 0);

  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        tenantId: tenant.id,
        jobNumber: 'JOB-000001',
        customerId: customers[0].id,
        addressId: customers[0].addresses[0].id,
        jobTypeId: jobTypes[2].id, // Maintenance
        title: 'HVAC System Maintenance',
        description: 'Annual HVAC system inspection and cleaning',
        status: 'SCHEDULED',
        priority: 'NORMAL',
        source: 'MANUAL',
        scheduledStart: tomorrow,
        scheduledEnd: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
        estimatedDuration: 120,
        createdById: adminUser.id,
        assignments: {
          create: {
            employeeId: employee1.id,
            role: 'PRIMARY',
          },
        },
      },
    }),
    prisma.job.create({
      data: {
        tenantId: tenant.id,
        jobNumber: 'JOB-000002',
        customerId: customers[1].id,
        addressId: customers[1].addresses[0].id,
        jobTypeId: jobTypes[0].id, // Repair
        title: 'Plumbing Repair',
        description: 'Fix leaking kitchen faucet',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        source: 'PHONE',
        scheduledStart: new Date(),
        actualStart: new Date(),
        estimatedDuration: 60,
        createdById: adminUser.id,
        assignments: {
          create: {
            employeeId: employee2.id,
            role: 'PRIMARY',
          },
        },
      },
    }),
    prisma.job.create({
      data: {
        tenantId: tenant.id,
        jobNumber: 'JOB-000003',
        customerId: customers[2].id,
        addressId: customers[2].addresses[0].id,
        jobTypeId: jobTypes[3].id, // Emergency
        title: 'Electrical Inspection',
        description: 'Complete electrical system inspection for commercial building',
        status: 'SCHEDULED',
        priority: 'EMERGENCY',
        source: 'MANUAL',
        scheduledStart: nextWeek,
        scheduledEnd: new Date(nextWeek.getTime() + 4 * 60 * 60 * 1000),
        estimatedDuration: 240,
        createdById: adminUser.id,
        assignments: {
          create: [
            { employeeId: employee1.id, role: 'PRIMARY' },
            { employeeId: employee2.id, role: 'SECONDARY' },
          ],
        },
      },
    }),
    prisma.job.create({
      data: {
        tenantId: tenant.id,
        jobNumber: 'JOB-000004',
        customerId: customers[3].id,
        addressId: customers[3].addresses[0].id,
        jobTypeId: jobTypes[1].id, // Installation
        title: 'Water Heater Installation',
        description: 'Install new 50-gallon water heater',
        status: 'COMPLETED',
        priority: 'NORMAL',
        source: 'MANUAL',
        scheduledStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        actualStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        actualEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 3.5 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 3.5 * 60 * 60 * 1000),
        estimatedDuration: 180,
        subtotal: 850.00,
        taxAmount: 68.00,
        total: 918.00,
        createdById: adminUser.id,
        assignments: {
          create: {
            employeeId: employee2.id,
            role: 'PRIMARY',
          },
        },
        lineItems: {
          create: [
            {
              type: 'MATERIAL',
              name: '50-gallon water heater',
              quantity: 1,
              unitPrice: 650.00,
              unitCost: 450.00,
              isTaxable: true,
              sortOrder: 1,
            },
            {
              type: 'LABOR',
              name: 'Installation labor',
              description: '3.5 hours',
              quantity: 3.5,
              unitPrice: 50.00,
              unitCost: 35.00,
              isTaxable: true,
              sortOrder: 2,
            },
            {
              type: 'MATERIAL',
              name: 'Copper piping and fittings',
              quantity: 1,
              unitPrice: 25.00,
              unitCost: 15.00,
              isTaxable: true,
              sortOrder: 3,
            },
          ],
        },
      },
    }),
    prisma.job.create({
      data: {
        tenantId: tenant.id,
        jobNumber: 'JOB-000005',
        customerId: customers[4].id,
        addressId: customers[4].addresses[0].id,
        jobTypeId: jobTypes[0].id, // Repair
        title: 'AC Unit Repair',
        description: 'Diagnose and repair AC not cooling properly',
        status: 'ON_HOLD',
        priority: 'HIGH',
        source: 'ONLINE_BOOKING',
        scheduledStart: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        estimatedDuration: 90,
        internalNotes: 'Waiting for parts to arrive',
        createdById: adminUser.id,
      },
    }),
  ]);
  console.log(`✅ Created ${jobs.length} jobs`);

  // Create invoice for completed job
  const invoice = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      invoiceNumber: 'INV-000001',
      customerId: customers[3].id,
      jobId: jobs[3].id,
      status: 'SENT',
      issueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000),
      terms: 'NET_30',
      subtotal: 850.00,
      taxRate: 8.00,
      taxAmount: 68.00,
      total: 918.00,
      sentAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      createdById: adminUser.id,
      lineItems: {
        create: [
          {
            type: 'MATERIAL',
            name: '50-gallon water heater',
            quantity: 1,
            unitPrice: 650.00,
            isTaxable: true,
            sortOrder: 1,
          },
          {
            type: 'LABOR',
            name: 'Installation labor (3.5 hours)',
            quantity: 3.5,
            unitPrice: 50.00,
            isTaxable: true,
            sortOrder: 2,
          },
          {
            type: 'MATERIAL',
            name: 'Copper piping and fittings',
            quantity: 1,
            unitPrice: 25.00,
            isTaxable: true,
            sortOrder: 3,
          },
        ],
      },
    },
  });
  console.log('✅ Created invoice:', invoice.invoiceNumber);

  // Create checklist template
  const checklistTemplate = await prisma.checklistTemplate.create({
    data: {
      tenantId: tenant.id,
      name: 'HVAC Maintenance Checklist',
      description: 'Standard checklist for HVAC maintenance visits',
      category: 'HVAC',
      isRequiredForCompletion: true,
      items: {
        create: [
          { label: 'Check thermostat operation', valueType: 'BOOLEAN', isRequired: true, sortOrder: 1 },
          { label: 'Inspect air filter', valueType: 'STOPLIGHT', isRequired: true, sortOrder: 2 },
          { label: 'Check refrigerant levels', valueType: 'BOOLEAN', isRequired: true, sortOrder: 3 },
          { label: 'Inspect electrical connections', valueType: 'BOOLEAN', isRequired: true, sortOrder: 4 },
          { label: 'Clean condenser coils', valueType: 'BOOLEAN', sortOrder: 5 },
          { label: 'Test system operation', valueType: 'BOOLEAN', isRequired: true, sortOrder: 6 },
          { label: 'Customer notes', valueType: 'TEXT', sortOrder: 7 },
          { label: 'Before photo', valueType: 'PHOTO', sortOrder: 8 },
          { label: 'After photo', valueType: 'PHOTO', sortOrder: 9 },
          { label: 'Customer signature', valueType: 'SIGNATURE', isRequired: true, sortOrder: 10 },
        ],
      },
    },
  });
  console.log('✅ Created checklist template');

  // Create message templates
  await prisma.messageTemplate.createMany({
    data: [
      {
        tenantId: tenant.id,
        name: 'Appointment Confirmation',
        channel: 'SMS',
        triggerType: 'JOB_SCHEDULED',
        body: 'Hi {{customer.firstName}}, your appointment is confirmed for {{job.scheduledStart}}. Reply STOP to unsubscribe.',
        variables: JSON.stringify(['customer.firstName', 'job.scheduledStart']),
      },
      {
        tenantId: tenant.id,
        name: 'Tech En Route',
        channel: 'SMS',
        triggerType: 'TECH_EN_ROUTE',
        body: 'Hi {{customer.firstName}}, {{technician.firstName}} is on the way! ETA: {{eta}}',
        variables: JSON.stringify(['customer.firstName', 'technician.firstName', 'eta']),
      },
      {
        tenantId: tenant.id,
        name: 'Invoice Sent',
        channel: 'EMAIL',
        triggerType: 'INVOICE_SENT',
        subject: 'Invoice #{{invoice.number}} from FieldSmartPro',
        body: 'Hi {{customer.firstName}},\n\nPlease find attached invoice #{{invoice.number}} for {{invoice.total}}.\n\nThank you for your business!',
        variables: JSON.stringify(['customer.firstName', 'invoice.number', 'invoice.total']),
      },
    ],
  });
  console.log('✅ Created message templates');

  // ============================================================================
  // PRICEBOOK SYSTEM - Industry Templates
  // ============================================================================
  console.log('\n📚 Seeding pricebook industries...');

  // Create Pricebook Industries
  const hvacIndustry = await prisma.pricebookIndustry.upsert({
    where: { slug: 'hvac' },
    update: {},
    create: {
      name: 'HVAC',
      slug: 'hvac',
      description: 'Heating, Ventilation, and Air Conditioning services',
      icon: '❄️',
      isActive: true,
    },
  });

  const plumbingIndustry = await prisma.pricebookIndustry.upsert({
    where: { slug: 'plumbing' },
    update: {},
    create: {
      name: 'Plumbing',
      slug: 'plumbing',
      description: 'Residential and commercial plumbing services',
      icon: '🔧',
      isActive: true,
    },
  });

  const electricalIndustry = await prisma.pricebookIndustry.upsert({
    where: { slug: 'electrical' },
    update: {},
    create: {
      name: 'Electrical',
      slug: 'electrical',
      description: 'Electrical installation and repair services',
      icon: '⚡',
      isActive: true,
    },
  });

  const landscapingIndustry = await prisma.pricebookIndustry.upsert({
    where: { slug: 'landscaping' },
    update: {},
    create: {
      name: 'Landscaping',
      slug: 'landscaping',
      description: 'Lawn care and landscape maintenance',
      icon: '🌿',
      isActive: true,
    },
  });

  const cleaningIndustry = await prisma.pricebookIndustry.upsert({
    where: { slug: 'cleaning' },
    update: {},
    create: {
      name: 'Cleaning',
      slug: 'cleaning',
      description: 'Residential and commercial cleaning services',
      icon: '🧹',
      isActive: true,
    },
  });

  console.log('✅ Created 5 pricebook industries');

  // HVAC Categories
  const hvacInstallCategory = await prisma.pricebookCategory.upsert({
    where: { id: 'pcat-hvac-install' },
    update: {},
    create: {
      id: 'pcat-hvac-install',
      pricebookIndustryId: hvacIndustry.id,
      name: 'Installation',
      description: 'HVAC system installation services',
      orderIndex: 1,
    },
  });

  const hvacRepairCategory = await prisma.pricebookCategory.upsert({
    where: { id: 'pcat-hvac-repair' },
    update: {},
    create: {
      id: 'pcat-hvac-repair',
      pricebookIndustryId: hvacIndustry.id,
      name: 'Repair & Service',
      description: 'HVAC repair and maintenance services',
      orderIndex: 2,
    },
  });

  const hvacMaintenanceCategory = await prisma.pricebookCategory.upsert({
    where: { id: 'pcat-hvac-maintenance' },
    update: {},
    create: {
      id: 'pcat-hvac-maintenance',
      pricebookIndustryId: hvacIndustry.id,
      name: 'Preventive Maintenance',
      description: 'Regular maintenance and tune-ups',
      orderIndex: 3,
    },
  });

  // Plumbing Categories
  const plumbingInstallCategory = await prisma.pricebookCategory.upsert({
    where: { id: 'pcat-plumbing-install' },
    update: {},
    create: {
      id: 'pcat-plumbing-install',
      pricebookIndustryId: plumbingIndustry.id,
      name: 'Installation',
      description: 'Plumbing installation services',
      orderIndex: 1,
    },
  });

  const plumbingRepairCategory = await prisma.pricebookCategory.upsert({
    where: { id: 'pcat-plumbing-repair' },
    update: {},
    create: {
      id: 'pcat-plumbing-repair',
      pricebookIndustryId: plumbingIndustry.id,
      name: 'Repair & Service',
      description: 'Plumbing repair services',
      orderIndex: 2,
    },
  });

  // Electrical Categories
  const electricalInstallCategory = await prisma.pricebookCategory.upsert({
    where: { id: 'pcat-electrical-install' },
    update: {},
    create: {
      id: 'pcat-electrical-install',
      pricebookIndustryId: electricalIndustry.id,
      name: 'Installation',
      description: 'Electrical installation services',
      orderIndex: 1,
    },
  });

  const electricalRepairCategory = await prisma.pricebookCategory.upsert({
    where: { id: 'pcat-electrical-repair' },
    update: {},
    create: {
      id: 'pcat-electrical-repair',
      pricebookIndustryId: electricalIndustry.id,
      name: 'Repair & Service',
      description: 'Electrical repair services',
      orderIndex: 2,
    },
  });

  console.log('✅ Created pricebook categories');

  // HVAC Services
  await prisma.pricebookService.upsert({
    where: { id: 'psvc-hvac-ac-install' },
    update: {},
    create: {
      id: 'psvc-hvac-ac-install',
      pricebookCategoryId: hvacInstallCategory.id,
      name: 'Central AC Installation - Standard',
      description: 'Install new central air conditioning system (up to 3 tons)',
      sku: 'HVAC-INST-001',
      unitPrice: 3500.00,
      unitCost: 2200.00,
      estimatedDuration: 480,
      orderIndex: 1,
    },
  });

  await prisma.pricebookService.upsert({
    where: { id: 'psvc-hvac-furnace-install' },
    update: {},
    create: {
      id: 'psvc-hvac-furnace-install',
      pricebookCategoryId: hvacInstallCategory.id,
      name: 'Furnace Installation - Standard',
      description: 'Install new gas furnace (up to 100,000 BTU)',
      sku: 'HVAC-INST-002',
      unitPrice: 2800.00,
      unitCost: 1800.00,
      estimatedDuration: 360,
      orderIndex: 2,
    },
  });

  await prisma.pricebookService.upsert({
    where: { id: 'psvc-hvac-ac-repair' },
    update: {},
    create: {
      id: 'psvc-hvac-ac-repair',
      pricebookCategoryId: hvacRepairCategory.id,
      name: 'AC Repair - Diagnostic & Fix',
      description: 'Diagnose and repair AC not cooling',
      sku: 'HVAC-REP-001',
      unitPrice: 150.00,
      unitCost: 50.00,
      estimatedDuration: 90,
      orderIndex: 1,
    },
  });

  await prisma.pricebookService.upsert({
    where: { id: 'psvc-hvac-tune-up' },
    update: {},
    create: {
      id: 'psvc-hvac-tune-up',
      pricebookCategoryId: hvacMaintenanceCategory.id,
      name: 'HVAC Tune-Up Package',
      description: 'Complete system inspection, cleaning, and tune-up',
      sku: 'HVAC-MAINT-001',
      unitPrice: 125.00,
      unitCost: 40.00,
      estimatedDuration: 60,
      orderIndex: 1,
    },
  });

  // Plumbing Services
  await prisma.pricebookService.upsert({
    where: { id: 'psvc-plumbing-water-heater' },
    update: {},
    create: {
      id: 'psvc-plumbing-water-heater',
      pricebookCategoryId: plumbingInstallCategory.id,
      name: 'Water Heater Installation - 50 Gallon',
      description: 'Install new 50-gallon gas water heater',
      sku: 'PLUMB-INST-001',
      unitPrice: 850.00,
      unitCost: 550.00,
      estimatedDuration: 180,
      orderIndex: 1,
    },
  });

  await prisma.pricebookService.upsert({
    where: { id: 'psvc-plumbing-faucet-repair' },
    update: {},
    create: {
      id: 'psvc-plumbing-faucet-repair',
      pricebookCategoryId: plumbingRepairCategory.id,
      name: 'Faucet Repair',
      description: 'Repair leaking kitchen or bathroom faucet',
      sku: 'PLUMB-REP-001',
      unitPrice: 100.00,
      unitCost: 30.00,
      estimatedDuration: 60,
      orderIndex: 1,
    },
  });

  await prisma.pricebookService.upsert({
    where: { id: 'psvc-plumbing-drain-cleaning' },
    update: {},
    create: {
      id: 'psvc-plumbing-drain-cleaning',
      pricebookCategoryId: plumbingRepairCategory.id,
      name: 'Drain Cleaning - Standard',
      description: 'Clear clogged drain (sink, tub, or shower)',
      sku: 'PLUMB-REP-002',
      unitPrice: 125.00,
      unitCost: 35.00,
      estimatedDuration: 45,
      orderIndex: 2,
    },
  });

  // Electrical Services
  await prisma.pricebookService.upsert({
    where: { id: 'psvc-electrical-outlet-install' },
    update: {},
    create: {
      id: 'psvc-electrical-outlet-install',
      pricebookCategoryId: electricalInstallCategory.id,
      name: 'Outlet Installation - Standard',
      description: 'Install new electrical outlet',
      sku: 'ELEC-INST-001',
      unitPrice: 85.00,
      unitCost: 25.00,
      estimatedDuration: 30,
      orderIndex: 1,
    },
  });

  await prisma.pricebookService.upsert({
    where: { id: 'psvc-electrical-panel-upgrade' },
    update: {},
    create: {
      id: 'psvc-electrical-panel-upgrade',
      pricebookCategoryId: electricalInstallCategory.id,
      name: 'Electrical Panel Upgrade - 200 Amp',
      description: 'Upgrade to 200 amp service panel',
      sku: 'ELEC-INST-002',
      unitPrice: 1800.00,
      unitCost: 1200.00,
      estimatedDuration: 480,
      orderIndex: 2,
    },
  });

  await prisma.pricebookService.upsert({
    where: { id: 'psvc-electrical-troubleshoot' },
    update: {},
    create: {
      id: 'psvc-electrical-troubleshoot',
      pricebookCategoryId: electricalRepairCategory.id,
      name: 'Electrical Troubleshooting',
      description: 'Diagnose electrical issues',
      sku: 'ELEC-REP-001',
      unitPrice: 95.00,
      unitCost: 30.00,
      estimatedDuration: 60,
      orderIndex: 1,
    },
  });

  console.log('✅ Created pricebook services');

  // Service Materials
  await prisma.pricebookServiceMaterial.upsert({
    where: { id: 'pmat-ac-install-unit' },
    update: {},
    create: {
      id: 'pmat-ac-install-unit',
      pricebookServiceId: 'psvc-hvac-ac-install',
      name: '3-Ton AC Unit',
      description: 'Central air conditioning unit',
      quantity: 1,
      unitCost: 1500.00,
      isOptional: false,
    },
  });

  await prisma.pricebookServiceMaterial.upsert({
    where: { id: 'pmat-ac-install-refrigerant' },
    update: {},
    create: {
      id: 'pmat-ac-install-refrigerant',
      pricebookServiceId: 'psvc-hvac-ac-install',
      name: 'Refrigerant R-410A',
      description: 'AC refrigerant',
      quantity: 10,
      unitCost: 25.00,
      isOptional: false,
    },
  });

  await prisma.pricebookServiceMaterial.upsert({
    where: { id: 'pmat-water-heater-unit' },
    update: {},
    create: {
      id: 'pmat-water-heater-unit',
      pricebookServiceId: 'psvc-plumbing-water-heater',
      name: '50-Gallon Water Heater',
      description: 'Gas water heater',
      quantity: 1,
      unitCost: 450.00,
      isOptional: false,
    },
  });

  await prisma.pricebookServiceMaterial.upsert({
    where: { id: 'pmat-water-heater-fittings' },
    update: {},
    create: {
      id: 'pmat-water-heater-fittings',
      pricebookServiceId: 'psvc-plumbing-water-heater',
      name: 'Copper Piping and Fittings',
      description: 'Installation materials',
      quantity: 1,
      unitCost: 50.00,
      isOptional: false,
    },
  });

  console.log('✅ Created pricebook service materials');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log('\n   Tenant Data:');
  console.log(`   - 1 Tenant: ${tenant.name}`);
  console.log(`   - 3 Users (1 admin, 2 technicians)`);
  console.log(`   - 2 Employees`);
  console.log(`   - ${jobTypes.length} Job Types`);
  console.log(`   - ${services.length} Services`);
  console.log(`   - ${materials.length} Materials`);
  console.log(`   - ${customers.length} Customers with addresses`);
  console.log(`   - ${jobs.length} Jobs`);
  console.log(`   - 1 Invoice`);
  console.log(`   - 1 Checklist Template`);
  console.log(`   - 3 Message Templates`);
  console.log('\n   Pricebook Data (Industry Templates):');
  console.log(`   - 5 Industries (HVAC, Plumbing, Electrical, Landscaping, Cleaning)`);
  console.log(`   - 7 Categories`);
  console.log(`   - 10 Services`);
  console.log(`   - 4 Service Materials`);
  console.log('\n🔑 Demo Credentials:');
  console.log(`   - Admin: admin@fieldsmartpro.local`);
  console.log(`   - Tech 1: mike@fieldsmartpro.local`);
  console.log(`   - Tech 2: sarah@fieldsmartpro.local`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });

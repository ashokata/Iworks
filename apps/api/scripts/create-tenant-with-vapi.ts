/**
 * Create New Tenant and Provision with VAPI
 * 
 * This script:
 * 1. Creates a new tenant in the database
 * 2. Provisions VAPI resources (assistant + phone number)
 * 3. Uses VAPI's built-in phone numbers (not Twilio)
 */

import { PrismaClient } from '@prisma/client';
import { VapiProvisioningService } from '../src/services/vapi/vapi.provisioning';

const prisma = new PrismaClient();

interface TenantInput {
  name: string;
  slug: string;
  industrySlug?: string;
  timezone?: string;
  areaCode?: string;
  appointmentBookingEnabled?: boolean;
  notificationEmail?: string;
}

async function createTenantWithVAPI(input: TenantInput) {
  console.log('\n🚀 Creating new tenant with VAPI provisioning...\n');

  try {
    // 1. Create or get industry
    let industryId: string | undefined;
    if (input.industrySlug) {
      const industry = await prisma.industry.findUnique({
        where: { slug: input.industrySlug },
      });
      if (industry) {
        industryId = industry.id;
        console.log(`✅ Using industry: ${industry.name}`);
      } else {
        console.log(`⚠️  Industry '${input.industrySlug}' not found. Creating without industry.`);
      }
    }

    // 2. Check if tenant already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: input.slug },
    });

    if (existingTenant) {
      console.log(`⚠️  Tenant with slug '${input.slug}' already exists.`);
      console.log('   Using existing tenant for VAPI provisioning...\n');
      
      // Provision VAPI for existing tenant
      const provisioningService = new VapiProvisioningService();
      const result = await provisioningService.provisionTenant({
        tenantId: existingTenant.id,
        companyName: existingTenant.name,
        industry: input.industrySlug,
        areaCode: input.areaCode,
        features: {
          appointmentBooking: input.appointmentBookingEnabled || false,
        },
        notifications: input.notificationEmail
          ? { email: [input.notificationEmail] }
          : undefined,
      });

      if (result.success) {
        console.log('\n✅ VAPI Provisioning Complete!\n');
        console.log('📋 Summary:');
        console.log(`   Tenant ID: ${existingTenant.id}`);
        console.log(`   Tenant Name: ${existingTenant.name}`);
        console.log(`   Phone Number: ${result.phoneNumber || 'Not assigned'}`);
        console.log(`   Assistant ID: ${result.assistantId}`);
        console.log(`   Webhook URL: ${result.webhookUrl}`);
        return;
      } else {
        console.error(`❌ VAPI Provisioning failed: ${result.error}`);
        process.exit(1);
      }
    }

    // 3. Create new tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: input.name,
        slug: input.slug,
        status: 'ACTIVE',
        industryId,
        timezone: input.timezone || 'America/New_York',
        locale: 'en-US',
        currency: 'USD',
      },
    });

    console.log(`✅ Created tenant: ${tenant.name} (${tenant.id})\n`);

    // 4. Provision VAPI resources
    console.log('📞 Provisioning VAPI resources...\n');
    const provisioningService = new VapiProvisioningService();
    const result = await provisioningService.provisionTenant({
      tenantId: tenant.id,
      companyName: tenant.name,
      industry: input.industrySlug,
      areaCode: input.areaCode,
      features: {
        appointmentBooking: input.appointmentBookingEnabled || false,
      },
      notifications: input.notificationEmail
        ? { email: [input.notificationEmail] }
        : undefined,
    });

    if (!result.success) {
      console.error(`❌ VAPI Provisioning failed: ${result.error}`);
      console.error('   Tenant was created but VAPI provisioning failed.');
      console.error('   You can retry provisioning later using the VAPI admin API.');
      process.exit(1);
    }

    // 5. Display results
    console.log('\n✅ Tenant Created and VAPI Provisioned Successfully!\n');
    console.log('📋 Summary:');
    console.log(`   Tenant ID: ${tenant.id}`);
    console.log(`   Tenant Name: ${tenant.name}`);
    console.log(`   Tenant Slug: ${tenant.slug}`);
    console.log(`   Phone Number: ${result.phoneNumber || 'Not assigned'}`);
    console.log(`   Assistant ID: ${result.assistantId}`);
    console.log(`   Webhook URL: ${result.webhookUrl}`);
    console.log('\n🎉 Your tenant is ready to receive calls!\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  // Get input from command line arguments or use defaults
  const args = process.argv.slice(2);
  
  // Parse arguments (simple key=value format)
  const input: TenantInput = {
    name: 'New Company',
    slug: `tenant-${Date.now()}`,
    timezone: 'America/New_York',
    appointmentBookingEnabled: false,
  };

  for (const arg of args) {
    const [key, value] = arg.split('=');
    switch (key) {
      case 'name':
        input.name = value;
        break;
      case 'slug':
        input.slug = value;
        break;
      case 'industry':
        input.industrySlug = value;
        break;
      case 'timezone':
        input.timezone = value;
        break;
      case 'areaCode':
        input.areaCode = value;
        break;
      case 'appointmentBooking':
        input.appointmentBookingEnabled = value === 'true';
        break;
      case 'notificationEmail':
        input.notificationEmail = value;
        break;
    }
  }

  // If no arguments provided, show usage
  if (args.length === 0) {
    console.log(`
Usage: npm run create-tenant-with-vapi -- [options]

Options:
  name=<company-name>              Company/tenant name (required)
  slug=<tenant-slug>               Unique tenant slug (required)
  industry=<industry-slug>          Industry slug (optional, e.g., 'hvac')
  timezone=<timezone>              Timezone (optional, default: America/New_York)
  areaCode=<area-code>             Area code for phone number (optional, e.g., '850')
  appointmentBooking=true|false    Enable appointment booking (optional, default: false)
  notificationEmail=<email>         Email for notifications (optional)

Examples:
  npm run create-tenant-with-vapi -- name="AC Repair Co" slug="ac-repair-co" industry="hvac" areaCode="850"
  npm run create-tenant-with-vapi -- name="Plumbing Pro" slug="plumbing-pro" industry="hvac" appointmentBooking=true

Note: This script uses VAPI's built-in phone numbers (not Twilio).
    `);
    process.exit(0);
  }

  // Validate required fields
  if (!input.name || !input.slug) {
    console.error('❌ Error: name and slug are required');
    console.error('   Example: npm run create-tenant-with-vapi -- name="My Company" slug="my-company"');
    process.exit(1);
  }

  await createTenantWithVAPI(input);
}

main();




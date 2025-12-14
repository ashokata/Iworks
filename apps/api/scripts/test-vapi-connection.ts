/**
 * VAPI Connection Test Script
 * Tests the VAPI API connection and basic operations
 * 
 * Usage:
 *   npx ts-node scripts/test-vapi-connection.ts
 */

import axios from 'axios';

const VAPI_API_KEY = process.env.VAPI_API_KEY || '';
const VAPI_BASE_URL = 'https://api.vapi.ai';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  details?: any;
  error?: string;
}

const results: TestResult[] = [];

async function testConnection(): Promise<void> {
  console.log('\n🔌 Testing VAPI API Connection...\n');
  console.log('━'.repeat(60));

  if (!VAPI_API_KEY) {
    console.error('❌ VAPI_API_KEY environment variable is not set!');
    console.log('\nSet it with:');
    console.log('  $env:VAPI_API_KEY="your-private-key"  # PowerShell');
    console.log('  export VAPI_API_KEY="your-private-key"  # Bash');
    process.exit(1);
  }

  const client = axios.create({
    baseURL: VAPI_BASE_URL,
    headers: {
      'Authorization': `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  // Test 1: List Assistants
  console.log('\n📋 Test 1: List Assistants');
  try {
    const response = await client.get('/assistant', { params: { limit: 5 } });
    const assistants = response.data;
    results.push({
      test: 'List Assistants',
      status: 'PASS',
      details: {
        count: assistants.length,
        assistants: assistants.map((a: any) => ({ id: a.id, name: a.name })),
      },
    });
    console.log(`   ✅ Success! Found ${assistants.length} assistant(s)`);
    if (assistants.length > 0) {
      assistants.slice(0, 3).forEach((a: any) => {
        console.log(`      - ${a.name} (${a.id})`);
      });
    }
  } catch (error: any) {
    results.push({
      test: 'List Assistants',
      status: 'FAIL',
      error: error.response?.data?.message || error.message,
    });
    console.log(`   ❌ Failed: ${error.response?.data?.message || error.message}`);
  }

  // Test 2: List Phone Numbers
  console.log('\n📞 Test 2: List Phone Numbers');
  try {
    const response = await client.get('/phone-number', { params: { limit: 5 } });
    const phoneNumbers = response.data;
    results.push({
      test: 'List Phone Numbers',
      status: 'PASS',
      details: {
        count: phoneNumbers.length,
        numbers: phoneNumbers.map((p: any) => ({ id: p.id, number: p.number })),
      },
    });
    console.log(`   ✅ Success! Found ${phoneNumbers.length} phone number(s)`);
    if (phoneNumbers.length > 0) {
      phoneNumbers.slice(0, 3).forEach((p: any) => {
        console.log(`      - ${p.number} (${p.id})`);
      });
    }
  } catch (error: any) {
    results.push({
      test: 'List Phone Numbers',
      status: 'FAIL',
      error: error.response?.data?.message || error.message,
    });
    console.log(`   ❌ Failed: ${error.response?.data?.message || error.message}`);
  }

  // Test 3: List Recent Calls
  console.log('\n📊 Test 3: List Recent Calls');
  try {
    const response = await client.get('/call', { params: { limit: 5 } });
    const calls = response.data;
    results.push({
      test: 'List Calls',
      status: 'PASS',
      details: {
        count: calls.length,
      },
    });
    console.log(`   ✅ Success! Found ${calls.length} call(s)`);
  } catch (error: any) {
    results.push({
      test: 'List Calls',
      status: 'FAIL',
      error: error.response?.data?.message || error.message,
    });
    console.log(`   ❌ Failed: ${error.response?.data?.message || error.message}`);
  }

  // Test 4: Create Test Assistant (optional - will delete after)
  console.log('\n🤖 Test 4: Create & Delete Test Assistant');
  let testAssistantId: string | null = null;
  try {
    const createResponse = await client.post('/assistant', {
      name: 'FieldSmartPro Test Assistant - DELETE ME',
      model: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        systemPrompt: 'You are a test assistant. Say hello and confirm the test was successful.',
      },
      voice: {
        provider: 'vapi',
        voiceId: 'Paige', // Professional female voice
      },
      firstMessage: 'Hello! This is a test assistant from FieldSmartPro.',
      silenceTimeoutSeconds: 30,
      maxDurationSeconds: 60,
    });
    
    testAssistantId = createResponse.data.id;
    console.log(`   ✅ Created test assistant: ${testAssistantId}`);

    // Delete the test assistant
    await client.delete(`/assistant/${testAssistantId}`);
    console.log(`   ✅ Deleted test assistant`);

    results.push({
      test: 'Create/Delete Assistant',
      status: 'PASS',
      details: { assistantId: testAssistantId },
    });
  } catch (error: any) {
    results.push({
      test: 'Create/Delete Assistant',
      status: 'FAIL',
      error: error.response?.data?.message || error.message,
    });
    console.log(`   ❌ Failed: ${error.response?.data?.message || error.message}`);
    
    // Try to clean up if creation succeeded but delete failed
    if (testAssistantId) {
      try {
        await client.delete(`/assistant/${testAssistantId}`);
        console.log(`   🧹 Cleaned up test assistant`);
      } catch (e) {
        console.log(`   ⚠️ Could not clean up test assistant: ${testAssistantId}`);
      }
    }
  }

  // Test 5: Check Available Phone Numbers (don't purchase)
  console.log('\n🔍 Test 5: Check Phone Number Availability');
  try {
    // Just verify the endpoint is accessible
    const response = await client.get('/phone-number');
    results.push({
      test: 'Phone Number API Access',
      status: 'PASS',
    });
    console.log(`   ✅ Phone number API is accessible`);
    console.log(`   ℹ️  To purchase a number, use the provisioning API`);
  } catch (error: any) {
    results.push({
      test: 'Phone Number API Access',
      status: 'FAIL',
      error: error.response?.data?.message || error.message,
    });
    console.log(`   ❌ Failed: ${error.response?.data?.message || error.message}`);
  }

  // Summary
  console.log('\n' + '━'.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`   ${icon} ${r.test}: ${r.status}`);
    if (r.error) {
      console.log(`      Error: ${r.error}`);
    }
  });

  console.log(`\n   Total: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    console.log('🎉 All tests passed! VAPI integration is ready.\n');
    console.log('Next steps:');
    console.log('   1. Run Prisma migration: npx prisma migrate dev --name add-vapi');
    console.log('   2. Start the API server: npm run dev');
    console.log('   3. Provision a tenant: POST /api/tenants/{id}/vapi/provision');
    console.log('');
  } else {
    console.log('⚠️  Some tests failed. Check your API key and permissions.\n');
    process.exit(1);
  }
}

// Run tests
testConnection().catch(console.error);


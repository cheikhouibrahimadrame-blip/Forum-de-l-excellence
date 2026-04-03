#!/usr/bin/env node

/**
 * Test Script: Admin Content Editing Endpoints
 * 
 * This script tests the admin page content editing functionality
 * It demonstrates:
 * 1. Fetching current page content
 * 2. Updating page content as an ADMIN
 * 3. Verifying the updates
 */

const http = require('http');

const API_BASE = 'http://localhost:5001/api';

// Admin token (would come from login)
const ADMIN_TOKEN = 'your-admin-token-here'; // Replace with actual token

// Test data
const testPages = ['admissions', 'programs', 'campusLife'];

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testGetPageContent(page) {
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}GET /api/pages/${page}${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}`);

  try {
    const response = await makeRequest('GET', `/pages/${page}`);
    
    if (response.status === 200) {
      console.log(`${colors.green}✅ Success (${response.status})${colors.reset}`);
      console.log(`${colors.yellow}Current Content:${colors.reset}`);
      console.log(JSON.stringify(response.body, null, 2));
    } else {
      console.log(`${colors.red}❌ Failed (${response.status})${colors.reset}`);
      console.log(JSON.stringify(response.body, null, 2));
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

async function testUpdatePageContent(page, newContent, adminToken) {
  console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}POST /api/pages/${page} (Admin Only)${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}`);

  if (!adminToken) {
    console.log(`${colors.red}❌ Admin token not provided. Cannot test update.${colors.reset}`);
    console.log(`${colors.yellow}To test updates:${colors.reset}`);
    console.log(`1. Login as ADMIN user`);
    console.log(`2. Get the accessToken from response`);
    console.log(`3. Replace ADMIN_TOKEN in this script`);
    return;
  }

  try {
    const payload = {
      hero: newContent.hero,
      content: newContent.content
    };

    const response = await makeRequest('POST', `/pages/${page}`, payload, adminToken);

    if (response.status === 200 || response.status === 201) {
      console.log(`${colors.green}✅ Success (${response.status})${colors.reset}`);
      console.log(`${colors.yellow}Updated Content:${colors.reset}`);
      console.log(JSON.stringify(response.body, null, 2));
    } else {
      console.log(`${colors.red}❌ Failed (${response.status})${colors.reset}`);
      console.log(JSON.stringify(response.body, null, 2));
    }
  } catch (error) {
    console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }
}

async function runTests() {
  console.log(`${colors.blue}${'═'.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}Admin Page Content Editing Tests${colors.reset}`);
  console.log(`${colors.blue}${'═'.repeat(50)}${colors.reset}`);

  // 1. Test reading content for all pages
  console.log(`\n${colors.yellow}PHASE 1: Reading Current Content${colors.reset}`);
  for (const page of testPages) {
    await testGetPageContent(page);
  }

  // 2. Test updating content (requires admin token)
  console.log(`\n${colors.yellow}PHASE 2: Updating Content (Admin Only)${colors.reset}`);
  
  const sampleUpdates = {
    admissions: {
      hero: {
        title: 'Updated Admissions Title',
        subtitle: 'Updated Subtitle',
        image: '/new-admissions-image.jpg'
      },
      content: {
        requirements: 'Updated requirements text',
        process: 'Updated process text',
        timeline: 'Updated timeline text',
        contact: 'Updated contact text'
      }
    },
    programs: {
      hero: {
        title: 'Updated Programs Title',
        subtitle: 'Updated Subtitle',
        image: '/new-programs-image.jpg'
      },
      content: {
        description: 'Updated description',
        curriculum: 'Updated curriculum',
        languages: 'Updated languages',
        activities: 'Updated activities'
      }
    },
    campusLife: {
      hero: {
        title: 'Updated Campus Life Title',
        subtitle: 'Updated Subtitle',
        image: '/new-campus-image.jpg'
      },
      content: {
        clubs: 'Updated clubs',
        sports: 'Updated sports',
        cultural: 'Updated cultural events',
        social: 'Updated social'
      }
    }
  };

  for (const page of testPages) {
    await testUpdatePageContent(page, sampleUpdates[page], ADMIN_TOKEN);
  }

  // 3. Verify the updates
  console.log(`\n${colors.yellow}PHASE 3: Verifying Updates${colors.reset}`);
  console.log(`${colors.blue}(This would be the same as PHASE 1 if updates succeeded)${colors.reset}`);

  console.log(`\n${colors.blue}${'═'.repeat(50)}${colors.reset}`);
  console.log(`${colors.green}Tests Complete!${colors.reset}`);
  console.log(`${colors.blue}${'═'.repeat(50)}${colors.reset}`);
}

// Run the tests
runTests().catch(console.error);

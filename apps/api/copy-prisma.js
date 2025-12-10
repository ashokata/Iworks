const fs = require('fs');
const path = require('path');

// Copy Prisma client to dist
const srcDir = path.join(__dirname, '../../node_modules/@prisma/client');
const destDir = path.join(__dirname, 'dist/node_modules/@prisma/client');

if (fs.existsSync(srcDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  
  // Copy the entire @prisma/client directory
  fs.cpSync(srcDir, destDir, { recursive: true });
  console.log('✅ Copied Prisma client to dist/');
} else {
  console.log('❌ Prisma client not found at:', srcDir);
}

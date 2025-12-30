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

// Copy ONLY Lambda-compatible files from .prisma directory
const dotPrismaClientDir = path.join(__dirname, '../../node_modules/.prisma/client');
const destDotPrismaClient = path.join(__dirname, 'dist/node_modules/.prisma/client');

if (fs.existsSync(dotPrismaClientDir)) {
  fs.mkdirSync(destDotPrismaClient, { recursive: true });

  // Only copy JS files, types, schema, and Linux query engine (not Windows binary)
  const files = fs.readdirSync(dotPrismaClientDir);
  files.forEach(file => {
    // Include JS, TS declarations, schema, and ONLY the Linux query engine
    if (
      file.endsWith('.js') ||
      file.endsWith('.d.ts') ||
      file === 'schema.prisma' ||
      file.includes('rhel-openssl') || // Linux binary for Lambda
      file.includes('debian-openssl') // Alternative Linux binary
    ) {
      const srcPath = path.join(dotPrismaClientDir, file);
      const destPath = path.join(destDotPrismaClient, file);

      if (fs.lstatSync(srcPath).isDirectory()) {
        fs.cpSync(srcPath, destPath, { recursive: true });
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  });
  console.log('✅ Copied .prisma/client files (Linux binaries only) to dist/');
} else {
  console.log('⚠️  .prisma/client directory not found');
}

// Copy schema.prisma
const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
const destSchema = path.join(__dirname, 'dist/prisma');

if (fs.existsSync(schemaPath)) {
  fs.mkdirSync(destSchema, { recursive: true });
  fs.copyFileSync(schemaPath, path.join(destSchema, 'schema.prisma'));
  console.log('✅ Copied schema.prisma to dist/');
} else {
  console.log('⚠️  schema.prisma not found');
}

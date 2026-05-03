const fs = require('fs');
const path = require('path');

const env = process.env.BUILD_ENV || 'dev';
const envFile = `.env.${env}`;
const targetFile = path.join(__dirname, '.env');

if (!fs.existsSync(envFile)) {
  console.error(`❌ Error: ${envFile} does not exist.`);
  process.exit(1);
}

fs.copyFileSync(envFile, targetFile);
console.log(`✅ Successfully set environment: ${envFile} → .env`);

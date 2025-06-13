#!/usr/bin/env node

/**
 * Publish script for advanced-json-memory-bank v1.0.0
 * Automates the publishing process with safety checks
 */

import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

const version = '1.0.0';
const packageName = 'advanced-json-memory-bank';

console.log(`🚀 Publishing ${packageName} v${version}`);

// Safety checks
try {
  // 1. Verify package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (packageJson.name !== packageName) {
    throw new Error(`Package name mismatch: expected ${packageName}, got ${packageJson.name}`);
  }
  if (packageJson.version !== version) {
    throw new Error(`Version mismatch: expected ${version}, got ${packageJson.version}`);
  }
  console.log('✅ Package.json verified');

  // 2. Build project
  console.log('🔨 Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful');

  // 3. Verify dist directory exists
  if (!fs.existsSync('dist')) {
    throw new Error('Dist directory not found after build');
  }
  console.log('✅ Dist directory verified');

  // 4. Check if already published
  try {
    const npmInfo = execSync(`npm view ${packageName}@${version}`, { encoding: 'utf8' });
    if (npmInfo.trim()) {
      console.log(`⚠️  Version ${version} already exists on NPM`);
      console.log('Use npm version patch/minor/major to bump version');
      process.exit(1);
    }
  } catch (error) {
    // Version doesn't exist, which is good for new publish
    console.log('✅ Version not yet published');
  }

  // 5. Publish to NPM
  console.log('📦 Publishing to NPM...');
  execSync('npm publish --access public', { stdio: 'inherit' });
  console.log('✅ Published successfully!');

  // 6. Verify publication
  console.log('🔍 Verifying publication...');
  setTimeout(() => {
    try {
      const publishedInfo = execSync(`npm view ${packageName}@${version}`, { encoding: 'utf8' });
      if (publishedInfo.includes(version)) {
        console.log('✅ Publication verified on NPM');
        console.log(`📋 Install with: npm install -g ${packageName}`);
      }
    } catch (error) {
      console.log('⚠️  Verification failed, but package may still be publishing...');
    }
  }, 5000);

} catch (error) {
  console.error('❌ Publish failed:', error.message);
  process.exit(1);
}
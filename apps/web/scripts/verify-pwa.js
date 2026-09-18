/**
 * PWA Verification Script
 * Run this in the browser console (F12) to verify PWA setup
 */

async function verifyPWA() {
  console.log('🔍 NexaCRM PWA Verification Starting...\n');
  
  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // 1. Check Service Worker
  console.log('1️⃣ Checking Service Worker...');
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        results.passed.push('✅ Service Worker registered');
        console.log('   ✅ Service Worker registered');
        console.log(`   📍 Scope: ${registration.scope}`);
        console.log(`   📊 State: ${registration.active ? registration.active.state : 'installing'}`);
      } else {
        results.failed.push('❌ Service Worker not registered');
        console.log('   ❌ Service Worker not registered');
      }
    } catch (error) {
      results.failed.push(`❌ Service Worker error: ${error.message}`);
      console.log(`   ❌ Error: ${error.message}`);
    }
  } else {
    results.failed.push('❌ Service Worker not supported');
    console.log('   ❌ Service Worker not supported in this browser');
  }

  // 2. Check Manifest
  console.log('\n2️⃣ Checking Manifest...');
  try {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      results.passed.push('✅ Manifest link found');
      console.log('   ✅ Manifest link found');
      console.log(`   📍 URL: ${manifestLink.href}`);
      
      const response = await fetch(manifestLink.href);
      if (response.ok) {
        const manifest = await response.json();
        results.passed.push('✅ Manifest loads successfully');
        console.log('   ✅ Manifest loads successfully');
        console.log(`   📱 Name: ${manifest.name}`);
        console.log(`   🎨 Theme: ${manifest.theme_color}`);
        console.log(`   🖼️  Icons: ${manifest.icons?.length || 0} configured`);
      } else {
        results.failed.push(`❌ Manifest failed to load: ${response.status}`);
        console.log(`   ❌ Manifest failed to load: ${response.status}`);
      }
    } else {
      results.failed.push('❌ Manifest link not found');
      console.log('   ❌ Manifest link not found in <head>');
    }
  } catch (error) {
    results.failed.push(`❌ Manifest error: ${error.message}`);
    console.log(`   ❌ Error: ${error.message}`);
  }

  // 3. Check Icons
  console.log('\n3️⃣ Checking Icons...');
  const iconPaths = [
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/icon-192x192-maskable.png',
    '/icons/icon-512x512-maskable.png',
    '/icons/apple-touch-icon.png',
    '/favicon.ico'
  ];

  for (const iconPath of iconPaths) {
    try {
      const response = await fetch(iconPath, { method: 'HEAD' });
      if (response.ok) {
        results.passed.push(`✅ ${iconPath}`);
        console.log(`   ✅ ${iconPath} (${response.headers.get('content-length')} bytes)`);
      } else {
        results.failed.push(`❌ ${iconPath} - ${response.status}`);
        console.log(`   ❌ ${iconPath} - ${response.status}`);
      }
    } catch (error) {
      results.failed.push(`❌ ${iconPath} - ${error.message}`);
      console.log(`   ❌ ${iconPath} - ${error.message}`);
    }
  }

  // 4. Check iOS Meta Tags
  console.log('\n4️⃣ Checking iOS Meta Tags...');
  const iosTags = [
    'apple-mobile-web-app-capable',
    'apple-mobile-web-app-status-bar-style',
    'apple-mobile-web-app-title'
  ];

  iosTags.forEach(name => {
    const meta = document.querySelector(`meta[name="${name}"]`);
    if (meta) {
      results.passed.push(`✅ iOS: ${name}`);
      console.log(`   ✅ ${name}: ${meta.content}`);
    } else {
      results.warnings.push(`⚠️  iOS: ${name} missing`);
      console.log(`   ⚠️  ${name} missing`);
    }
  });

  // 5. Check Install Prompt
  console.log('\n5️⃣ Checking Install Capability...');
  if (window.matchMedia('(display-mode: standalone)').matches) {
    results.passed.push('✅ Already installed (running standalone)');
    console.log('   ✅ Already installed (running in standalone mode)');
  } else {
    results.warnings.push('⚠️  Not installed yet');
    console.log('   ⚠️  Not installed yet (running in browser)');
    console.log('   💡 Look for install button in top nav or address bar');
  }

  // 6. Check Offline Support
  console.log('\n6️⃣ Checking Offline Support...');
  try {
    const response = await fetch('/offline', { method: 'HEAD' });
    if (response.ok) {
      results.passed.push('✅ Offline page exists');
      console.log('   ✅ Offline page exists');
    } else {
      results.failed.push('❌ Offline page missing');
      console.log('   ❌ Offline page missing');
    }
  } catch (error) {
    results.failed.push(`❌ Offline page error: ${error.message}`);
    console.log(`   ❌ Error: ${error.message}`);
  }

  // 7. Check HTTPS/Localhost
  console.log('\n7️⃣ Checking Security Context...');
  if (location.protocol === 'https:' || location.hostname === 'localhost') {
    results.passed.push('✅ Secure context');
    console.log('   ✅ Secure context (HTTPS or localhost)');
  } else {
    results.failed.push('❌ Insecure context (PWA requires HTTPS)');
    console.log('   ❌ Insecure context (PWA requires HTTPS or localhost)');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);
  
  if (results.failed.length === 0) {
    console.log('\n🎉 PWA IS FULLY FUNCTIONAL!');
    console.log('💡 Next steps:');
    console.log('   1. Click "Install App" button in top nav');
    console.log('   2. Or look for install icon in browser address bar');
    console.log('   3. Test offline: DevTools → Network → Offline checkbox');
  } else {
    console.log('\n❌ ISSUES FOUND:');
    results.failed.forEach(issue => console.log(`   ${issue}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    results.warnings.forEach(warning => console.log(`   ${warning}`));
  }

  console.log('\n' + '='.repeat(60));
  
  return {
    success: results.failed.length === 0,
    passed: results.passed.length,
    failed: results.failed.length,
    warnings: results.warnings.length,
    details: results
  };
}

// Run verification
verifyPWA().then(result => {
  console.log('\n✨ Verification complete!');
  console.log('📋 To see detailed manifest info: Chrome DevTools → Application → Manifest');
  console.log('🔧 To inspect service worker: Chrome DevTools → Application → Service Workers');
});

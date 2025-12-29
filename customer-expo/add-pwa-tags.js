const fs = require('fs');
const path = require('path');

const distDir = './dist';
const pwaMetaTags = `
<!-- PWA Meta Tags -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#EA2831">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Zeger Customer">
<link rel="apple-touch-icon" href="/favicon.ico">
<meta name="msapplication-TileColor" content="#EA2831">
<meta name="msapplication-config" content="/browserconfig.xml">
<meta name="mobile-web-app-capable" content="yes">
<meta name="application-name" content="Zeger Customer">
`;

const serviceWorkerScript = `
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('Zeger Customer SW registered: ', registration);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, notify user
              console.log('New content available, please refresh');
            }
          });
        });
      })
      .catch(function(registrationError) {
        console.log('SW registration failed: ', registrationError);
      });
  });
  
  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'SYNC_COMPLETE') {
      console.log('Offline sync completed:', event.data.syncedCount, 'items');
    }
  });
}
</script>
`;

// Function to add PWA tags to HTML file
function addPWAToHTML(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add PWA meta tags after the viewport meta tag
    content = content.replace(
      /<meta name="viewport"[^>]*>/,
      `$&${pwaMetaTags}`
    );
    
    // Add service worker script before closing body tag
    content = content.replace(
      /<\/body>/,
      `${serviceWorkerScript}</body>`
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Added PWA tags to: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Find all HTML files in dist directory
function findHTMLFiles(dir) {
  const files = [];
  
  function scanDir(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item.endsWith('.html')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${currentDir}:`, error.message);
    }
  }
  
  scanDir(dir);
  return files;
}

// Check if dist directory exists
if (!fs.existsSync(distDir)) {
  console.error(`❌ Directory ${distDir} does not exist. Please run 'expo export --platform web' first.`);
  process.exit(1);
}

// Process all HTML files
const htmlFiles = findHTMLFiles(distDir);
console.log(`Found ${htmlFiles.length} HTML files to process...`);

if (htmlFiles.length === 0) {
  console.log('⚠️  No HTML files found. Make sure you have built the web version first.');
  process.exit(1);
}

htmlFiles.forEach(addPWAToHTML);

console.log('✅ Zeger Customer PWA setup complete!');
console.log('📱 Your app is now ready for PWA installation');
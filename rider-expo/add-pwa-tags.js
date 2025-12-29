const fs = require('fs');
const path = require('path');

const distDir = './dist';
const pwaMetaTags = `
<!-- PWA Meta Tags -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#DC2626">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Zeger Rider">
<link rel="apple-touch-icon" href="/favicon.ico">
<meta name="msapplication-TileColor" content="#DC2626">
<meta name="msapplication-config" content="/browserconfig.xml">
`;

const serviceWorkerScript = `
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('SW registered: ', registration);
      })
      .catch(function(registrationError) {
        console.log('SW registration failed: ', registrationError);
      });
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
  }
  
  scanDir(dir);
  return files;
}

// Process all HTML files
const htmlFiles = findHTMLFiles(distDir);
console.log(`Found ${htmlFiles.length} HTML files to process...`);

htmlFiles.forEach(addPWAToHTML);

console.log('✅ PWA setup complete!');
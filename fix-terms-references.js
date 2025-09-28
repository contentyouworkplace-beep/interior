const fs = require('fs');
const path = require('path');

// Configuration
const directoriesToSearch = [
  '/Applications/interior-designer-crm/app',
  '/Applications/interior-designer-crm/lib',
  '/Applications/interior-designer-crm/components'
];

const fileTypes = ['.ts', '.tsx', '.js', '.jsx'];
const searchTerms = ['terms_conditions'];

// Function to process a file
async function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  let modified = false;
  let newContent = content;
  
  // Look for the terms_conditions field
  if (content.includes('terms_conditions')) {
    console.log(`📄 Processing ${filePath}`);
    
    // Replace in TypeScript/JavaScript code
    newContent = newContent.replace(
      /terms_conditions(\??:)/g, 
      'terms$1'
    );
    
    // Replace in JSX/TSX
    newContent = newContent.replace(
      /terms_conditions={/g, 
      'terms={'
    );
    
    // Replace in direct object access
    newContent = newContent.replace(
      /\.terms_conditions/g, 
      '.terms'
    );
    
    modified = newContent !== content;
    
    if (modified) {
      console.log(`✅ Updated references in ${filePath}`);
      fs.writeFileSync(filePath, newContent, 'utf8');
    }
  }
  
  return { filePath, modified };
}

// Recursive function to walk directories
async function walkDir(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  
  for (let file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next') {
        results.push(...await walkDir(filePath));
      }
    } else {
      // Only process files with the specified extensions
      if (fileTypes.some(ext => filePath.endsWith(ext))) {
        results.push(filePath);
      }
    }
  }
  
  return results;
}

// Main function
async function main() {
  console.log('🔍 Scanning for terms_conditions references...');
  
  const filesToProcess = [];
  
  for (const dir of directoriesToSearch) {
    if (fs.existsSync(dir)) {
      const files = await walkDir(dir);
      filesToProcess.push(...files);
    }
  }
  
  console.log(`📋 Found ${filesToProcess.length} files to check`);
  
  const results = [];
  for (const filePath of filesToProcess) {
    const result = await processFile(filePath);
    if (result.modified) {
      results.push(result);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`Total files checked: ${filesToProcess.length}`);
  console.log(`Files modified: ${results.length}`);
  
  if (results.length > 0) {
    console.log('\n📝 Modified files:');
    results.forEach(r => console.log(`- ${r.filePath}`));
  }
}

main().catch(console.error);
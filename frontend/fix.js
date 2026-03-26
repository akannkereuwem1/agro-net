const fs = require('fs');

const filePath = 'C:\\Users\\personal\\desktop\\agronet\\node_modules\\metro-config\\src\\loadConfig.js';
let content = fs.readFileSync(filePath, 'utf8');

const patched = content.replace(
  'await import(absolutePath)',
  "await import(require('url').pathToFileURL(absolutePath).href)"
);

if (patched === content) {
  console.log('Pattern not found - no changes made');
} else {
  fs.writeFileSync(filePath, patched);
  console.log('Patched successfully!');
}
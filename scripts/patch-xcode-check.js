const fs = require('fs');
const path = require('path');

const helpersPath = path.join(
  __dirname,
  '../node_modules/react-native/scripts/cocoapods/helpers.rb'
);

if (fs.existsSync(helpersPath)) {
  let content = fs.readFileSync(helpersPath, 'utf8');
  if (content.includes("return '16.1'")) {
    content = content.replace("return '16.1'", "return '16.0'");
    fs.writeFileSync(helpersPath, content, 'utf8');
    console.log('[patch-xcode-check] Patched Xcode version requirement to 16.0 in react-native/scripts/cocoapods/helpers.rb');
  }
}

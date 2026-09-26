const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = 'c:\\Users\\Mithilesh\\OneDrive\\Project\\IQOO Hackathon 26\\AI Personal Expense & Budget Assistant';
const zipPath = path.join(rootDir, 'SmartFinance_Production.zip');

if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
}

const excludes = [
    '.git',
    'node_modules',
    'worker/node_modules',
    'android/.gradle',
    'android/build',
    'android/app/build',
    'android/.idea',
    '.wrangler',
    'scratch',
    'SmartFinance_Production.zip'
];

console.log('Creating clean production ZIP package...');

const excludeFlags = excludes.map(e => `-Exclude '${e}'`).join(' ');

// Use PowerShell Compress-Archive with filtering
const psScript = `
$rootDir = '${rootDir}';
$zipPath = '${zipPath}';
$items = Get-ChildItem -Path $rootDir | Where-Object { 
    $name = $_.Name;
    $rel = $_.FullName.Replace($rootDir, '').TrimStart('\\');
    $name -notin @('.git', 'node_modules', '.wrangler', 'scratch', 'SmartFinance_Production.zip')
};
Compress-Archive -Path $items.FullName -DestinationPath $zipPath -Force
`;

try {
    execSync(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`);
    console.log('ZIP Package successfully created at:', zipPath);
} catch (err) {
    console.error('Error creating zip package:', err.message);
}

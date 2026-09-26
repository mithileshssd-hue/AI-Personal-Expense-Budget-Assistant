const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const wwwDir = path.join(rootDir, 'www');

if (!fs.existsSync(wwwDir)) {
    fs.mkdirSync(wwwDir, { recursive: true });
}

const filesToCopy = [
    'index.html',
    'login.html',
    'register.html',
    'dashboard.html',
    'expenses.html',
    'income.html',
    'analytics.html',
    'profile.html',
    'ai-assistant.html',
    'script.js',
    'style.css',
    'login-illustration.jpg'
];

filesToCopy.forEach(file => {
    const src = path.join(rootDir, file);
    const dest = path.join(wwwDir, file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${file} to www/`);
    } else {
        console.warn(`File not found: ${file}`);
    }
});

console.log('Build www directory completed successfully!');

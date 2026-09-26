const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = __dirname ? path.dirname(__dirname) : process.cwd();
console.log('--- ERROR CHECK AUDIT ---');

let errorCount = 0;
let warningCount = 0;

// 1. Check JS Files Syntax
const jsFiles = ['script.js', 'build_www.js'];
jsFiles.forEach(relPath => {
    const fullPath = path.join(rootDir, relPath);
    if (!fs.existsSync(fullPath)) {
        console.error(`[ERROR] File missing: ${relPath}`);
        errorCount++;
        return;
    }
    try {
        const code = fs.readFileSync(fullPath, 'utf8');
        new vm.Script(code);
        console.log(`[OK] JS Syntax Valid: ${relPath}`);
    } catch (err) {
        console.error(`[ERROR] JS Syntax Error in ${relPath}:`, err.message);
        errorCount++;
    }
});

// Check Worker (ES Module syntax)
const workerPath = path.join(rootDir, 'worker/src/index.js');
if (fs.existsSync(workerPath)) {
    try {
        const code = fs.readFileSync(workerPath, 'utf8');
        // Simple ESM module check
        if (code.includes('export default') && code.includes('async fetch(')) {
            console.log(`[OK] Cloudflare Worker ESM Valid: worker/src/index.js`);
        } else {
            console.warn(`[WARN] worker/src/index.js missing default export handler`);
            warningCount++;
        }
    } catch (e) {
        console.error(`[ERROR] Failed reading worker/src/index.js`, e.message);
        errorCount++;
    }
} else {
    console.error(`[ERROR] worker/src/index.js missing`);
    errorCount++;
}

// 2. Check HTML files existence and basic structure
const htmlFiles = [
    'index.html', 'login.html', 'register.html', 'dashboard.html',
    'expenses.html', 'income.html', 'analytics.html', 'profile.html', 'ai-assistant.html'
];

htmlFiles.forEach(file => {
    const fullPath = path.join(rootDir, file);
    if (!fs.existsSync(fullPath)) {
        console.error(`[ERROR] HTML missing: ${file}`);
        errorCount++;
        return;
    }
    const html = fs.readFileSync(fullPath, 'utf8');
    if (!html.includes('<!DOCTYPE html>') && !html.includes('<!doctype html>')) {
        console.warn(`[WARN] Missing DOCTYPE in ${file}`);
        warningCount++;
    }
    if (!html.includes('script.js') && file !== 'index.html' && file !== 'login.html' && file !== 'register.html') {
        console.warn(`[WARN] script.js missing in ${file}`);
        warningCount++;
    }
    console.log(`[OK] HTML File Checked: ${file}`);
});

// 3. Check CSS File
const cssPath = path.join(rootDir, 'style.css');
if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8');
    const openBraces = (css.match(/\{/g) || []).length;
    const closeBraces = (css.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
        console.error(`[ERROR] CSS Braces Mismatch in style.css: ${openBraces} '{' vs ${closeBraces} '}'`);
        errorCount++;
    } else {
        console.log(`[OK] CSS Braces Balanced in style.css (${openBraces} rules)`);
    }
} else {
    console.error(`[ERROR] style.css missing`);
    errorCount++;
}

// 4. Check www build synchronization
htmlFiles.concat(['script.js', 'style.css']).forEach(file => {
    const srcPath = path.join(rootDir, file);
    const wwwPath = path.join(rootDir, 'www', file);
    if (!fs.existsSync(wwwPath)) {
        console.error(`[ERROR] www/${file} does not exist`);
        errorCount++;
        return;
    }
    const srcContent = fs.readFileSync(srcPath, 'utf8');
    const wwwContent = fs.readFileSync(wwwPath, 'utf8');
    if (srcContent !== wwwContent) {
        console.warn(`[WARN] www/${file} is out of sync with root ${file}`);
        warningCount++;
    }
});

console.log(`\nAudit Complete: ${errorCount} Errors, ${warningCount} Warnings.`);
process.exit(errorCount > 0 ? 1 : 0);

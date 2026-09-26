const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const destDir = 'C:\\Users\\Mithilesh\\.gradle\\jdk-21';
const zipPath = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'jdk21.zip');
const url = 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.5%2B11/OpenJDK21U-jdk_x64_windows_hotspot_21.0.5_11.zip';

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

console.log('Downloading JDK 21 from adoptium...');
const file = fs.createWriteStream(zipPath);

function download(downloadUrl) {
    https.get(downloadUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
            console.log('Following redirect to:', response.headers.location);
            download(response.headers.location);
            return;
        }
        if (response.statusCode !== 200) {
            console.error('Failed to download JDK:', response.statusCode);
            process.exit(1);
        }
        response.pipe(file);
        file.on('finish', () => {
            file.close(() => {
                console.log('Download complete. Extracting JDK 21 using tar / Expand-Archive...');
                try {
                    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`);
                    console.log('JDK 21 Extracted successfully to', destDir);
                    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
                } catch (err) {
                    console.error('Extraction failed:', err.message);
                }
            });
        });
    }).on('error', (err) => {
        console.error('Download error:', err.message);
    });
}

download(url);

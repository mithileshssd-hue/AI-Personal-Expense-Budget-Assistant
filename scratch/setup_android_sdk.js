const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const sdkDir = 'C:\\Users\\Mithilesh\\AppData\\Local\\Android\\Sdk';
const cmdlineDir = path.join(sdkDir, 'cmdline-tools');
const latestDir = path.join(cmdlineDir, 'latest');
const zipPath = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'cmdline-tools.zip');
const url = 'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip';

if (!fs.existsSync(sdkDir)) {
    fs.mkdirSync(sdkDir, { recursive: true });
}
if (!fs.existsSync(cmdlineDir)) {
    fs.mkdirSync(cmdlineDir, { recursive: true });
}

console.log('Downloading Android commandlinetools from Google...');
const file = fs.createWriteStream(zipPath);

https.get(url, (response) => {
    if (response.statusCode === 301 || response.statusCode === 302) {
        https.get(response.headers.location, handleStream);
    } else {
        handleStream(response);
    }
});

function handleStream(response) {
    if (response.statusCode !== 200) {
        console.error('Failed download:', response.statusCode);
        process.exit(1);
    }
    response.pipe(file);
    file.on('finish', () => {
        file.close(() => {
            console.log('Download finished. Extracting commandlinetools...');
            const tempExtract = path.join(sdkDir, 'temp_cmdline');
            if (fs.existsSync(tempExtract)) fs.rmSync(tempExtract, { recursive: true, force: true });
            fs.mkdirSync(tempExtract, { recursive: true });

            execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempExtract}' -Force"`);

            if (fs.existsSync(latestDir)) fs.rmSync(latestDir, { recursive: true, force: true });
            
            // Move cmdline-tools contents into latest
            const extractedCmdline = path.join(tempExtract, 'cmdline-tools');
            fs.renameSync(extractedCmdline, latestDir);
            fs.rmSync(tempExtract, { recursive: true, force: true });
            if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

            console.log('Commandline tools installed to:', latestDir);

            // Accept licenses and install platform-tools, platforms;android-34, build-tools;34.0.0
            console.log('Installing Android SDK platforms and build-tools via sdkmanager...');
            const sdkmanager = path.join(latestDir, 'bin', 'sdkmanager.bat');
            
            try {
                execSync(`cmd /c "echo y | \\"${sdkmanager}\\" --licenses --sdk_root=\\"${sdkDir}\\""`, { stdio: 'inherit' });
                execSync(`cmd /c "\\"${sdkmanager}\\" --sdk_root=\\"${sdkDir}\\" \\"platforms;android-34\\" \\"build-tools;34.0.0\\" \\"platform-tools\\""`, { stdio: 'inherit' });
                console.log('Android SDK installed successfully!');
            } catch (err) {
                console.error('sdkmanager execution error:', err.message);
            }
        });
    });
}

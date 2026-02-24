const fs = require('fs');
const glob = 'd:/IdeaProjects/openssh/src/renderer/src/**/*.vue';
const execSync = require('child_process').execSync;
const files = execSync('dir /b /s "d:\\IdeaProjects\\openssh\\src\\renderer\\src\\*.vue"').toString().split('\r\n').filter(Boolean);

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf-8');
    if (content.includes('window.electronAPI')) {
        console.log('Processing', f);
        let newContent = content.replace(/window\.electronAPI\.(minimize|maximize|close|isMaximized)\(/g, 'windowAPI.$1(');
        newContent = newContent.replace(/window\.electronAPI\.(sftp|ssh|hosts|dialog|updater|app)\./g, '$1API.');
        newContent = newContent.replace(/window\.electronAPI\.on/g, 'windowAPI.on');

        // rename updaterAPI to appAPI
        newContent = newContent.replace(/updaterAPI\./g, 'appAPI.');

        // gather imports
        const importsNeeded = new Set();
        const regex = /(sshAPI|sftpAPI|hostsAPI|dialogAPI|appAPI|windowAPI)\./g;
        let match;
        while ((match = regex.exec(newContent)) !== null) {
            importsNeeded.add(match[1]);
        }

        if (importsNeeded.size > 0 && !newContent.includes('tauri-bridge')) {
            const importStr = `import { ${Array.from(importsNeeded).join(', ')} } from '@/api/tauri-bridge'`;
            newContent = newContent.replace(/(<script setup[^>]*>\s*)/, `$1${importStr}\n`);
        }

        fs.writeFileSync(f, newContent, 'utf-8');
        console.log('Updated', f);
    }
});
console.log('Done');

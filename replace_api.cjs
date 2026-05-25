const fs = require('fs');
const path = require('path');
const srcDir = path.join('d:', 'VS Code', 'Vaulto', 'vaulto', 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('http://localhost:8080')) {
        console.log('Updating: ' + file);
        
        if (file.endsWith('api.js')) return;

        const fileDir = path.dirname(file);
        const apiPath = path.join(srcDir, 'config', 'api.js');
        let relPath = path.relative(fileDir, apiPath).replace(/\\/g, '/');
        if (!relPath.startsWith('.')) relPath = './' + relPath;
        relPath = relPath.replace('.js', '');

        const importStatement = `import { API_BASE } from "${relPath}";\n`;
        
        let lastImportIndex = content.lastIndexOf('import ');
        if (lastImportIndex !== -1) {
            const endOfImport = content.indexOf('\n', lastImportIndex);
            content = content.slice(0, endOfImport + 1) + importStatement + content.slice(endOfImport + 1);
        } else {
            content = importStatement + content;
        }

        content = content.replace(/"http:\/\/localhost:8080([^"]*)"/g, '`${API_BASE}$1`');
        content = content.replace(/'http:\/\/localhost:8080([^']*)'/g, '`${API_BASE}$1`');
        content = content.replace(/`http:\/\/localhost:8080([^`]*)`/g, '`${API_BASE}$1`');

        fs.writeFileSync(file, content);
    }
});
console.log('Done replacing API_BASE');

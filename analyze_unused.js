const fs = require('fs');
const path = require('path');

const projectRoot = 'd:\\Desktop\\DEV\\DashboardOL-V2';
const srcDir = path.join(projectRoot, 'src');

function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            getAllFiles(filePath, fileList);
        } else {
            if (['.ts', '.tsx', '.js', '.jsx'].includes(path.extname(file))) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

const allFiles = getAllFiles(srcDir);
const usedFiles = new Set();

// Mark entry points as used
const entryPointPatterns = [
    'page.tsx', 'layout.tsx', 'loading.tsx', 'error.tsx', 'not-found.tsx',
    'global-error.tsx', 'route.ts', 'template.tsx', 'default.tsx', 'middleware.ts'
];

allFiles.forEach(file => {
    const basename = path.basename(file);
    if (entryPointPatterns.includes(basename)) {
        usedFiles.add(file);
    }
});

// Analyze imports
allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    // Regex for static imports
    const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
    // Regex for dynamic imports and require
    const dynamicImportRegex = /(?:import|require)\(['"](.*?)['"]\)/g;
    // Regex for export ... from
    const exportFromRegex = /export\s+.*?\s+from\s+['"](.*?)['"]/g;

    const patterns = [importRegex, dynamicImportRegex, exportFromRegex];

    patterns.forEach(regex => {
        let match;
        while ((match = regex.exec(content)) !== null) {
            const importPath = match[1];
            resolveImport(file, importPath);
        }
    });
});

function resolveImport(sourceFile, importPath) {
    let targetPath = '';

    if (importPath.startsWith('.')) {
        targetPath = path.resolve(path.dirname(sourceFile), importPath);
    } else if (importPath.startsWith('@/')) {
        targetPath = path.join(srcDir, importPath.substring(2));
    } else {
        return; // Node modules or other aliases we don't handle
    }

    // Try extensions
    const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];

    for (const ext of extensions) {
        const candidate = targetPath + ext;
        if (allFiles.includes(candidate)) {
            usedFiles.add(candidate);
            return;
        }
    }
}

const unusedFiles = allFiles.filter(file => !usedFiles.has(file));

console.log('Total files:', allFiles.length);
console.log('Used files:', usedFiles.size);
console.log('Unused files:', unusedFiles.length);
console.log('--- Unused Files List ---');
unusedFiles.forEach(file => {
    console.log(path.relative(projectRoot, file));
});

let files = [];
let wallpapers = [];
let currentFileIndex = 0;
let currentWallpaperIndex = 0;

// Local file loading requires a web server to avoid CORS issues
async function loadJSON(path) {
    try {
        const response = await fetch(path);
        const data = await response.text();
        return JSON.parse(data);
    } catch (error) {
        console.error(`Failed to load ${path}`, error);
        document.getElementById("content").innerText = 
            `Error loading ${path}. Choose a solution below based on your browser:\n\n` +
            `1. Run a local server (Recommended):\n` +
            `   - Open terminal in this folder\n` +
            `   - Run: python -m http.server 8000\n` +
            `   - Open: http://localhost:8000\n\n` +
            `2. Chrome/Edge:\n` +
            `   - Create shortcut to Chrome/Edge\n` +
            `   - Add flag: --allow-file-access-from-files\n` +
            `   - Right-click → Properties → Target:\n` +
            `   "C:\\Path\\chrome.exe" --allow-file-access-from-files\n\n` +
            `3. Firefox:\n` +
            `   - Type about:config in address bar\n` +
            `   - Search: privacy.file_unique_origin\n` +
            `   - Set to false\n\n` +
            `4. VS Code:\n` +
            `   - Install "Live Server" extension\n` +
            `   - Right-click HTML file → Open with Live Server\n\n` +
            `5. Node.js:\n` +
            `   - Install: npm install -g http-server\n` +
            `   - Run: http-server\n` +
            `   - Open: http://localhost:8080`;
        throw error;
    }
}

async function scanDirectory(path, extension) {
    try {
        const basePath = path.split('*')[0];
        const response = await fetch(basePath);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const files = Array.from(doc.querySelectorAll('a'))
            .map(a => a.getAttribute('href'))
            .filter(href => href && href.toLowerCase().endsWith(extension.toLowerCase()))
            .map(href => basePath + href);
        return files;
    } catch (error) {
        console.warn(`Failed to scan directory: ${path}`, error);
        return [];
    }
}

async function getAvailableFiles() {
    const files = new Set();
    try {
        const jsonFiles = await scanDirectory('content/*.json', '.json');
        return jsonFiles.length > 0 ? jsonFiles : [
            'content/java_reference.json',
            'content/css_guide.json',
            'content/bootstrap_reference.json'
        ];
    } catch (error) {
        console.warn('Falling back to static file list:', error);
        return [
            'content/java_reference.json',
            'content/css_guide.json',
            'content/bootstrap_reference.json'
        ];
    }
}

async function getAvailableWallpapers(patterns) {
    const wallpapers = new Set();
    const patternList = Array.isArray(patterns) ? patterns : [patterns];

    for (const pattern of patternList) {
        if (pattern.includes('*')) {
            const extension = pattern.split('*.')[1];
            const files = await scanDirectory(pattern, `.${extension}`);
            files.forEach(file => wallpapers.add(file));
        } else {
            wallpapers.add(pattern);
        }
    }
    return Array.from(wallpapers).sort();
}

async function loadAllJSON(pattern) {
    if (pattern.includes('*')) {
        files = await getAvailableFiles();
        return files.length > 0 ? await loadJSON(files[0]) : null;
    }
    files = [pattern];
    return await loadJSON(pattern);
}

function navigateContent(direction) {
    currentFileIndex = (currentFileIndex + direction + files.length) % files.length;
    loadContent();
}

async function navigateWallpaper(direction) {
    if (wallpapers.length > 0) {
        currentWallpaperIndex = (currentWallpaperIndex + direction + wallpapers.length) % wallpapers.length;
        try {
            await setWallpaper(wallpapers[currentWallpaperIndex]);
        } catch (error) {
            console.error('Failed to navigate wallpaper:', error);
        }
    }
}

// Converts arrays into HTML lists with proper wrapping for responsive layout
function formatList(items, isNumbered = false) {
    const listType = isNumbered ? 'ol' : 'ul';
    const listItems = items.map(item => `<li>${item}</li>`).join('');
    return `<div class="flex-wrap">${'<' + listType}>${listItems}</${listType}></div>`;
}

// Transforms JSON table data into responsive HTML tables with consistent styling
function formatTable(tableData) {
    const headers = tableData.headers.map(h => `<th>${h}</th>`).join('');
    const rows = tableData.rows.map(row => 
        `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
    ).join('');
    
    return `
        <div class="flex-wrap">
            <table>
                <thead><tr>${headers}</tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

// Handles different content types and ensures consistent layout structure
function formatContent(item) {
    let content = '';
    
    // Title handling is split to support special heading style without h2 wrapper
    if (item.title && item.style !== "heading") {
        content = `<h2>${item.title}</h2>`;
    }
    
    // Each content type gets its own wrapper for consistent spacing and layout
    if (item.style === "heading") {
        return `<div class="flex-wrap"><h1>${item.title}</h1></div>`;
    }
    if (item.list) {
        return `<div class="flex-wrap">${content}${formatList(item.list)}</div>`;
    }
    if (item.numberedList) {
        return `<div class="flex-wrap">${content}${formatList(item.numberedList, true)}</div>`;
    }
    if (item.table) {
        return `<div class="flex-wrap">${content}${formatTable(item.table)}</div>`;
    }
    if (item.title && !content) {
        return `<div class="flex-wrap">${content}</div>`;
    }
    return '';
}

// Supports dynamic wallpaper changes without page reload
function setWallpaper(wallpaperPath) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            document.body.style.backgroundImage = `url('${wallpaperPath}')`;
            resolve();
        };
        img.onerror = () => {
            console.error(`Failed to load wallpaper: ${wallpaperPath}`);
            reject();
        };
        img.src = wallpaperPath;
    });
}

// Allows theme customization through additional CSS files
function loadStylesheets(stylesheets) {
    stylesheets.forEach(stylesheet => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = stylesheet;
        document.head.appendChild(link);
    });
}

// Orchestrates the initial setup and content rendering
async function initializeContent() {
    try {
        const config = await loadJSON('config.json');
        files = getAvailableFiles();
        
        // Scan for wallpapers using patterns
        wallpapers = await getAvailableWallpapers(config.wallpaper);
        console.log('Found wallpapers:', wallpapers);
        
        if (wallpapers.length > 0) {
            await setWallpaper(wallpapers[0]);
        }

        const content = await loadAllJSON(config.content);
        const formattedContent = content.map(formatContent).join('');
        document.getElementById("content").innerHTML = formattedContent;
        
        if (config.stylesheets) {
            loadStylesheets(config.stylesheets);
        }
    } catch (error) {
        console.error('Failed to initialize:', error);
        document.getElementById("content").innerHTML = '<p>Error loading content</p>';
    }
}

function loadContent() {
    if (files[currentFileIndex]) {
        loadJSON(files[currentFileIndex])
            .then(content => {
                const formattedContent = content.map(formatContent).join('');
                document.getElementById("content").innerHTML = formattedContent;
            })
            .catch(error => console.error('Failed to load content:', error));
    }
}

document.addEventListener("DOMContentLoaded", () => {
    initializeContent();
    document.getElementById("prevBtn").addEventListener("click", () => navigateContent(-1));
    document.getElementById("nextBtn").addEventListener("click", () => navigateContent(1));
    document.getElementById("prevWallBtn").addEventListener("click", () => navigateWallpaper(-1));
    document.getElementById("nextWallBtn").addEventListener("click", () => navigateWallpaper(1));
});

let files = [];
let wallpapers = [];
let currentFileIndex = 0;
let currentWallpaperIndex = 0;
let stylesheetSets = [];
let currentStylesheetSet = 0;
let isOnlineMode = false;
let serverUrl = '';

// Modified loadJSON to handle both modes
async function loadJSON(path) {
    try {
        const fullPath = isOnlineMode ? `${serverUrl}/${path}` : path;
        const response = await fetch(fullPath);
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

function getAvailableFiles() {
    return [
        'content/java_reference.json',
        'content/css_guide.json',
        'content/bootstrap_reference.json'
    ];
}

function getAvailableWallpapers(pattern) {
    // Handle array of patterns
    if (Array.isArray(pattern)) {
        return pattern;
    }
    
    // Handle single pattern
    if (typeof pattern === 'string') {
        if (pattern.includes('*')) {
            const extension = pattern.split('*.')[1];
            // Return hardcoded list for now - in production this would be generated
            const wallpapers = [
                `images/wallpaper/wallpaper1.${extension}`,
                `images/wallpaper/wallpaper2.${extension}`,
                `images/wallpaper/wallpaper3.${extension}`
            ];
            return wallpapers.filter(w => {
                try {
                    // Test if file exists by creating an image object
                    const img = new Image();
                    img.src = w;
                    return true;
                } catch {
                    return false;
                }
            });
        }
        return [pattern];
    }
    
    return [];
}

async function loadAllJSON(pattern) {
    if (Array.isArray(pattern)) {
        // If pattern is array, use it directly as files list
        files = pattern;
        return files.length > 0 ? await loadJSON(files[0]) : null;
    }
    if (typeof pattern === 'string' && pattern.includes('*')) {
        // Handle wildcard pattern
        files = getAvailableFiles();
        return files.length > 0 ? await loadJSON(files[0]) : null;
    }
    // Single file case
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

function navigateStylesheet(direction) {
    if (stylesheetSets.length > 0) {
        currentStylesheetSet = (currentStylesheetSet + direction + stylesheetSets.length) % stylesheetSets.length;
        // Remove existing stylesheets
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => link.remove());
        // Load new stylesheet set
        loadStylesheets(stylesheetSets[currentStylesheetSet]);
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

// Add stylesheet detection helper
function isUsingStylesheet(name) {
    return document.querySelector(`link[href*="${name}.css"]`) !== null;
}

// Handles different content types and ensures consistent layout structure
function formatContent(item) {
    let content = '';
    
    /* HEADING STYLE RULES:
       - For small.css and tiny.css: Heading must be centered, full-width, on its own line
       - Other stylesheets: Use standard flex-wrap layout
       - This rule enforces consistent heading treatment for compact layouts
       - Do not modify this behavior as it ensures readability in small viewports
    */
    if (item.style === "heading") {
        // Special handling for small and tiny stylesheets
        if (isUsingStylesheet('small') || isUsingStylesheet('tiny')) {
            return `<div style="width:100%; text-align:center; margin-bottom:1.5rem; flex-basis:100%;"><h1>${item.title}</h1></div>`;
        }
        return `<div class="flex-wrap"><h1>${item.title}</h1></div>`;
    }
    
    // Title handling for non-heading styles
    if (item.title && item.style !== "heading") {
        content = `<h2>${item.title}</h2>`;
    }
    
    // Handle other content types
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

// Modified setWallpaper to handle online mode
function setWallpaper(wallpaperPath) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            document.body.style.backgroundImage = `url('${isOnlineMode ? `${serverUrl}/${wallpaperPath}` : wallpaperPath}')`;
            resolve();
        };
        img.onerror = () => {
            console.error(`Failed to load wallpaper: ${wallpaperPath}`);
            reject();
        };
        img.src = isOnlineMode ? `${serverUrl}/${wallpaperPath}` : wallpaperPath;
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

// Modified initializeContent to handle mode setting
async function initializeContent() {
    try {
        const config = await loadJSON('config.json');
        
        // Add automatic mode detection
        if (config.mode === 'detect') {
            try {
                // Try to fetch a known file to test online connectivity
                const response = await fetch(`${config.serverUrl}/config.json`);
                isOnlineMode = response.ok;
            } catch (error) {
                isOnlineMode = false;
            }
            console.log(`Detected mode: ${isOnlineMode ? 'online' : 'offline'}`);
        } else {
            isOnlineMode = config.mode === 'online';
        }
        
        serverUrl = config.serverUrl || '';
        
        // Set page title if provided
        if (config.title) {
            document.title = config.title;
            document.getElementById("title").textContent = config.title;
        }
        
        // Get stylesheet sets
        stylesheetSets = Object.values(config.stylesheets);
        if (stylesheetSets.length > 0) {
            loadStylesheets(stylesheetSets[0]);
        }

        // Scan for wallpapers using patterns
        wallpapers = await scanWallpapers(config.wallpaper);
        console.log('Found wallpapers:', wallpapers);
        
        if (wallpapers.length > 0) {
            await setWallpaper(wallpapers[0]);
        }

        // Load content from first file in config.content
        const content = await loadAllJSON(config.content);
        if (content) {
            const formattedContent = content.map(formatContent).join('');
            document.getElementById("content").innerHTML = formattedContent;
        } else {
            document.getElementById("content").innerHTML = '<p>No content files found</p>';
        }
    } catch (error) {
        console.error('Failed to initialize:', error);
        document.getElementById("content").innerHTML = `<p>Error loading content: ${error.message}</p>`;
    }
}

async function scanWallpapers(patterns) {
    const foundWallpapers = new Set();
    const patternList = Array.isArray(patterns) ? patterns : [patterns];

    // Helper function to test image loading
    const testImage = (path) => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = isOnlineMode ? `${serverUrl}/${path}` : path;
    });

    for (const pattern of patternList) {
        if (pattern.includes('*')) {
            const [basePath, filePattern] = pattern.split('*');
            try {
                const indexes = Array.from({length: 10}, (_, i) => i + 1);
                for (const idx of indexes) {
                    const path = `${basePath}${idx}${filePattern}`;
                    if (await testImage(path)) {
                        foundWallpapers.add(path);
                    }
                }
            } catch (error) {
                console.warn(`Failed to scan ${basePath}`, error);
            }
        } else {
            // For direct paths, just add them without testing in online mode
            if (isOnlineMode) {
                foundWallpapers.add(pattern);
            } else if (await testImage(pattern)) {
                foundWallpapers.add(pattern);
            }
        }
    }
    return Array.from(foundWallpapers).sort();
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
    document.getElementById("prevStyleBtn").addEventListener("click", () => navigateStylesheet(-1));
    document.getElementById("nextStyleBtn").addEventListener("click", () => navigateStylesheet(1));
});

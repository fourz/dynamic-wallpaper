let files = [];
let currentTabIndex = 0;

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
    document.body.style.backgroundImage = `url('${wallpaperPath}')`;
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
        const content = await loadJSON(config.content);
        const formattedContent = content.map(formatContent).join('');
        document.getElementById("content").innerHTML = formattedContent;
        setWallpaper(config.wallpaper);
        if (config.stylesheets) {
            loadStylesheets(config.stylesheets);
        }
    } catch (error) {
        console.error('Failed to initialize:', error);
        document.getElementById("content").innerHTML = '<p>Error loading content</p>';
    }
}

function loadContent() {
    initializeContent();
}

document.addEventListener("DOMContentLoaded", loadContent);

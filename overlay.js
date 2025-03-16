import { NavigationManager } from './js/navigation.js';
import { StorageManager } from './js/storage.js';
import { ConfigManager } from './js/config.js';

// Create managers
const navigation = new NavigationManager();
const storage = new StorageManager();
const config = new ConfigManager();

// Remove old storage variables
let isOnlineMode = false;
let serverUrl = '';
let fadeToggleEnabled = false;
let fadeTimeout = null;
let lastMouseMoveTime = 0;
const FADE_DELAY = 40000;

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
        const files = pattern;
        const firstFile = navigation.setFiles(files);
        return files.length > 0 ? await loadJSON(firstFile) : null;
    }
    if (typeof pattern === 'string' && pattern.includes('*')) {
        const files = getAvailableFiles();
        const firstFile = navigation.setFiles(files);
        return files.length > 0 ? await loadJSON(firstFile) : null;
    }
    const firstFile = navigation.setFiles([pattern]);
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

// Format text blocks into paragraphs
function formatBlock(blocks) {
    return blocks.map(text => `<p class="block-text">${text}</p>`).join('');
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
    
    // Handle block content type
    if (item.block) {
        return `<div class="flex-wrap">${content}${formatBlock(item.block)}</div>`;
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

// Update initFadeToggle to use StorageManager
function initFadeToggle() {
    fadeToggleEnabled = storage.getFadeState();
    const fadeToggleBtn = document.getElementById('fadeToggleBtn');
    
    if (fadeToggleEnabled) {
        fadeToggleBtn.classList.add('active');
        startFadeMonitoring();
    }
    
    fadeToggleBtn.addEventListener('click', toggleFade);
}

// Toggle fade functionality on/off
function toggleFade() {
    fadeToggleEnabled = !fadeToggleEnabled;
    storage.setFadeState(fadeToggleEnabled);
    
    const fadeToggleBtn = document.getElementById('fadeToggleBtn');
    if (fadeToggleEnabled) {
        fadeToggleBtn.classList.add('active');
        startFadeMonitoring();
    } else {
        fadeToggleBtn.classList.remove('active');
        stopFadeMonitoring();
        restoreContentOpacity();
    }
}

// Start monitoring for inactivity
function startFadeMonitoring() {
    // Reset last mouse move time
    lastMouseMoveTime = Date.now();
    
    // Set up mouse move listener
    document.addEventListener('mousemove', handleMouseMove);
    
    // Set initial fade timeout
    scheduleFadeCheck();
}

// Stop monitoring for inactivity
function stopFadeMonitoring() {
    // Remove mouse move listener
    document.removeEventListener('mousemove', handleMouseMove);
    
    // Clear any pending timeout
    if (fadeTimeout) {
        clearTimeout(fadeTimeout);
        fadeTimeout = null;
    }
}

// Handle mouse movement
function handleMouseMove() {
    lastMouseMoveTime = Date.now();
    restoreContentOpacity();
}

// Check if content should be faded
function checkFadeContent() {
    const contentDiv = document.getElementById('content');
    const now = Date.now();
    
    if (now - lastMouseMoveTime >= FADE_DELAY) {
        // Add transition class for smooth fading
        contentDiv.classList.add('fading');
        // Set opacity to 30%
        contentDiv.style.opacity = '0.3';
    }
    
    // Schedule next check
    scheduleFadeCheck();
}

// Schedule the next fade check
function scheduleFadeCheck() {
    if (fadeTimeout) {
        clearTimeout(fadeTimeout);
    }
    
    fadeTimeout = setTimeout(checkFadeContent, 1000);
}

// Restore content opacity
function restoreContentOpacity() {
    const contentDiv = document.getElementById('content');
    contentDiv.classList.add('fading');
    contentDiv.style.opacity = '1';
}

// Update initializeContent to use ConfigManager
async function initializeContent() {
    try {
        const configData = await loadJSON('config.json');
        
        if (configData.mode === 'detect') {
            try {
                const response = await fetch(`${configData.serverUrl}/config.json`);
                config.setOnlineMode(response.ok);
            } catch (error) {
                config.setOnlineMode(false);
            }
        } else {
            config.setOnlineMode(configData.mode === 'online');
        }
        
        config.setServerUrl(configData.serverUrl || '');
        config.setFormatContentFunction(formatContent);
        
        if (configData.title) {
            document.title = configData.title;
        }
        
        const savedState = storage.getNavigationState();
        navigation.setState(savedState);
        
        const stylesheetSet = navigation.setStylesheetSets(Object.values(configData.stylesheets));
        if (stylesheetSet) {
            config.loadStylesheets(stylesheetSet);
        }

        const scannedWallpapers = await config.scanWallpapers(configData.wallpaper);
        const currentWallpaper = navigation.setWallpapers(scannedWallpapers);
        if (currentWallpaper) {
            await config.setWallpaper(currentWallpaper);
        }

        const content = await loadAllJSON(configData.content);
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

// Update event listeners to use ConfigManager
document.addEventListener("DOMContentLoaded", () => {
    initializeContent();
    
    const saveNavigationState = () => {
        storage.setNavigationState(navigation.getState());
    };
    
    document.getElementById("prevBtn").addEventListener("click", () => {
        navigation.navigateContent(-1);
        config.loadContent(navigation.getCurrentFile(), loadJSON);
        storage.setNavigationState(navigation.getState());
    });
    
    document.getElementById("nextBtn").addEventListener("click", () => {
        navigation.navigateContent(1);
        config.loadContent(navigation.getCurrentFile(), loadJSON);
        storage.setNavigationState(navigation.getState());
    });
    
    document.getElementById("prevWallBtn").addEventListener("click", async () => {
        const wallpaper = navigation.navigateWallpaper(-1);
        if (wallpaper) {
            await config.setWallpaper(wallpaper);
            storage.setNavigationState(navigation.getState());
        }
    });
    
    document.getElementById("nextWallBtn").addEventListener("click", async () => {
        const wallpaper = navigation.navigateWallpaper(1);
        if (wallpaper) {
            await config.setWallpaper(wallpaper);
            storage.setNavigationState(navigation.getState());
        }
    });
    
    document.getElementById("prevStyleBtn").addEventListener("click", () => {
        const stylesheet = navigation.navigateStylesheet(-1);
        if (stylesheet) {
            config.loadStylesheets(stylesheet);
            storage.setNavigationState(navigation.getState());
        }
    });
    
    document.getElementById("nextStyleBtn").addEventListener("click", () => {
        const stylesheet = navigation.navigateStylesheet(1);
        if (stylesheet) {
            config.loadStylesheets(stylesheet);
            storage.setNavigationState(navigation.getState());
        }
    });
    
    // Initialize fade toggle functionality
    initFadeToggle();
});

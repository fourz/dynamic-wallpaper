/**
 * Manages application configuration and dynamic resource loading
 * Handles wallpaper scanning and loading
 * Controls stylesheet application and content formatting
 * Manages online/offline mode settings
 */
export class ConfigManager {
    constructor() {
        this.isOnlineMode = false;
        this.serverUrl = '';
        this.formatContent = null;
    }

    setOnlineMode(mode) {
        this.isOnlineMode = mode;
    }

    setServerUrl(url) {
        this.serverUrl = url;
    }

    setFormatContentFunction(formatFn) {
        this.formatContent = formatFn;
    }

    loadStylesheets(stylesheets) {
        // Remove existing stylesheets
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => link.remove());
        
        // Handle single stylesheet or array
        const sheets = Array.isArray(stylesheets) ? stylesheets : [stylesheets];
        
        // Load all stylesheets in order
        sheets.forEach(stylesheet => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = this.getResourcePath(stylesheet);
            document.head.appendChild(link);
        });
    }

    getResourcePath(path) {
        return this.isOnlineMode ? `${this.serverUrl}/${path.replace(/^\/+/, '')}` : path;
    }

    setWallpaper(wallpaperPath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const fullPath = this.getResourcePath(wallpaperPath);
            
            img.onload = () => {
                document.body.style.backgroundImage = `url('${fullPath}')`;
                resolve();
            };
            img.onerror = () => {
                console.error(`Failed to load wallpaper: ${wallpaperPath}`);
                reject();
            };
            img.src = fullPath;
        });
    }

    async scanWallpapers(patterns) {
        const foundWallpapers = new Set();
        const patternList = Array.isArray(patterns) ? patterns : [patterns];

        const testImage = async (path) => {
            try {
                const fullPath = this.getResourcePath(path);
                const img = new Image();
                return await new Promise((resolve) => {
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    img.src = fullPath;
                });
            } catch (error) {
                return false;
            }
        };

        for (const pattern of patternList) {
            if (pattern.includes('*')) {
                const [basePath, filePattern] = pattern.split('*');
                const indexes = Array.from({length: 20}, (_, i) => i + 1); // Expanded to check more files
                await Promise.all(indexes.map(async idx => {
                    const path = `${basePath}${idx}${filePattern}`;
                    if (await testImage(path)) {
                        foundWallpapers.add(path);
                    }
                }));
            } else if (await testImage(pattern)) {
                foundWallpapers.add(pattern);
            }
        }
        
        return Array.from(foundWallpapers).sort();
    }

    async loadContent(currentFile, loadJSONFn) {
        if (!currentFile) return;
        
        try {
            const content = await loadJSONFn(currentFile);
            if (this.formatContent && content) {
                const formattedContent = content
                    .map(this.formatContent)
                    .join('');
                document.getElementById("content").innerHTML = formattedContent;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load content:', error);
            document.getElementById("content").innerHTML = 
                `<p class="error">Failed to load content: ${error.message}</p>`;
            return false;
        }
    }
}

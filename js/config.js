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
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => link.remove());
        stylesheets.forEach(stylesheet => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = stylesheet;
            document.head.appendChild(link);
        });
    }

    setWallpaper(wallpaperPath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                document.body.style.backgroundImage = `url('${this.isOnlineMode ? `${this.serverUrl}/${wallpaperPath}` : wallpaperPath}')`;
                resolve();
            };
            img.onerror = () => {
                console.error(`Failed to load wallpaper: ${wallpaperPath}`);
                reject();
            };
            img.src = this.isOnlineMode ? `${this.serverUrl}/${wallpaperPath}` : wallpaperPath;
        });
    }

    async scanWallpapers(patterns) {
        const foundWallpapers = new Set();
        const patternList = Array.isArray(patterns) ? patterns : [patterns];

        const testImage = (path) => new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = this.isOnlineMode ? `${this.serverUrl}/${path}` : path;
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
            } else if (this.isOnlineMode || await testImage(pattern)) {
                foundWallpapers.add(pattern);
            }
        }
        return Array.from(foundWallpapers).sort();
    }

    async loadContent(currentFile, loadJSONFn) {
        if (currentFile) {
            try {
                const content = await loadJSONFn(currentFile);
                if (this.formatContent) {
                    const formattedContent = content.map(this.formatContent).join('');
                    document.getElementById("content").innerHTML = formattedContent;
                }
            } catch (error) {
                console.error('Failed to load content:', error);
            }
        }
    }
}

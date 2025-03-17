/**
 * Controls content layout and visual presentation by providing:
 * - Content formatting for different data types through template generation
 * - Content fade animation functionality with multiple fade modes
 * - Stylesheet-aware formatting decisions for responsive layouts
 */
export class LayoutManager {
    constructor() {
        // Initialize fade system with 40s delay before triggering mode-specific fade
        this.fadeToggleEnabled = false;
        this.fadeTimeout = null;
        this.lastMouseMoveTime = 0;
        this.FADE_DELAY = 40000; 
        this.uiFadeTimeout = null; // Add new property for UI fade timeout
        // Fade states determine UI/content visibility behavior:
        // - default: UI fades in/out on hover
        // - usage: Everything always visible 
        // - fade-out: Content fades to 30% after delay
        // - wallpaper: Everything fades to 0% after delay
        this.fadeState = 'default';
    }

    // Formatting methods
    formatList(items, isNumbered = false) {
        const listType = isNumbered ? 'ol' : 'ul';
        const listItems = items.map(item => `<li>${item}</li>`).join('');
        return `<div class="flex-wrap">${'<' + listType}>${listItems}</${listType}></div>`;
    }

    formatTable(tableData) {
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

    formatBlock(blocks) {
        return blocks.map(text => `<p class="block-text">${text}</p>`).join('');
    }

    isUsingStylesheet(name) {
        return document.querySelector(`link[href*="${name}.css"]`) !== null;
    }

    formatContent(item) {
        let content = '';
        
        if (item.style === "heading") {
            if (this.isUsingStylesheet('small') || this.isUsingStylesheet('tiny')) {
                return `<div style="width:100%; text-align:center; margin-bottom:1.5rem; flex-basis:100%;"><h1>${item.title}</h1></div>`;
            }
            return `<div class="flex-wrap"><h1>${item.title}</h1></div>`;
        }
        
        if (item.title && item.style !== "heading") {
            content = `<h2>${item.title}</h2>`;
        }
        
        if (item.block) {
            return `<div class="flex-wrap">${content}${this.formatBlock(item.block)}</div>`;
        }
        
        if (item.list) {
            return `<div class="flex-wrap">${content}${this.formatList(item.list)}</div>`;
        }
        if (item.numberedList) {
            return `<div class="flex-wrap">${content}${this.formatList(item.numberedList, true)}</div>`;
        }
        if (item.table) {
            return `<div class="flex-wrap">${content}${this.formatTable(item.table)}</div>`;
        }
        if (item.title && !content) {
            return `<div class="flex-wrap">${content}</div>`;
        }
        return '';
    }

    // Fading methods
    initFadeToggle(storage) {
        this.fadeState = storage.getFadeState() || 'default'; // Start with default mode
        const fadeToggleBtn = document.getElementById('fadeToggleBtn');
        
        this.updateFadeButtonState(fadeToggleBtn);
        this.applyFadeState();
        
        fadeToggleBtn.addEventListener('click', () => this.toggleFade(storage));
    }

    toggleFade(storage) {
        const states = ['default', 'usage', 'fade-out', 'wallpaper'];
        const currentIndex = states.indexOf(this.fadeState);
        this.fadeState = states[(currentIndex + 1) % states.length];
        
        storage.setFadeState(this.fadeState);
        
        const fadeToggleBtn = document.getElementById('fadeToggleBtn');
        this.updateFadeButtonState(fadeToggleBtn);
        this.applyFadeState();
    }

    updateFadeButtonState(button) {
        button.className = 'fade-toggle-btn';
        button.classList.add(this.fadeState);
        
        // Set an appropriate title based on the mode
        const titles = {
            'default': 'Default Mode: UI fades in/out on hover',
            'usage': 'Usage Mode: Always visible',
            'fade-out': 'Fade-Out Mode: Content fades after 40s',
            'wallpaper': 'Wallpaper Mode: All elements fade away after 40s'
        };
        
        button.title = titles[this.fadeState] || `Fade Mode: ${this.fadeState}`;
    }

    applyFadeState() {
        const contentDiv = document.getElementById('content');
        const buttons = document.querySelectorAll('.nav-btn, .wall-btn, .style-btn, .fade-toggle-btn');
        
        // First remove all state classes
        contentDiv.classList.remove('default', 'usage', 'fade-out', 'wallpaper');
        buttons.forEach(btn => btn.classList.remove('default', 'usage', 'fade-out', 'wallpaper'));
        
        // Stop any existing fade monitoring
        this.stopFadeMonitoring();
        
        // Set content to fully visible by default
        contentDiv.style.opacity = '1';
        
        switch(this.fadeState) {
            case 'default':
                // Set up mouse move listener for UI visibility
                this.setupDefaultFade();
                break;
                
            case 'usage':
                contentDiv.classList.add('usage');
                buttons.forEach(btn => {
                    btn.classList.add('usage');
                    btn.style.opacity = getComputedStyle(document.documentElement)
                        .getPropertyValue('--ui-usage-opacity').trim() || '1';
                });
                break;
                
            case 'fade-out':
            case 'wallpaper':
                contentDiv.classList.add(this.fadeState);
                buttons.forEach(btn => btn.classList.add(this.fadeState));
                this.startFadeMonitoring();
                break;
        }
    }

    // Add new method for default fade behavior
    setupDefaultFade() {
        const buttons = document.querySelectorAll('.nav-btn, .wall-btn, .style-btn, .fade-toggle-btn, .permalink-btn');
        
        // Ensure UI starts hidden
        buttons.forEach(btn => btn.style.opacity = '0');
        
        // Clear existing listener if any
        if (this.defaultFadeListener) {
            document.removeEventListener('mousemove', this.defaultFadeListener);
        }
        
        // Create new listener
        this.defaultFadeListener = () => {
            buttons.forEach(btn => btn.style.opacity = '1');
            
            // Clear existing timeout
            if (this.uiFadeTimeout) {
                clearTimeout(this.uiFadeTimeout);
            }
            
            // Set new timeout to fade out UI
            this.uiFadeTimeout = setTimeout(() => {
                if (this.fadeState === 'default') {
                    buttons.forEach(btn => btn.style.opacity = '0');
                }
            }, 2000); // 2 second delay before fade out
        };
        
        document.addEventListener('mousemove', this.defaultFadeListener);
    }

    setupAutoFade() {
        const contentDiv = document.getElementById('content');
        const buttons = document.querySelectorAll('.nav-btn, .wall-btn, .style-btn, .fade-toggle-btn');
        
        contentDiv.style.opacity = '0';
        buttons.forEach(btn => btn.style.opacity = '0');
        
        document.addEventListener('mousemove', () => {
            if (this.fadeState === 'auto') {
                contentDiv.style.opacity = '1';
                buttons.forEach(btn => btn.style.opacity = '1');
                clearTimeout(this.autoFadeTimeout);
                this.autoFadeTimeout = setTimeout(() => {
                    if (this.fadeState === 'auto') {
                        contentDiv.style.opacity = '0';
                        buttons.forEach(btn => btn.style.opacity = '0');
                    }
                }, 2000);
            }
        });
    }

    // Monitor mouse activity to trigger fades after delay
    startFadeMonitoring() {
        this.lastMouseMoveTime = Date.now();
        this.boundHandleMouseMove = this.handleMouseMove.bind(this);
        document.addEventListener('mousemove', this.boundHandleMouseMove);
        this.scheduleFadeCheck();
    }

    // Cleanup fade monitoring when changing modes
    stopFadeMonitoring() {
        if (this.boundHandleMouseMove) {
            document.removeEventListener('mousemove', this.boundHandleMouseMove);
        }
        if (this.fadeTimeout) {
            clearTimeout(this.fadeTimeout);
            this.fadeTimeout = null;
        }
        
        // Also clean up default fade listener
        if (this.defaultFadeListener) {
            document.removeEventListener('mousemove', this.defaultFadeListener);
            this.defaultFadeListener = null;
        }
        if (this.uiFadeTimeout) {
            clearTimeout(this.uiFadeTimeout);
            this.uiFadeTimeout = null;
        }
    }

    // Reset fade timer on mouse movement
    handleMouseMove() {
        this.lastMouseMoveTime = Date.now();
        this.restoreContentOpacity();
    }

    // Check if enough time has passed to trigger fade
    checkFadeContent() {
        if (this.fadeState === 'fade-out' || this.fadeState === 'wallpaper') {
            const contentDiv = document.getElementById('content');
            const buttons = document.querySelectorAll('.nav-btn, .wall-btn, .style-btn, .fade-toggle-btn');
            const now = Date.now();
            
            if (now - this.lastMouseMoveTime >= this.FADE_DELAY) {
                // Apply mode-specific opacity
                const opacity = this.fadeState === 'wallpaper' ? '0' : '0.3';
                contentDiv.style.opacity = opacity;
                buttons.forEach(btn => btn.style.opacity = opacity);
            }
        }
        
        this.scheduleFadeCheck();
    }

    // Schedule next fade check to run every second
    scheduleFadeCheck() {
        if (this.fadeTimeout) {
            clearTimeout(this.fadeTimeout);
        }
        this.fadeTimeout = setTimeout(() => this.checkFadeContent(), 1000);
    }

    // Restore visibility on interaction based on fade mode
    restoreContentOpacity() {
        const contentDiv = document.getElementById('content');
        const buttons = document.querySelectorAll('.nav-btn, .wall-btn, .style-btn, .fade-toggle-btn');
        
        // Make content visible unless in wallpaper mode
        if (this.fadeState !== 'wallpaper') {
            contentDiv.style.opacity = '1';
        }
        
        // Always show UI on interaction
        buttons.forEach(btn => {
            btn.style.opacity = '1';
        });
    }
}

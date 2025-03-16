/**
 * Controls content layout and visual presentation
 * Handles content formatting for different data types (lists, tables, blocks)
 * Manages content fade animation functionality
 * Provides stylesheet-aware formatting decisions
 */
export class LayoutManager {
    constructor() {
        this.fadeToggleEnabled = false;
        this.fadeTimeout = null;
        this.lastMouseMoveTime = 0;
        this.FADE_DELAY = 40000;
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
        this.fadeToggleEnabled = storage.getFadeState();
        const fadeToggleBtn = document.getElementById('fadeToggleBtn');
        
        if (this.fadeToggleEnabled) {
            fadeToggleBtn.classList.add('active');
            this.startFadeMonitoring();
        }
        
        fadeToggleBtn.addEventListener('click', () => this.toggleFade(storage));
    }

    toggleFade(storage) {
        this.fadeToggleEnabled = !this.fadeToggleEnabled;
        storage.setFadeState(this.fadeToggleEnabled);
        
        const fadeToggleBtn = document.getElementById('fadeToggleBtn');
        if (this.fadeToggleEnabled) {
            fadeToggleBtn.classList.add('active');
            this.startFadeMonitoring();
        } else {
            fadeToggleBtn.classList.remove('active');
            this.stopFadeMonitoring();
            this.restoreContentOpacity();
        }
    }

    startFadeMonitoring() {
        this.lastMouseMoveTime = Date.now();
        document.addEventListener('mousemove', () => this.handleMouseMove());
        this.scheduleFadeCheck();
    }

    stopFadeMonitoring() {
        document.removeEventListener('mousemove', () => this.handleMouseMove());
        if (this.fadeTimeout) {
            clearTimeout(this.fadeTimeout);
            this.fadeTimeout = null;
        }
    }

    handleMouseMove() {
        this.lastMouseMoveTime = Date.now();
        this.restoreContentOpacity();
    }

    checkFadeContent() {
        const contentDiv = document.getElementById('content');
        const buttons = document.querySelectorAll('.nav-btn, .wall-btn, .style-btn, .fade-toggle-btn');
        const now = Date.now();
        
        if (now - this.lastMouseMoveTime >= this.FADE_DELAY) {
            contentDiv.classList.add('fading');
            contentDiv.style.opacity = '0.3';
            buttons.forEach(btn => {
                btn.classList.add('fading');
                btn.style.opacity = '0.3';
            });
        }
        
        this.scheduleFadeCheck();
    }

    scheduleFadeCheck() {
        if (this.fadeTimeout) {
            clearTimeout(this.fadeTimeout);
        }
        this.fadeTimeout = setTimeout(() => this.checkFadeContent(), 1000);
    }

    restoreContentOpacity() {
        const contentDiv = document.getElementById('content');
        const buttons = document.querySelectorAll('.nav-btn, .wall-btn, .style-btn, .fade-toggle-btn');
        contentDiv.classList.add('fading');
        contentDiv.style.opacity = '1';
        buttons.forEach(btn => {
            btn.classList.add('fading');
            btn.style.opacity = '1';
        });
    }
}

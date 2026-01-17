/**
 * Core utility functions implementing mathematical concepts:
 * - Pure functions: No side effects, same input → same output
 * - Function composition: Combining simple functions into complex operations
 * - Monads: Wrapping operations to handle errors and state changes safely
 */

export const DOMUtils = {
    // Cache DOM queries to improve performance and reduce DOM operations
    getElement: (id) => document.getElementById(id),
    getElements: (selector) => document.querySelectorAll(selector),
    
    // Map function over DOM elements with null safety
    applyToAll: (elements, operation) => {
        if (!elements) return;
        Array.from(elements).forEach(operation);
    },

    // Batch style updates to minimize reflows and repaints
    setStyleForAll: (selector, property, value) => {
        const elements = document.querySelectorAll(selector);
        DOMUtils.applyToAll(elements, el => { el.style[property] = value; });
    },
    
    // Atomic class changes: Remove all classes then add new one
    setClassesForAll: (selector, classesToRemove, classToAdd) => {
        const elements = document.querySelectorAll(selector);
        DOMUtils.applyToAll(elements, el => {
            el.classList.remove(...classesToRemove);
            if (classToAdd) el.classList.add(classToAdd);
        });
    }
};

export const URLUtils = {
    // Immutable URL parameter handling to prevent side effects
    createPermalink: (baseUrl, params) => {
        const urlParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            urlParams.set(key, value);
        });
        return `${baseUrl}?${urlParams.toString()}`;
    },
    
    // Protocol-agnostic base URL generation
    getBaseUrl: () => {
        return window.location.protocol === 'file:' ? 
            `file:///${window.location.pathname.replace(/^\//, '')}` : 
            `${window.location.origin}${window.location.pathname}`;
    },
    
    // Predicate function for URL parameter testing
    hasAnyParams: (params, paramNames) => {
        return paramNames.some(name => params.has(name));
    }
};

export const StateUtils = {
    // Cyclic state transitions using modular arithmetic
    cycleState: (currentState, stateArray) => {
        const currentIndex = stateArray.indexOf(currentState);
        return stateArray[(currentIndex + 1) % stateArray.length];
    }
};

// Error handling using monadic pattern for predictable error flows
export const ErrorUtils = {
    // Wrap async operations in try-catch with custom error handling
    tryOperation: async (operation, errorHandler) => {
        try {
            return await operation();
        } catch (error) {
            return errorHandler(error);
        }
    }
};

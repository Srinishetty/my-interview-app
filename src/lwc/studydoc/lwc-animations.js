// LWC-specific animations
// These functions are called by onclick handlers in the LWC slides

function animateHierarchy() {
    const ids = ['h-parent', 'h-table', 'h-modal', 'h-inline', 'h-lookup', 'h-search-modal', 'h-utils'];
    ids.forEach((id, i) => {
        setTimeout(() => {
            const el = document.getElementById(id);
            if (!el) return;
            el.classList.add('visible');
            if (i > 0) setTimeout(() => el.classList.add('active'), 200);
            setTimeout(() => el.classList.remove('active'), 1500);
        }, i * 400);
    });
}

function animateLifecycle() {
    for (let i = 1; i <= 5; i++) {
        setTimeout(() => {
            const el = document.getElementById('lc-' + i);
            if (!el) return;
            el.classList.add('visible');
            if (i === 2 || i === 5) el.style.color = '#58a6ff';
            if (i === 1 || i === 4) el.style.color = '#484f58';
        }, (i - 1) * 600);
    }
}

function animateDataFlow() {
    const order = ['df-parent', 'df-arrow-down', 'df-label-props', 'df-child', 'df-arrow-up', 'df-label-events', 'df-grandchild', 'df-apex', 'df-method', 'df-summary'];
    order.forEach((id, i) => {
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.classList.add('visible');
        }, i * 350);
    });
}

function animateComm() {
    const order = ['comm-patterns', 'comm-parent', 'comm-child', 'comm-grandchild', 'comm-props-label', 'comm-events-label', 'comm-methods-label', 'comm-bubble-label'];
    order.forEach((id, i) => {
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.classList.add('visible');
        }, i * 400);
    });
}

// Journey animation
let journeyStep = 0;
const journeyDescs = [
    '1\uFE0F\u20E3 OPEN PAGE: User clicks a URL button on the record page. This opens a custom Lightning Tab with URL parameters. The LWC component mounts, and @wire(CurrentPageReference) fires automatically \u2014 it\'s a reactive wire adapter that detects URL changes.',
    '2\uFE0F\u20E3 LOAD DATA MODEL: Inside connectedCallback, the component calls getPageModel() imperatively (async/await). This Apex method reads Custom Metadata Type records to determine which tabs to show, fields, validation rules, and picklist options.',
    '3\uFE0F\u20E3 RESOLVE LOOKUP NAMES: The model contains lookup field values as raw 15/18 character Salesforce IDs. We collect ALL IDs across all tabs and make ONE batchGetLookupNames() call. This returns a Map<Id, Name> cached client-side.',
    '4\uFE0F\u20E3 RENDER THE UI: The processed model is assigned to reactive properties. LWC\'s reactivity engine detects the property change and automatically re-renders the template. Each tab renders a dynamic-editable-data-table component.',
    '5\uFE0F\u20E3 USER EDITS DATA: User can edit inline (click cell) or via modal (full form). Changes are tracked in draft state per row. Field mapping rules auto-fill dependent fields. Dependent lookup filters update dynamically.',
    '6\uFE0F\u20E3 CLIENT-SIDE VALIDATION: Before any Apex call, validateRows() runs locally. It evaluates expression-based rules from metadata. Errors are displayed as row-level icons. Warnings show a confirm dialog.',
    '7\uFE0F\u20E3 SAVE TO SERVER: Component serializes all tab data to JSON and calls saveJson(). Apex SaveHelper performs DML: INSERT, UPDATE, DELETE. On success, shows toast. On failure, shows formatted error.',
    '8\uFE0F\u20E3 NAVIGATE BACK: After save, uses window.location.href (NOT NavigationMixin) to force fresh data. SPA caching would show stale pre-save data otherwise.'
];

function animateJourney() {
    journeyStep = 0;
    const ids = ['j-1','j-2','j-3','j-4','j-5','j-6','j-7','j-8'];
    
    // Reset
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('visible', 'active');
    });

    function showStep() {
        if (journeyStep >= ids.length) return;
        
        const el = document.getElementById(ids[journeyStep]);
        if (el) {
            el.classList.add('visible', 'active');
        }
        
        if (journeyStep > 0) {
            const prev = document.getElementById(ids[journeyStep - 1]);
            if (prev) prev.classList.remove('active');
        }
        
        const desc = document.getElementById('j-desc');
        const descText = document.getElementById('j-desc-text');
        if (desc) desc.classList.add('visible');
        if (descText) descText.textContent = journeyDescs[journeyStep];
        
        journeyStep++;
        if (journeyStep < ids.length) {
            setTimeout(showStep, 2500);
        }
    }
    
    showStep();
}
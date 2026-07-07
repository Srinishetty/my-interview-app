// ===== SHARED SLIDE ENGINE =====
// Used by all topic pages (lwc.html, apex.html, flow.html, etc.)

(function() {
    'use strict';

    // ===== SLIDE NAVIGATION =====
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;

    // ===== SLIDE MENU (Table of Contents) =====
    const menuItems = document.getElementById('menuItems');
    const menuBtn = document.getElementById('menuBtn');
    const slideMenu = document.getElementById('slideMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    let menuOpen = false;

    function buildMenu() {
        let html = '';
        for (let i = 0; i < totalSlides; i++) {
            const h2 = slides[i].querySelector('h2');
            const h1 = slides[i].querySelector('h1');
            const title = (h2 ? h2.textContent : (h1 ? h1.textContent : 'Slide ' + (i + 1))).trim();
            const shortTitle = title.length > 50 ? title.substring(0, 48) + '\u2026' : title;
            html += `<div class="menu-item" data-idx="${i}" onclick="window.SlideEngine.goToSlide(${i})">`;
            html += `<span class="menu-item-num">${i + 1}</span>${shortTitle}</div>`;
        }
        if (menuItems) menuItems.innerHTML = html;
    }

    function toggleMenu() {
        menuOpen = !menuOpen;
        if (slideMenu) slideMenu.classList.toggle('open', menuOpen);
        if (menuOverlay) menuOverlay.classList.toggle('open', menuOpen);
        if (menuBtn) menuBtn.classList.toggle('active', menuOpen);
        if (menuOpen) {
            updateMenuActive();
            const search = document.getElementById('menuSearch');
            if (search) search.focus();
        }
    }

    function goToSlide(idx) {
        showSlide(idx);
        if (menuOpen) toggleMenu();
    }

    function updateMenuActive() {
        if (!menuItems) return;
        menuItems.querySelectorAll('.menu-item').forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.idx) === currentSlide);
        });
        const active = menuItems.querySelector('.menu-item.active');
        if (active) active.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    function filterMenu(query) {
        if (!menuItems) return;
        const q = query.toLowerCase();
        menuItems.querySelectorAll('.menu-item').forEach(item => {
            item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    }

    function showSlide(n) {
        if (totalSlides === 0) return;
        slides[currentSlide].classList.remove('active');
        currentSlide = Math.max(0, Math.min(n, totalSlides - 1));
        slides[currentSlide].classList.add('active');
        
        // Scroll the new slide to top
        slides[currentSlide].scrollTop = 0;
        window.scrollTo(0, 0);
        
        const progress = document.getElementById('progress');
        const slideNum = document.getElementById('slideNum');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (progress) progress.style.width = ((currentSlide + 1) / totalSlides * 100) + '%';
        if (slideNum) slideNum.textContent = `${currentSlide + 1} / ${totalSlides}`;
        if (prevBtn) prevBtn.disabled = currentSlide === 0;
        if (nextBtn) nextBtn.disabled = currentSlide === totalSlides - 1;
        if (menuOpen) updateMenuActive();
        
        // Save position
        const pageKey = document.body.dataset.page || 'default';
        localStorage.setItem('study-slide-' + pageKey, currentSlide);
    }

    function nextSlide() { showSlide(currentSlide + 1); }
    function prevSlide() { showSlide(currentSlide - 1); }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menuOpen) { toggleMenu(); return; }
        if (menuOpen) return;
        if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextSlide(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide(); }
    });

    // Touch swipe navigation is disabled; users navigate with buttons only.

    // ===== FONT SIZE CONTROL =====
    let fontScale = 100;
    function changeFontSize(dir) {
        fontScale = Math.max(70, Math.min(140, fontScale + dir * 10));
        document.documentElement.style.fontSize = fontScale + '%';
        localStorage.setItem('study-fontscale', fontScale);
    }
    const savedScale = localStorage.getItem('study-fontscale');
    if (savedScale) { fontScale = parseInt(savedScale); document.documentElement.style.fontSize = fontScale + '%'; }

    // ===== THEME TOGGLE =====
    function toggleTheme() {
        const isLight = document.body.classList.toggle('light');
        const btn = document.getElementById('themeBtn');
        if (btn) btn.textContent = isLight ? '\uD83C\uDF19' : '\u2600\uFE0F';
        localStorage.setItem('study-theme', isLight ? 'light' : 'dark');
    }
    // Restore saved theme
    const savedTheme = localStorage.getItem('study-theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light');
        const btn = document.getElementById('themeBtn');
        if (btn) btn.textContent = '\uD83C\uDF19';
    }

    // ===== SYNTAX HIGHLIGHTING =====
    function highlightCode() {
        document.querySelectorAll('pre code').forEach(block => {
            const text = block.textContent;
            let escaped = text
                .replace(/&/g, '\x01AMP\x01')
                .replace(/</g, '\x01LT\x01')
                .replace(/>/g, '\x01GT\x01');

            // Comments
            escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '\x02COMMENT\x03$1\x02END\x03');
            escaped = escaped.replace(/(\/\/[^\n]*)/g, '\x02COMMENT\x03$1\x02END\x03');
            // Decorators
            escaped = escaped.replace(/@(api|wire|track|AuraEnabled|TestSetup|override|IsTest|testVisible|InvocableMethod|InvocableVariable)\b/g, '\x02DECORATOR\x03@$1\x02END\x03');
            // Strings
            escaped = escaped.replace(/(`(?:[^`\\]|\\.)*`)/g, '\x02TEMPLATE\x03$1\x02END\x03');
            escaped = escaped.replace(/('(?:[^'\\\n]|\\.)*')/g, '\x02STRING\x03$1\x02END\x03');
            escaped = escaped.replace(/("(?:[^"\\\n]|\\.)*")/g, '\x02STRING\x03$1\x02END\x03');

            // Keywords
            const kw = 'import|export|from|default|const|let|var|function|class|extends|return|if|else|for|while|do|switch|case|break|continue|new|this|super|try|catch|finally|throw|async|await|yield|of|in|typeof|instanceof|void|delete|static|get|set|public|private|global|virtual|abstract|override|with|sharing|without|trigger|select|insert|update|upsert|merge';
            escaped = escaped.replace(new RegExp('\\b(' + kw + ')\\b', 'g'), (m, w, offset, str) => {
                const before = str.substring(0, offset);
                const opens = (before.match(/\x02/g) || []).length;
                const closes = (before.match(/\x02END\x03/g) || []).length;
                if (opens > closes) return m;
                return '\x02KEYWORD\x03' + w + '\x02END\x03';
            });

            // Built-ins
            const builtins = 'console|document|window|JSON|Math|Date|Array|Object|Map|Set|Promise|Error|setTimeout|Number|String|Boolean|System|Test|Assert|Database|Schema|UserInfo|Limits';
            escaped = escaped.replace(new RegExp('\\b(' + builtins + ')\\b', 'g'), (m, w, offset, str) => {
                const before = str.substring(0, offset);
                const opens = (before.match(/\x02/g) || []).length;
                const closes = (before.match(/\x02END\x03/g) || []).length;
                if (opens > closes) return m;
                return '\x02BUILTIN\x03' + w + '\x02END\x03';
            });

            // Numbers
            escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, (m, n, offset, str) => {
                const before = str.substring(0, offset);
                const opens = (before.match(/\x02/g) || []).length;
                const closes = (before.match(/\x02END\x03/g) || []).length;
                if (opens > closes) return m;
                return '\x02NUMBER\x03' + n + '\x02END\x03';
            });

            // Function calls
            escaped = escaped.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, (m, fn, offset, str) => {
                const before = str.substring(0, offset);
                const opens = (before.match(/\x02/g) || []).length;
                const closes = (before.match(/\x02END\x03/g) || []).length;
                if (opens > closes) return m;
                if (new RegExp('^(' + kw + ')$').test(fn)) return m;
                return '\x02FUNCTION\x03' + fn + '\x02END\x03';
            });

            // HTML tags in code
            escaped = escaped.replace(/\x01LT\x01(\/?)([a-zA-Z][a-zA-Z0-9-]*)/g, (m, slash, tag, offset, str) => {
                const before = str.substring(0, offset);
                const opens = (before.match(/\x02/g) || []).length;
                const closes = (before.match(/\x02END\x03/g) || []).length;
                if (opens > closes) return m;
                return '\x01LT\x01' + slash + '\x02TAG\x03' + tag + '\x02END\x03';
            });

            // Convert placeholders to HTML
            escaped = escaped
                .replace(/\x01AMP\x01/g, '&amp;')
                .replace(/\x01LT\x01/g, '&lt;')
                .replace(/\x01GT\x01/g, '&gt;')
                .replace(/\x02COMMENT\x03/g, '<span class="hljs-comment">')
                .replace(/\x02STRING\x03/g, '<span class="hljs-string">')
                .replace(/\x02TEMPLATE\x03/g, '<span class="hljs-template">')
                .replace(/\x02DECORATOR\x03/g, '<span class="hljs-decorator">')
                .replace(/\x02KEYWORD\x03/g, '<span class="hljs-keyword">')
                .replace(/\x02BUILTIN\x03/g, '<span class="hljs-built-in">')
                .replace(/\x02NUMBER\x03/g, '<span class="hljs-number">')
                .replace(/\x02FUNCTION\x03/g, '<span class="hljs-function">')
                .replace(/\x02TAG\x03/g, '<span class="hljs-tag">')
                .replace(/\x02END\x03/g, '</span>');

            block.innerHTML = escaped;
        });
    }

    // ===== DOUBLE-TAP TO ZOOM CODE (Mobile) =====
    let lastTap = 0;
    document.addEventListener('click', (e) => {
        const pre = e.target.closest('pre');
        if (!pre) return;
        const now = Date.now();
        if (now - lastTap < 350) {
            pre.style.fontSize = pre.style.fontSize === '1.2em' ? '' : '1.2em';
            pre.style.whiteSpace = pre.style.whiteSpace === 'pre-wrap' ? '' : 'pre-wrap';
        }
        lastTap = now;
    });

    // ===== INITIALIZE =====
    buildMenu();
    showSlide(0);
    highlightCode();

    // Restore saved slide position
    const pageKey = document.body.dataset.page || 'default';
    const savedSlide = localStorage.getItem('study-slide-' + pageKey);
    if (savedSlide && parseInt(savedSlide) < totalSlides) {
        showSlide(parseInt(savedSlide));
    }

    // ===== PUBLIC API =====
    window.SlideEngine = {
        nextSlide, prevSlide, showSlide, goToSlide,
        toggleMenu, filterMenu, changeFontSize, toggleTheme,
        highlightCode
    };

    // Expose for onclick handlers
    window.nextSlide = nextSlide;
    window.prevSlide = prevSlide;
    window.toggleMenu = toggleMenu;
    window.filterMenu = filterMenu;
    window.changeFontSize = changeFontSize;
    window.toggleTheme = toggleTheme;
})();
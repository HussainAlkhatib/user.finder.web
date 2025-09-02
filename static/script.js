document.addEventListener('DOMContentLoaded', () => {

    const translations = {
        en: {
            pageTitle: 'User Finder Pro',
            pageSubtitle: 'Discover available usernames across all major platforms.',
            smartModeBtn: 'Smart Search',
            matrixModeBtn: 'Matrix Check',
            randomModeBtn: 'Random Finder',
            keywordPlaceholder: 'Enter a keyword...',
            maxLengthPlaceholder: 'Max Len',
            findUsernamesBtn: 'Find Usernames',
            checkAllBtn: 'Check All Platforms',
            lengthPlaceholder: 'Length',
            countPlaceholder: 'How many?',
            footerText: 'Developed By Hussain Alkhatib',
            available: 'Available!',
            taken: 'Taken',
            noUsernamesFound: 'No available usernames found. Try different criteria!',
            errorOccurred: 'An error occurred: ',
            advancedToggle: 'Advanced Options',
            startsWithPlaceholder: 'Starts with...',
            endsWithPlaceholder: 'Ends with...',
            includeNumbersLabel: 'Numbers',
            includeLettersLabel: 'Letters',
            selectAll: 'Select All',
            historyTitle: 'Recent Searches',
            statsTitle: 'Search Complete!',
            found: 'Found',
            in: 'in',
            seconds: 'seconds'
        },
        ar: {
            pageTitle: 'باحث اليوزرات الاحترافي',
            pageSubtitle: 'اكتشف اليوزرات المتاحة في جميع المنصات الكبرى.',
            smartModeBtn: 'بحث ذكي',
            matrixModeBtn: 'فحص شامل',
            randomModeBtn: 'بحث عشوائي',
            keywordPlaceholder: 'أدخل كلمة مفتاحية...',
            maxLengthPlaceholder: 'أقصى طول',
            findUsernamesBtn: 'ابحث عن يوزرات',
            checkAllBtn: 'افحص كل المنصات',
            lengthPlaceholder: 'الطول',
            countPlaceholder: 'العدد؟',
            footerText: 'تم التطوير بواسطة حسين الخطيب',
            available: 'متاح!',
            taken: 'مأخوذ',
            noUsernamesFound: 'لم يتم العثور على يوزرات. جرب معايير مختلفة!',
            errorOccurred: 'حدث خطأ: ',
            advancedToggle: 'خيارات متقدمة',
            startsWithPlaceholder: 'يبدأ بـ...',
            endsWithPlaceholder: 'ينتهي بـ...',
            includeNumbersLabel: 'أرقام',
            includeLettersLabel: 'حروف',
            selectAll: 'تحديد الكل',
            historyTitle: 'عمليات البحث الأخيرة',
            statsTitle: 'اكتمل البحث!',
            found: 'تم العثور على',
            in: 'في',
            seconds: 'ثواني'
        }
    };

    // --- Element Selections ---
    const themeToggleButton = document.getElementById('theme-toggle');
    const langToggleButton = document.getElementById('lang-toggle');
    const modeButtons = document.querySelectorAll('.mode-btn');
    const forms = {
        smart: document.getElementById('smart-form'),
        matrix: document.getElementById('matrix-form'),
        random: document.getElementById('random-form')
    };
    const resultsContainer = document.getElementById('results-container');
    const statsContainer = document.getElementById('stats-container');
    const historyContainer = document.getElementById('history-container');
    const loadingOverlay = document.querySelector('.loading-overlay');
    const advancedToggle = document.getElementById('advanced-toggle');
    const advancedPanel = document.getElementById('advanced-panel');

    // --- State Management ---
    let activeMode = 'smart';
    let availablePlatforms = [];
    let currentLang = 'en';

    // --- INITIALIZATION ---
    async function initialize() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedLang = localStorage.getItem('language') || 'en';
        setTheme(savedTheme);
        setLanguage(savedLang);

        try {
            const response = await fetch('/api/platforms');
            availablePlatforms = await response.json();
            initializePlatformSelectors();
        } catch (error) {
            console.error("Failed to fetch platforms:", error);
        }
        
        updateActiveMode();
        loadHistory();
    }

    // --- THEME & LANGUAGE ---
    themeToggleButton.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });

    langToggleButton.addEventListener('click', () => {
        const newLang = document.documentElement.lang === 'ar' ? 'en' : 'ar';
        setLanguage(newLang);
        localStorage.setItem('language', newLang);
    });

    function setTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        themeToggleButton.textContent = theme === 'dark' ? '☀️' : '🌓';
    }

    function setLanguage(lang) {
        currentLang = lang;
        const html = document.documentElement;
        html.lang = lang;
        html.dir = lang === 'ar' ? 'rtl' : 'ltr';
        langToggleButton.textContent = lang === 'ar' ? 'En' : 'ع';

        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.dataset.translateKey;
            if (translations[lang][key]) el.textContent = translations[lang][key];
        });
        document.querySelectorAll('[data-translate-key-placeholder]').forEach(el => {
            const key = el.dataset.translateKeyPlaceholder;
            if (translations[lang][key]) el.placeholder = translations[lang][key];
        });
    }

    // --- UI & FORM LOGIC ---
    function initializePlatformSelectors() {
        const selectors = ['smart-platform-selector', 'random-platform-selector'];
        selectors.forEach(selectorId => {
            const container = document.getElementById(selectorId);
            if (!container) return;

            const header = document.createElement('div');
            header.className = 'platform-selector-header';
            header.innerHTML = `
                <label class="select-all-label">
                    <input type="checkbox" class="select-all-checkbox">
                    <span data-translate-key="selectAll">${translations[currentLang].selectAll}</span>
                </label>`;
            container.appendChild(header);

            const grid = document.createElement('div');
            grid.className = 'platform-grid';
            availablePlatforms.forEach(platform => {
                const label = document.createElement('label');
                label.className = 'platform-checkbox-label';
                label.innerHTML = `<input type="checkbox" name="platform" value="${platform}" checked> ${platform}`;
                grid.appendChild(label);
            });
            container.appendChild(grid);

            container.querySelector('.select-all-checkbox').addEventListener('change', (e) => {
                container.querySelectorAll('input[name="platform"]').forEach(chk => {
                    chk.checked = e.target.checked;
                });
            });
        });
    }

    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            activeMode = button.dataset.mode;
            updateActiveMode();
        });
    });

    advancedToggle.addEventListener('click', (e) => {
        e.preventDefault();
        advancedPanel.classList.toggle('active');
        advancedToggle.textContent = advancedPanel.classList.contains('active') ? 
            `${translations[currentLang].advancedToggle.replace('▼','▲')} ▲` : 
            `${translations[currentLang].advancedToggle.replace('▲','▼')} ▼`;
    });

    function updateActiveMode() {
        modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === activeMode));
        Object.values(forms).forEach(form => form.classList.remove('active-form'));
        forms[activeMode].classList.add('active-form');
        resultsContainer.innerHTML = '';
        statsContainer.innerHTML = '';
    }

    // --- API & SUBMISSION ---
    forms.smart.addEventListener('submit', e => handleFormSubmit(e, 'smart'));
    forms.matrix.addEventListener('submit', e => handleFormSubmit(e, 'matrix'));
    forms.random.addEventListener('submit', e => handleFormSubmit(e, 'random'));

    async function handleFormSubmit(event, mode) {
        event.preventDefault();
        loadingOverlay.style.display = 'flex';
        resultsContainer.innerHTML = '';
        statsContainer.innerHTML = '';
        const startTime = Date.now();

        let payload = { mode };
        let selectedPlatforms = [];

        if (mode === 'smart' || mode === 'random') {
            const selectorId = mode === 'smart' ? 'smart-platform-selector' : 'random-platform-selector';
            document.querySelectorAll(`#${selectorId} input[name="platform"]:checked`).forEach(chk => {
                selectedPlatforms.push(chk.value);
            });
            if (selectedPlatforms.length === 0) {
                renderError(new Error("Please select at least one platform."));
                loadingOverlay.style.display = 'none';
                return;
            }
            payload.platforms = selectedPlatforms;
        }

        if (mode === 'smart') {
            payload.keyword = document.getElementById('keyword').value;
            payload.maxLength = document.getElementById('maxLength').value;
            // Add advanced options to payload if you modify the backend to use them
        } else if (mode === 'matrix') {
            payload.username = document.getElementById('matrix-username').value;
        } else if (mode === 'random') {
            payload.length = document.getElementById('random-length').value;
            payload.count = document.getElementById('random-count').value;
        }
        
        saveSearchToHistory(payload);

        try {
            const response = await fetch('/api/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const endTime = Date.now();
            renderResults(data, mode, { time: ((endTime - startTime) / 1000).toFixed(2), count: Array.isArray(data) ? data.length : 0 });

        } catch (error) {
            renderError(error);
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }

    // --- RENDERING RESULTS ---
    function renderResults(data, mode, stats) {
        renderStats(stats, mode);
        if (mode === 'matrix') {
            renderMatrixResults(data);
        } else {
            renderGroupedListResults(data);
        }
    }

    function renderStats(stats, mode) {
        if (mode === 'matrix') {
            statsContainer.innerHTML = '';
            return;
        }
        statsContainer.innerHTML = `
            <div class="stats-card">
                <h3>${translations[currentLang].statsTitle}</h3>
                <p>${translations[currentLang].found} <strong>${stats.count}</strong> ${translations[currentLang].pageSubtitle.toLowerCase().includes('usernames') ? 'usernames' : 'يوزرات'} ${translations[currentLang].in} ${stats.time} ${translations[currentLang].seconds}.</p>
            </div>`;
    }

    function renderGroupedListResults(results) {
        if (results.length === 0) {
            resultsContainer.innerHTML = `<div class="result-card"><p class="status-taken">${translations[currentLang].noUsernamesFound}</p></div>`;
            return;
        }

        const grouped = results.reduce((acc, { platform, username }) => {
            if (!acc[username]) acc[username] = [];
            acc[username].push(platform);
            return acc;
        }, {});

        const sortedUsernames = Object.keys(grouped).sort();

        sortedUsernames.forEach(username => {
            const card = document.createElement('div');
            card.className = 'result-card';
            let platformHtml = '';
            grouped[username].forEach(p => { platformHtml += `<span class="platform-tag">${p}</span>`; });
            
            card.innerHTML = `
                <div class="username-section">
                    <span class="username">${username}</span>
                    <div class="platform-tags">${platformHtml}</div>
                </div>
                <span class="status-available">${translations[currentLang].available}</span>`;
            resultsContainer.appendChild(card);
        });
    }

    function renderMatrixResults(platforms) {
        const sortedPlatforms = Object.entries(platforms).sort((a, b) => a[0].localeCompare(b[0]));
        sortedPlatforms.forEach(([platform, isAvailable]) => {
            const card = document.createElement('div');
            card.className = 'matrix-result-card';
            const statusClass = isAvailable ? 'status-available' : 'status-taken';
            const statusText = isAvailable ? translations[currentLang].available : translations[currentLang].taken;
            card.innerHTML = `<span class="platform-name">${platform}</span><span class="${statusClass}">${statusText}</span>`;
            resultsContainer.appendChild(card);
        });
    }

    function renderError(error) {
        statsContainer.innerHTML = '';
        resultsContainer.innerHTML = `<div class="result-card"><p class="status-taken">${translations[currentLang].errorOccurred}${error.message}</p></div>`;
    }

    // --- HISTORY ---
    function saveSearchToHistory(payload) {
        let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        // Avoid saving duplicate consecutive searches
        if (JSON.stringify(history[0]) === JSON.stringify(payload)) return;

        history.unshift(payload);
        history = history.slice(0, 5); // Keep last 5 searches
        localStorage.setItem('searchHistory', JSON.stringify(history));
        loadHistory();
    }

    function loadHistory() {
        let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        historyContainer.innerHTML = '';
        if (history.length === 0) return;

        const title = document.createElement('h3');
        title.textContent = translations[currentLang].historyTitle;
        historyContainer.appendChild(title);

        history.forEach(item => {
            const card = document.createElement('div');
            card.className = 'history-card';
            let text = `<strong>${item.mode}:</strong> `;
            if(item.keyword) text += `${item.keyword}, `;
            if(item.username) text += `${item.username}, `;
            if(item.platforms) text += `[${item.platforms.join(', ')}]`;
            card.innerHTML = text;
            card.addEventListener('click', () => repopulateForm(item));
            historyContainer.appendChild(card);
        });
    }

    function repopulateForm(item) {
        activeMode = item.mode;
        updateActiveMode();
        if (item.mode === 'smart') {
            document.getElementById('keyword').value = item.keyword;
            document.getElementById('maxLength').value = item.maxLength;
            document.querySelectorAll('#smart-platform-selector input[name="platform"]').forEach(chk => {
                chk.checked = item.platforms.includes(chk.value);
            });
        }
        // Add similar logic for other modes if needed
    }

    // --- Start the application ---
    initialize();
});

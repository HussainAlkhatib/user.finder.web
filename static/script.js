document.addEventListener('DOMContentLoaded', () => {

    // --- DICTIONARY FOR TRANSLATION ---
    const translations = {
        en: {
            pageTitle: 'User Finder',
            pageSubtitle: 'The tool is free',
            smartModeBtn: 'Smart Keyword',
            matrixModeBtn: 'Matrix Check',
            randomModeBtn: 'Random',
            keywordPlaceholder: 'Enter a keyword (e.g., your name)',
            maxLengthPlaceholder: 'Max Length',
            findUsernamesBtn: 'Find Usernames',
            matrixPlaceholder: 'Enter username to check everywhere',
            checkAllBtn: 'Check All Platforms',
            lengthPlaceholder: 'Length',
            countPlaceholder: 'How many?',
            footerText: 'Developed By Hussain Alkhatib',
            available: 'Available!',
            taken: 'Taken',
            noUsernamesFound: 'No available usernames found with these criteria.',
            errorOccurred: 'An error occurred: '
        },
        ar: {
            pageTitle: 'باحث اليوزرات',
            pageSubtitle: 'الأداة مجانية',
            smartModeBtn: 'بحث ذكي بالكلمة',
            matrixModeBtn: 'فحص شامل',
            randomModeBtn: 'بحث عشوائي',
            keywordPlaceholder: 'أدخل كلمة مفتاحية (مثل اسمك)',
            maxLengthPlaceholder: 'أقصى طول',
            findUsernamesBtn: 'ابحث عن يوزرات',
            matrixPlaceholder: 'أدخل يوزر لفحصه في كل مكان',
            checkAllBtn: 'افحص كل المنصات',
            lengthPlaceholder: 'الطول',
            countPlaceholder: 'العدد؟',
            footerText: 'تم التطوير بواسطة حسين الخطيب',
            available: 'متاح!',
            taken: 'مأخوذ',
            noUsernamesFound: 'لم يتم العثور على أي يوزرات متاحة بهذه المعايير.',
            errorOccurred: 'حدث خطأ: '
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
    const loadingOverlay = document.querySelector('.loading-overlay');

    // --- State Management ---
    let activeMode = 'smart';
    let availablePlatforms = [];
    let selectedPlatform = '';
    let currentLang = 'en';
    let currentTheme = 'light';

    // --- THEME & LANGUAGE TOGGLE LOGIC ---
    themeToggleButton.addEventListener('click', () => {
        currentTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
        setTheme(currentTheme);
        localStorage.setItem('theme', currentTheme);
    });

    langToggleButton.addEventListener('click', () => {
        currentLang = document.documentElement.lang === 'ar' ? 'en' : 'ar';
        setLanguage(currentLang);
        localStorage.setItem('language', currentLang);
    });

    function setTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        themeToggleButton.textContent = theme === 'dark' ? '☀️' : '🌓';
    }

    function setLanguage(lang) {
        const html = document.documentElement;
        html.lang = lang;
        html.dir = lang === 'ar' ? 'rtl' : 'ltr';
        langToggleButton.textContent = lang === 'ar' ? 'En' : 'ع';

        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.dataset.translateKey;
            el.textContent = translations[lang][key];
        });

        document.querySelectorAll('[data-translate-key-placeholder]').forEach(el => {
            const key = el.dataset.translateKeyPlaceholder;
            el.placeholder = translations[lang][key];
        });
    }

    // --- INITIALIZATION ---
    async function initialize() {
        // Load saved settings
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedLang = localStorage.getItem('language') || 'en';
        setTheme(savedTheme);
        setLanguage(savedLang);

        try {
            const response = await fetch('/api/platforms');
            availablePlatforms = await response.json();
            if (availablePlatforms.length > 0) {
                selectedPlatform = availablePlatforms[0];
            }
            initializePlatformPills();
            updateActiveMode();
        } catch (error) {
            console.error("Failed to fetch platforms:", error);
        }
    }

    function initializePlatformPills() {
        const pillContainers = document.querySelectorAll('.platform-pills');
        pillContainers.forEach(container => { container.innerHTML = ''; availablePlatforms.forEach(platform => {
                const pill = document.createElement('div');
                pill.className = 'platform-pill';
                pill.textContent = platform;
                pill.dataset.platform = platform;
                if (platform === selectedPlatform) {
                    pill.classList.add('selected');
                }
                container.appendChild(pill);
            });
        });
    }

    // --- Event Listeners ---
    modeButtons.forEach(button => {
        button.addEventListener('click', () => {
            activeMode = button.dataset.mode;
            updateActiveMode();
        });
    });

    document.querySelectorAll('.platform-pills').forEach(container => {
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('platform-pill')) {
                selectedPlatform = e.target.dataset.platform;
                document.querySelectorAll('.platform-pills .platform-pill').forEach(pill => {
                    pill.classList.toggle('selected', pill.dataset.platform === selectedPlatform);
                });
            }
        });
    });

    forms.smart.addEventListener('submit', e => handleFormSubmit(e, 'smart'));
    forms.matrix.addEventListener('submit', e => handleFormSubmit(e, 'matrix'));
    forms.random.addEventListener('submit', e => handleFormSubmit(e, 'random'));

    function updateActiveMode() {
        modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === activeMode));
        Object.values(forms).forEach(form => form.classList.remove('active-form'));
        forms[activeMode].classList.add('active-form');
        resultsContainer.innerHTML = '';
    }

    // --- API & RENDERING LOGIC ---
    async function handleFormSubmit(event, mode) {
        event.preventDefault();
        loadingOverlay.style.display = 'flex';
        resultsContainer.innerHTML = '';

        let payload = { mode };

        if (mode === 'smart') {
            payload.keyword = document.getElementById('keyword').value;
            payload.maxLength = document.getElementById('maxLength').value;
            payload.platform = selectedPlatform;
        } else if (mode === 'matrix') {
            payload.username = document.getElementById('matrix-username').value;
        } else if (mode === 'random') {
            payload.length = document.getElementById('random-length').value;
            payload.count = document.getElementById('random-count').value;
            payload.platform = selectedPlatform;
        }

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
            renderResults(data, mode);

        } catch (error) {
            renderError(error);
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }

    function renderResults(data, mode) {
        if (mode === 'matrix') {
            renderMatrixResults(data);
        } else {
            renderListResults(data);
        }
    }

    function renderListResults(usernames) {
        if (usernames.length === 0) {
            resultsContainer.innerHTML = `<div class="result-card"><p class="status-taken">${translations[currentLang].noUsernamesFound}</p></div>`;
            return;
        }
        usernames.forEach(user => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.innerHTML = `<span class="username">${user}</span><span class="status-available">${translations[currentLang].available}</span>`;
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
        resultsContainer.innerHTML = `<div class="result-card"><p class="status-taken">${translations[currentLang].errorOccurred}${error.message}</p></div>`;
    }

    // --- Start the application ---
    initialize();
});
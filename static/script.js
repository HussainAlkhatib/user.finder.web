document.addEventListener('DOMContentLoaded', () => {

    const translations = {
        en: {
            pageTitle: 'User Finder',
            pageSubtitle: 'Your All-in-One Identity Search',
            smartModeBtn: 'Smart Search',
            matrixModeBtn: 'Matrix Check',
            domainModeBtn: 'Domain Search',
            keywordPlaceholder: 'Enter a keyword...',
            maxLengthPlaceholder: 'Max Len',
            matrixPlaceholder: 'Enter username to check',
            domainPlaceholder: 'Enter keyword for domains',
            findUsernamesBtn: 'Find Usernames',
            checkAllBtn: 'Check All Platforms',
            domainFindBtn: 'Find Domains',
            footerText: 'Developed By Hussain Alkhatib',
            githubLink: 'GitHub',
            available: 'Available!',
            taken: 'Taken',
            errorOccurred: 'An error occurred: ',
            noUsernamesFound: 'No available usernames found. Try different criteria!',
            noDomainsFound: 'No available domains found for this keyword.',
            resultsTitle: 'Results',
            chatTitle: 'Najm Assistant',
            chatWelcome: 'Hello! I\'m Najm, your AI assistant. How can I help you find the perfect digital identity today?',
            chatPlaceholder: 'Ask Najm...',
            chatSend: 'Send',
            quality: 'Quality',
            selectAll: 'Select All',
            deselectAll: 'Deselect All',
        },
        ar: {
            pageTitle: 'باحث اليوزرات',
            pageSubtitle: 'بحثك المتكامل عن الهوية الرقمية',
            smartModeBtn: 'بحث ذكي',
            matrixModeBtn: 'فحص شامل',
            domainModeBtn: 'بحث النطاقات',
            keywordPlaceholder: 'أدخل كلمة مفتاحية...',
            maxLengthPlaceholder: 'أقصى طول',
            matrixPlaceholder: 'أدخل اسم مستخدم للتحقق منه',
            domainPlaceholder: 'أدخل كلمة مفتاحية للنطاقات',
            findUsernamesBtn: 'ابحث عن يوزرات',
            checkAllBtn: 'افحص كل المنصات',
            domainFindBtn: 'ابحث عن نطاقات',
            footerText: 'تم التطوير بواسطة حسين الخطيب',
            githubLink: 'GitHub',
            available: 'متاح!',
            taken: 'مأخوذ',
            errorOccurred: 'حدث خطأ: ',
            noUsernamesFound: 'لم يتم العثور على أسماء مستخدمين متاحة. جرب معايير مختلفة!',
            noDomainsFound: 'لم يتم العثور على نطاقات متاحة لهذه الكلمة.',
            resultsTitle: 'النتائج',
            chatTitle: 'مساعدك نجم',
            chatWelcome: 'أهلاً بك! أنا نجم، مساعدك الذكي. كيف يمكنني مساعدتك في العثور على هويتك الرقمية المثالية اليوم؟',
            chatPlaceholder: 'اسأل نجم...',
            chatSend: 'أرسل',
            quality: 'الجودة',
            selectAll: 'تحديد الكل',
            deselectAll: 'إلغاء تحديد الكل',
        }
    };

    // --- Element Selections ---
    const themeToggleButton = document.getElementById('theme-toggle');
    const langToggleButton = document.getElementById('lang-toggle');
    const modeButtons = document.querySelectorAll('.mode-btn');
    const forms = {
        smart: document.getElementById('smart-form'),
        matrix: document.getElementById('matrix-form'),
        domain: document.getElementById('domain-form'),
    };
    const loadingOverlay = document.querySelector('.loading-overlay');
    const resultsArea = document.getElementById('results-area');
    const resultsContent = document.getElementById('results-content');

    // --- State Management ---
    let activeMode = 'smart';
    let currentLang = 'en';
    let availablePlatforms = [];

    // --- INITIALIZATION ---
    async function initialize() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedLang = localStorage.getItem('language') || 'en';
        setTheme(savedTheme);
        setLanguage(savedLang);

        try {
            const [platformsRes, vibesRes] = await Promise.all([
                fetch('/api/platforms'),
                fetch('/api/vibes')
            ]);
            availablePlatforms = await platformsRes.json();
            const availableVibes = await vibesRes.json();
            initializePlatformSelector();
            initializeVibeSelector(availableVibes);
        } catch (error) {
            console.error("Failed to fetch initial data:", error);
        }
        
        updateActiveMode();
        setupEventListeners();
        initializeChatWidget();
    }

    // --- EVENT LISTENERS SETUP ---
    function setupEventListeners() {
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

        modeButtons.forEach(button => {
            button.addEventListener('click', () => {
                activeMode = button.dataset.mode;
                updateActiveMode();
            });
        });

        for (const mode in forms) {
            if (forms[mode]) {
                forms[mode].addEventListener('submit', e => handleFormSubmit(e, mode));
            }
        }
    }

    // --- THEME & LANGUAGE ---
    function setTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        themeToggleButton.textContent = theme === 'dark' ? '☀️' : '🌓';
    }

    function setLanguage(lang) {
        currentLang = lang;
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
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
    function initializePlatformSelector() {
        const container = document.getElementById('smart-platform-selector');
        if (!container) return;
        container.innerHTML = `
            <div class="platform-selector-header">
                <button type="button" class="platform-control-btn select-all-btn">${translations[currentLang].selectAll}</button>
                <button type="button" class="platform-control-btn deselect-all-btn">${translations[currentLang].deselectAll}</button>
            </div>
            <div class="platform-grid"></div>`;
        const grid = container.querySelector('.platform-grid');
        availablePlatforms.forEach(platform => {
            const label = document.createElement('label');
            label.className = 'platform-checkbox-label';
            label.innerHTML = `<input type="checkbox" name="platform" value="${platform}" checked><span>${platform}</span>`;
            grid.appendChild(label);
        });
        container.querySelector('.select-all-btn').addEventListener('click', () => {
            container.querySelectorAll('input[name="platform"]').forEach(chk => chk.checked = true);
        });
        container.querySelector('.deselect-all-btn').addEventListener('click', () => {
            container.querySelectorAll('input[name="platform"]').forEach(chk => chk.checked = false);
        });
    }

    function initializeVibeSelector(vibes) {
        const selector = document.getElementById('vibe-selector');
        if (!selector) return;
        selector.innerHTML = ''; // Clear existing options
        for (const vibe in vibes) {
            const option = document.createElement('option');
            option.value = vibe;
            option.textContent = vibe.charAt(0).toUpperCase() + vibe.slice(1);
            selector.appendChild(option);
        }
    }

    function updateActiveMode() {
        modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === activeMode));
        Object.values(forms).forEach(form => form.classList.remove('active-form'));
        if (forms[activeMode]) {
            forms[activeMode].classList.add('active-form');
        }
        resultsArea.style.display = 'none';
    }

    // --- API & SUBMISSION ---
    async function handleFormSubmit(event, mode) {
        event.preventDefault();
        loadingOverlay.style.display = 'flex';
        resultsArea.style.display = 'none';
        resultsContent.innerHTML = '';

        let payload = { mode };
        let endpoint = '/api/check';

        if (mode === 'smart') {
            payload.keyword = document.getElementById('keyword').value;
            payload.maxLength = document.getElementById('maxLength').value;
            payload.vibe = document.getElementById('vibe-selector').value;
            payload.platforms = Array.from(document.querySelectorAll(`#smart-platform-selector input[name="platform"]:checked`)).map(chk => chk.value);
        } else if (mode === 'matrix') {
            payload.username = document.getElementById('matrix-username').value;
        } else if (mode === 'domain') {
            payload.keyword = document.getElementById('domain-keyword').value;
            endpoint = '/api/check_domains';
        }

        try {
            const response = await fetch(endpoint, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload) 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            resultsArea.style.display = 'block';
            renderResults(data, mode);

        } catch (error) {
            renderError(error);
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }

    // --- RENDERING ---
    function renderResults(data, mode) {
        resultsContent.innerHTML = ''; // Clear previous results

        if (mode === 'smart') {
            renderGroupedListResults(data);
        } else if (mode === 'matrix') {
            renderMatrixResults(data);
        } else if (mode === 'domain') {
            renderDomainResults(data);
        }
    }

    function renderGroupedListResults(results) {
        if (results.length === 0) {
            resultsContent.innerHTML = `<div class="result-card-plain"><p>${translations[currentLang].noUsernamesFound}</p></div>`;
            return;
        }
        const grouped = results.reduce((acc, { platform, username, quality }) => {
            if (!acc[username]) acc[username] = { platforms: [], quality: quality };
            acc[username].platforms.push(platform);
            return acc;
        }, {});

        const sortedUsernames = Object.keys(grouped).sort((a, b) => grouped[b].quality - grouped[a].quality || a.localeCompare(b));

        resultsContent.innerHTML = ''; // Clear previous results
        sortedUsernames.forEach(username => {
            const { platforms, quality } = grouped[username];
            const card = document.createElement('div');
            card.className = 'result-card-smart';
            const platformHtml = platforms.map(p => `<span class="platform-tag">${p}</span>`).join('');
            card.innerHTML = `
                <div class="username-section">
                    <span class="username">${username}</span>
                    <div class="platform-tags">${platformHtml}</div>
                </div>
                <div class="quality-section">
                    <span class="quality-text">${translations[currentLang].quality}</span>
                    <div class="stars">${'★'.repeat(quality)}${'☆'.repeat(5 - quality)}</div>
                </div>`;
            resultsContent.appendChild(card);
        });
    }

    function renderDomainResults(domains) {
        const availableDomains = Object.entries(domains).filter(([_, isAvailable]) => isAvailable);
        if (availableDomains.length === 0) {
            resultsContent.innerHTML = `<div class="result-card-plain"><p>${translations[currentLang].noDomainsFound}</p></div>`;
            return;
        }
        availableDomains.forEach(([domain, _]) => {
            const card = document.createElement('div');
            card.className = 'result-card-matrix';
            card.innerHTML = `<span class="platform-name">${domain}</span><span class="status-available">${translations[currentLang].available}</span>`;
            resultsContent.appendChild(card);
        });
    }

    function renderMatrixResults(platforms) {
        const sortedPlatforms = Object.entries(platforms).sort((a, b) => a[0].localeCompare(b[0]));
        sortedPlatforms.forEach(([platform, isAvailable]) => {
            const card = document.createElement('div');
            card.className = 'result-card-matrix';
            const statusClass = isAvailable ? 'status-available' : 'status-taken';
            const statusText = isAvailable ? translations[currentLang].available : translations[currentLang].taken;
            card.innerHTML = `<span class="platform-name">${platform}</span><span class="${statusClass}">${statusText}</span>`;
            resultsContent.appendChild(card);
        });
    }
    
    function renderError(error) {
        resultsArea.style.display = 'block';
        resultsContent.innerHTML = `<div class="result-card-plain"><p class="status-taken">${translations[currentLang].errorOccurred}${error.message}</p></div>`;
    }

    // --- NAJM AI Chat Widget Logic ---
    function initializeChatWidget() {
        const najmAiButton = document.getElementById('najm-ai-button');
        const closeChatButton = document.getElementById('close-chat-btn');
        const chatWidget = document.getElementById('najm-chat-widget');
        const chatInput = document.getElementById('chat-input');
        const sendChatButton = document.getElementById('send-chat-btn');
        const chatBody = document.querySelector('.chat-widget .chat-body');

        if (!najmAiButton) return;

        najmAiButton.addEventListener('click', () => chatWidget.classList.toggle('visible'));
        closeChatButton.addEventListener('click', () => chatWidget.classList.remove('visible'));

        const handleChatMessage = async () => {
            const message = chatInput.value.trim();
            if (!message) return;

            appendMessage(message, 'user');
            chatInput.value = '';
            const typingIndicator = appendMessage('...', 'bot', true);

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message })
                });
                const data = await response.json();
                typingIndicator.remove();
                appendMessage(data.reply, 'bot');
            } catch (error) {
                typingIndicator.remove();
                appendMessage("Sorry, I'm having trouble connecting. Please try again later.", 'bot');
            }
        };

        const appendMessage = (text, type, isTyping = false) => {
            const messageElement = document.createElement('div');
            messageElement.className = `chat-message ${type}`;
            if (isTyping) messageElement.classList.add('typing');
            messageElement.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
            chatBody.appendChild(messageElement);
            chatBody.scrollTop = chatBody.scrollHeight;
            return messageElement;
        };

        sendChatButton.addEventListener('click', handleChatMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleChatMessage();
        });
    }

    // --- Start the application ---
    initialize();
});

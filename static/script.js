document.addEventListener('DOMContentLoaded', () => {

    const translations = {
        en: {
            pageTitle: 'User Finder',
            pageSubtitle: 'All in One web.',
            smartModeBtn: 'Smart Search',
            matrixModeBtn: 'Matrix Check',
            randomModeBtn: 'Random Finder',
            keywordPlaceholder: 'Enter a keyword...',
            maxLengthPlaceholder: 'Max Len',
            findUsernamesBtn: 'Find Usernames & Domains',
            checkAllBtn: 'Check All Platforms',
            footerText: 'Developed By Hussain Alkhatib',
            available: 'Available!',
            taken: 'Taken',
            noUsernamesFound: 'No available usernames found. Try different criteria!',
            noDomainsFound: 'No available domains found for this keyword.',
            errorOccurred: 'An error occurred: ',
            selectAll: 'Select All',
            historyTitle: 'Recent Searches',
            statsTitle: 'Search Complete!',
            found: 'Found',
            in: 'in',
            seconds: 'seconds',
            usernamesTab: 'Usernames',
            domainsTab: 'Domains',
            exportBtn: 'Export',
            quality: 'Quality',
            deselectAll: 'Deselect All'
        },
        ar: {
            pageTitle: 'باحث اليوزرات',
            pageSubtitle: 'الكل في واحد.',
            smartModeBtn: 'بحث ذكي',
            matrixModeBtn: 'فحص شامل',
            randomModeBtn: 'بحث عشوائي',
            keywordPlaceholder: 'أدخل كلمة مفتاحية...',
            maxLengthPlaceholder: 'أقصى طول',
            findUsernamesBtn: 'ابحث عن يوزرات ودومينات',
            checkAllBtn: 'افحص كل المنصات',
            footerText: 'تم التطوير بواسطة حسين الخطيب',
            available: 'متاح!',
            taken: 'مأخوذ',
            noUsernamesFound: 'لم يتم العثور على يوزرات. جرب معايير مختلفة!',
            noDomainsFound: 'لم يتم العثور على دومينات متاحة لهذه الكلمة.',
            errorOccurred: 'حدث خطأ: ',
            selectAll: 'تحديد الكل',
            historyTitle: 'عمليات البحث الأخيرة',
            statsTitle: 'اكتمل البحث!',
            found: 'تم العثور على',
            in: 'في',
            seconds: 'ثواني',
            usernamesTab: 'أسماء المستخدمين',
            domainsTab: 'الدومينات',
            exportBtn: 'تصدير',
            quality: 'الجودة',
            deselectAll: 'إلغاء تحديد الكل',
            forecastTitle: '🔮 توقع اسم المستخدم',
            forecastSubtitle: 'تنبأ بمدى توفر اسم المستخدم في المستقبل.',
            forecastPlaceholder: 'أدخل اسم مستخدم للتوقع...',
            forecastButton: 'توقّع',
            domainModeBtn: 'بحث النطاقات',
            forecastModeBtn: 'وضع التوقع',
            domainPlaceholder: 'أدخل كلمة مفتاحية للنطاقات...',
            domainFindBtn: 'ابحث عن نطاقات'
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
        forecast: document.getElementById('forecast-form')
    };
    const loadingOverlay = document.querySelector('.loading-overlay');
    
    const resultsArea = document.getElementById('results-area');
    const statsContainer = document.getElementById('stats-container');
    const resultsContent = document.getElementById('results-content');
    const historyContainer = document.getElementById('history-container');
    const exportBtn = document.getElementById('export-btn');

    // --- State Management ---
    let activeMode = 'smart';
    let availablePlatforms = [];
    let currentLang = 'en';
    let lastUsernamesResult = [];

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
        setupEventListeners();
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

        exportBtn.addEventListener('click', exportResults);
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
    function initializePlatformSelectors() {
        const container = document.getElementById('smart-platform-selector');
        if (!container) return;
        container.innerHTML = `
            <div class="platform-selector-header">
                <button class="platform-control-btn select-all-btn" data-translate-key="selectAll">${translations[currentLang].selectAll}</button>
                <button class="platform-control-btn deselect-all-btn" data-translate-key="deselectAll">${translations[currentLang].deselectAll || 'Deselect All'}</button>
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
        statsContainer.innerHTML = '';
        const startTime = Date.now();

        let payload = { mode };

        // Handle forecast mode separately as it's frontend-only
        if (mode === 'forecast') {
            const input = document.getElementById('forecast-input');
            const username = input.value.trim();
            if (username) {
                renderForecastResult(username);
                saveSearchToHistory({ mode, username });
            }
            loadingOverlay.style.display = 'none';
            return;
        }

        // Setup payload for backend modes
        if (mode === 'smart') {
            payload.keyword = document.getElementById('keyword').value;
            payload.maxLength = document.getElementById('maxLength').value;
            payload.platforms = Array.from(document.querySelectorAll(`#smart-platform-selector input[name="platform"]:checked`)).map(chk => chk.value);
        } else if (mode === 'matrix') {
            payload.username = document.getElementById('matrix-username').value;
        } else if (mode === 'domain') {
            payload.keyword = document.getElementById('domain-keyword').value;
        }

        saveSearchToHistory(payload);

        try {
            const endpoint = (mode === 'domain') ? '/api/check_domains' : '/api/check';
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
            const endTime = Date.now();
            resultsArea.style.display = 'block';
            renderResults(data, mode, { time: ((endTime - startTime) / 1000).toFixed(2), count: Array.isArray(data) ? data.length : Object.keys(data).length });

        } catch (error) {
            renderError(error);
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }

    // ---RENDERING ---
    function renderResults(data, mode, stats) {
        renderStats(stats, mode);
        resultsContent.innerHTML = ''; // Clear previous results

        if (mode === 'smart') {
            lastUsernamesResult = data; // Save for export
            renderGroupedListResults(data);
        } else if (mode === 'matrix') {
            renderMatrixResults(data);
        } else if (mode === 'domain') {
            renderDomainResults(data);
        }
    }

    function renderStats(stats, mode) {
        if (mode === 'matrix' || mode === 'forecast') {
            statsContainer.innerHTML = '';
            return;
        }
        const itemType = mode === 'domain' ? (currentLang === 'ar' ? 'نطاقات' : 'domains') : (currentLang === 'ar' ? 'يوزرات' : 'usernames');
        statsContainer.innerHTML = `<div class="stats-card"><h3>${translations[currentLang].statsTitle}</h3><p>${translations[currentLang].found} <strong>${stats.count}</strong> ${itemType} ${translations[currentLang].in} ${stats.time} ${translations[currentLang].seconds}.</p></div>`;
    }

    function renderGroupedListResults(results) {
        if (results.length === 0) {
            resultsContent.innerHTML = `<div class="result-card"><p class="status-taken">${translations[currentLang].noUsernamesFound}</p></div>`;
            return;
        }
        const grouped = results.reduce((acc, { platform, username, quality }) => {
            if (!acc[username]) acc[username] = { platforms: [], quality: quality };
            acc[username].platforms.push(platform);
            return acc;
        }, {});

        const sortedUsernames = Object.keys(grouped).sort((a, b) => grouped[b].quality - grouped[a].quality || a.localeCompare(b));

        sortedUsernames.forEach(username => {
            const { platforms, quality } = grouped[username];
            const card = document.createElement('div');
            card.className = 'result-card';
            const platformHtml = platforms.map(p => `<span class="platform-tag">${p}</span>`).join('');
            card.innerHTML = `
                <div class="username-section">
                    <span class="username">${username}</span>
                    <div class="platform-tags">${platformHtml}</div>
                </div>
                <div class="quality-section">
                    <span class="quality-text">${translations[currentLang].quality}</span>
                    <div class="stars">
                        ${'★'.repeat(quality)}
                        ${'☆'.repeat(5 - quality)}
                    </div>
                </div>`;
            resultsContent.appendChild(card);
        });
    }

    function renderDomainResults(domains) {
        const sortedDomains = Object.entries(domains).sort((a, b) => a[0].localeCompare(b[0]));
        if (sortedDomains.length === 0 || sortedDomains.every(d => !d[1])) {
            resultsContent.innerHTML = `<div class="result-card"><p class="status-taken">${translations[currentLang].noDomainsFound}</p></div>`;
            return;
        }
        sortedDomains.forEach(([domain, isAvailable]) => {
            if (!isAvailable) return; // Only show available domains
            const card = document.createElement('div');
            card.className = 'matrix-result-card';
            const statusClass = 'status-available';
            const statusText = translations[currentLang].available;
            card.innerHTML = `<span class="platform-name">${domain}</span><span class="${statusClass}">${statusText}</span>`;
            resultsContent.appendChild(card);
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
            resultsContent.appendChild(card);
        });
    }
    
    function renderForecastResult(username) {
        resultsArea.style.display = 'block';
        statsContainer.innerHTML = '';
        const randomChance = Math.floor(Math.random() * 51) + 50; // 50-100%
        const text = `There is a ${randomChance}% chance that "${username}" will be taken within a year!`;
        resultsContent.innerHTML = `<div class="result-card"><p class="status-available">${text}</p></div>`;
    }

    function renderError(error) {
        resultsArea.style.display = 'block';
        statsContainer.innerHTML = '';
        resultsContent.innerHTML = `<div class="result-card"><p class="status-taken">${translations[currentLang].errorOccurred}${error.message}</p></div>`;
    }

    // --- HISTORY & EXPORT ---
    function saveSearchToHistory(payload) {
        let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        if (JSON.stringify(history[0]) === JSON.stringify(payload)) return;
        history.unshift(payload);
        history = history.slice(0, 5);
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
        } else if (item.mode === 'matrix') {
            document.getElementById('matrix-username').value = item.username;
        } else if (item.mode === 'domain') {
            document.getElementById('domain-keyword').value = item.keyword;
        } else if (item.mode === 'forecast') {
            document.getElementById('forecast-input').value = item.username;
        }
    }

    function exportResults() {
        if (lastUsernamesResult.length === 0) {
            alert("No results to export.");
            return;
        }
        const grouped = lastUsernamesResult.reduce((acc, { platform, username, quality }) => {
            if (!acc[username]) acc[username] = { platforms: [], quality: quality };
            acc[username].platforms.push(platform);
            return acc;
        }, {});
        let textContent = "Available Usernames Report\n============================\n\n";
        Object.entries(grouped).forEach(([username, { platforms, quality }]) => {
            textContent += `Username: ${username}\n`;
            textContent += `Quality: ${'★'.repeat(quality)}${'☆'.repeat(5 - quality)}\n`;
            textContent += `Available on: ${platforms.join(', ')}\n\n`;
        });
        const blob = new Blob([textContent], { type: 'text/plain' });
        const anchor = document.createElement('a');
        anchor.download = 'user-finder-results.txt';
        anchor.href = window.URL.createObjectURL(blob);
        anchor.click();
        window.URL.revokeObjectURL(anchor.href);
    }

    // --- Start the application ---
    initialize();

    // --- NAJM AI Chat Widget Logic ---
    const najmAiButton = document.getElementById('najm-ai-button');
    const closeChatButton = document.getElementById('close-chat-btn');
    const chatWidget = document.getElementById('najm-chat-widget');

    if (najmAiButton && closeChatButton && chatWidget) {
        najmAiButton.addEventListener('click', () => {
            chatWidget.classList.toggle('visible');
        });

        closeChatButton.addEventListener('click', () => {
            chatWidget.classList.remove('visible');
        });

        const chatInput = document.getElementById('chat-input');
        const sendChatButton = document.getElementById('send-chat-btn');
        const chatBody = document.querySelector('.chat-widget .chat-body');

        const handleChatMessage = async () => {
            const message = chatInput.value.trim();
            if (!message) return;

            // Render user message
            appendMessage(message, 'user');
            chatInput.value = '';

            // Show typing indicator
            const typingIndicator = appendMessage('...', 'bot', true);

            // Call API
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message })
                });
                const data = await response.json();
                typingIndicator.remove(); // Remove typing indicator
                appendMessage(data.reply, 'bot'); // Render bot reply
            } catch (error) {
                typingIndicator.remove();
                appendMessage("Sorry, I'm having trouble connecting. Please try again later.", 'bot');
            }
        };

        const appendMessage = (text, type, isTyping = false) => {
            const messageElement = document.createElement('div');
            messageElement.className = `chat-message ${type}`;
            if (isTyping) {
                messageElement.classList.add('typing');
            }
            messageElement.innerHTML = `<p>${text}</p>`;
            chatBody.appendChild(messageElement);
            chatBody.scrollTop = chatBody.scrollHeight; // Scroll to bottom
            return messageElement;
        };

        sendChatButton.addEventListener('click', handleChatMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleChatMessage();
            }
        });
    }
});

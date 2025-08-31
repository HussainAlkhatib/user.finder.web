document.addEventListener('DOMContentLoaded', () => {

    const PLATFORMS = ["TikTok", "Instagram", "GitHub", "Twitch", "Reddit", "Pinterest"];

    // --- Element Selections ---
    const modeButtons = document.querySelectorAll('.mode-btn');
    const forms = {
        smart: document.getElementById('smart-form'),
        matrix: document.getElementById('matrix-form'),
        random: document.getElementById('random-form')
    };
    const resultsContainer = document.getElementById('results-container');
    const loadingOverlay = document.querySelector('.loading-overlay');

    let activeMode = 'smart';
    let selectedPlatform = PLATFORMS[0];

    // --- Initialization ---
    function initializePlatformPills() {
        const pillContainers = document.querySelectorAll('.platform-pills');
        pillContainers.forEach(container => {
            container.innerHTML = ''; // Clear existing
            PLATFORMS.forEach(platform => {
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
                // Update all pill containers
                document.querySelectorAll('.platform-pills').forEach(p => {
                    p.querySelectorAll('.platform-pill').forEach(pill => {
                        pill.classList.toggle('selected', pill.dataset.platform === selectedPlatform);
                    });
                });
            }
        });
    });

    forms.smart.addEventListener('submit', e => handleFormSubmit(e, 'smart'));
    forms.matrix.addEventListener('submit', e => handleFormSubmit(e, 'matrix'));
    forms.random.addEventListener('submit', e => handleFormSubmit(e, 'random'));

    // --- UI Update Functions ---
    function updateActiveMode() {
        modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === activeMode));
        Object.values(forms).forEach(form => form.classList.remove('active-form'));
        forms[activeMode].classList.add('active-form');
        resultsContainer.innerHTML = ''; // Clear results on mode change
    }

    // --- Core Logic ---
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

    // --- Rendering Functions ---
    function renderResults(data, mode) {
        if (mode === 'matrix') {
            renderMatrixResults(data);
        } else {
            renderListResults(data);
        }
    }

    function renderListResults(usernames) {
        if (usernames.length === 0) {
            resultsContainer.innerHTML = `<div class="result-card"><p class="status-taken">No available usernames found with these criteria.</p></div>`;
            return;
        }
        usernames.forEach(user => {
            const card = document.createElement('div');
            card.className = 'result-card';
            card.innerHTML = `<span class="username">${user}</span><span class="status-available">Available!</span>`;
            resultsContainer.appendChild(card);
        });
    }

    function renderMatrixResults(platforms) {
        const sortedPlatforms = Object.entries(platforms).sort((a, b) => a[0].localeCompare(b[0]));
        sortedPlatforms.forEach(([platform, isAvailable]) => {
            const card = document.createElement('div');
            card.className = 'matrix-result-card';
            const statusClass = isAvailable ? 'status-available' : 'status-taken';
            const statusText = isAvailable ? 'Available!' : 'Taken';
            card.innerHTML = `<span class="platform-name">${platform}</span><span class="${statusClass}">${statusText}</span>`;
            resultsContainer.appendChild(card);
        });
    }

    function renderError(error) {
        resultsContainer.innerHTML = `<div class="result-card"><p class="status-taken">An error occurred: ${error.message}</p></div>`;
    }

    // --- Initial Run ---
    initializePlatformPills();
    updateActiveMode();
});

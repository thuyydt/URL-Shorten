document.addEventListener('DOMContentLoaded', function() {
    // I18n functionality
    let currentLanguage = 'en';
    let messages = {};

    const urlInput = document.getElementById('urlInput');
    const customAlias = document.getElementById('customAlias');
    const isGdBtn = document.getElementById('isGdBtn');
    const vGdBtn = document.getElementById('vGdBtn');
    const tinyUrlBtn = document.getElementById('tinyUrlBtn');
    const serviceInfoBtn = document.getElementById('serviceInfoBtn');
    const serviceInfoModal = document.getElementById('serviceInfoModal');
    const closeModal = document.getElementById('closeModal');
    const shortenBtn = document.getElementById('shortenBtn');
    const resultSection = document.getElementById('result');
    const resultUrl = document.getElementById('resultUrl');
    const copyBtn = document.getElementById('copyBtn');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const shortenType = document.getElementById('shortenType');
    const logStats = document.getElementById('logStats');
    const languageSelect = document.getElementById('languageSelect');
    const qrBtn = document.getElementById('qrBtn');
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    let selectedService = 'is.gd';
    let errorTimer = null;
    const MAX_HISTORY = 20;

    // Safe SVG creation helper to avoid innerHTML
    function createSvgElement(pathData, size, fill) {
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', '0 -960 960 960');
        svg.setAttribute('width', size);
        svg.setAttribute('fill', fill);
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', pathData);
        svg.appendChild(path);
        return svg;
    }

    // SVG path constants
    const SVG_PATHS = {
        copy: 'M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z',
        check: 'M268-240 42-466l57-56 170 170 56 56-57 56Zm226 0L268-466l56-57 170 170 368-368 56 57-424 424Zm0-226-57-56 198-198 57 56-198 198Z',
        checkSmall: 'M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z',
        close: 'm256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z',
        sun: 'M480-360q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35Zm0 80q-83 0-141.5-58.5T280-480q0-83 58.5-141.5T480-680q83 0 141.5 58.5T680-480q0 83-58.5 141.5T480-280ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Zm326-268Z',
        moon: 'M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Z'
    };

    function replaceChildrenSafe(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    // Load messages and initialize UI
    loadMessages().then(() => {
        loadLanguagePreference();
        loadServicePreference();
        loadDarkModePreference();
        updateUI();
        initializeUI();
        renderHistory();
    });

    async function loadMessages() {
        try {
            const lang = await getCurrentLanguage();
            messages = await getMessages(lang);
        } catch (error) {
            console.error('Error loading messages:', error);
            // Fallback to English
            currentLanguage = 'en';
            messages = await getMessages('en');
        }
    }

    async function getCurrentLanguage() {
        const result = await browser.storage.sync.get(['selectedLanguage']);
        const stored = result.selectedLanguage;
        
        // If no stored language preference, detect browser language
        if (!stored) {
            const browserLanguage = detectBrowserLanguage();
            return browserLanguage;
        }
        
        return stored;
    }
    
    function detectBrowserLanguage() {
        // Get browser language with fallbacks
        const browserLang = navigator.language || navigator.userLanguage || navigator.browserLanguage || navigator.systemLanguage;
        
        if (!browserLang) {
            return 'en'; // Ultimate fallback
        }
        
        // Extract language code (e.g., 'en-US' -> 'en', 'zh-CN' -> 'zh')
        const langCode = browserLang.split('-')[0].toLowerCase();
        
        // Available languages in the extension
        const availableLanguages = ['en', 'zh', 'ja', 'vi', 'de', 'fr', 'es', 'it', 'pt', 'ru', 'ar', 'hi'];
        
        // Check if detected language is available
        if (availableLanguages.includes(langCode)) {
            console.log(`Detected browser language: ${browserLang}, using: ${langCode}`);
            return langCode;
        }
        
        // Special cases for language variations
        const languageMap = {
            'zh-cn': 'zh',
            'zh-tw': 'zh',
            'zh-hk': 'zh',
            'zh-sg': 'zh',
            'pt-br': 'pt',
            'pt-pt': 'pt'
        };
        
        const fullLangCode = browserLang.toLowerCase();
        if (languageMap[fullLangCode]) {
            console.log(`Detected browser language variant: ${browserLang}, using: ${languageMap[fullLangCode]}`);
            return languageMap[fullLangCode];
        }
        
        console.log(`Browser language ${browserLang} not supported, falling back to English`);
        // Fallback to English if language not supported
        return 'en';
    }

    async function getMessages(lang) {
        try {
            const response = await fetch(browser.runtime.getURL(`_locales/${lang}/messages.json`));
            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`Error loading messages for ${lang}:`, error);
            if (lang !== 'en') {
                // Fallback to English
                return getMessages('en');
            }
            return {};
        }
    }

    function updateUI() {
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (messages[key]) {
                // Only update text if element has no child elements with data-i18n
                const hasI18nChildren = element.querySelector('[data-i18n], [data-i18n-placeholder], [data-i18n-title]');
                if (!hasI18nChildren) {
                    element.textContent = messages[key].message;
                } else {
                    // Update only the first text node
                    const firstText = Array.from(element.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
                    if (firstText) {
                        firstText.textContent = messages[key].message;
                    }
                }
            }
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (messages[key]) {
                element.placeholder = messages[key].message;
            }
        });

        // Update titles
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            if (messages[key]) {
                element.title = messages[key].message;
            }
        });
    }

    function loadLanguagePreference() {
        browser.storage.sync.get(['selectedLanguage']).then((result) => {
            // If no stored preference, use browser language detection
            if (!result.selectedLanguage) {
                currentLanguage = detectBrowserLanguage();
                // Save the detected language as the user's preference
                browser.storage.sync.set({ selectedLanguage: currentLanguage });
            } else {
                currentLanguage = result.selectedLanguage;
            }
            
            if (languageSelect) {
                languageSelect.value = currentLanguage;
            }
        });
    }

    function getMessage(key) {
        return messages[key] ? messages[key].message : key;
    }

    // Language selector handler
    if (languageSelect) {
        languageSelect.addEventListener('change', async function() {
            const selectedLang = this.value;
            currentLanguage = selectedLang;
            
            // Save preference
            browser.storage.sync.set({ selectedLanguage: selectedLang });
            
            // Reload messages and update UI
            messages = await getMessages(selectedLang);
            updateUI();
        });
    }

    // Initialize UI state
    function initializeUI() {
        hideError();
        hideLoading();
        hideResult();
    }

    // Service info modal functionality
    serviceInfoBtn.addEventListener('click', function() {
        serviceInfoModal.classList.add('visible');
        document.body.classList.add('modal-open');
    });

    // Close modal handlers
    closeModal.addEventListener('click', function() {
        serviceInfoModal.classList.remove('visible');
        document.body.classList.remove('modal-open');
    });

    // Close modal when clicking overlay
    serviceInfoModal.addEventListener('click', function(e) {
        if (e.target === serviceInfoModal) {
            serviceInfoModal.classList.remove('visible');
            document.body.classList.remove('modal-open');
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && serviceInfoModal.classList.contains('visible')) {
            serviceInfoModal.classList.remove('visible');
            document.body.classList.remove('modal-open');
        }
    });

    // Auto-load current tab URL on popup open
    browser.tabs.query({ active: true, currentWindow: true }).then(function(tabs) {
        if (tabs[0] && tabs[0].url) {
            const url = tabs[0].url;
            // Filter out non-shortenable URLs
            if (!url.startsWith('about:') && 
                !url.startsWith('moz-extension://') &&
                !url.startsWith('chrome://') &&
                !url.startsWith('file://')) {
                urlInput.value = url;
            }
        }
    });

    // Clear errors when user starts typing
    urlInput.addEventListener('input', function() {
        if (error.classList.contains('visible')) {
            hideError();
        }
    });

    // Clear errors when custom alias changes
    customAlias.addEventListener('input', function() {
        if (error.classList.contains('visible')) {
            hideError();
        }
    });

    // Clear errors when options change
    shortenType.addEventListener('change', function() {
        if (error.classList.contains('visible')) {
            hideError();
        }
    });

    logStats.addEventListener('change', function() {
        if (error.classList.contains('visible')) {
            hideError();
        }
    });

    // Service selection
    isGdBtn.addEventListener('click', function() {
        selectService('is.gd', isGdBtn, [vGdBtn, tinyUrlBtn]);
        toggleServiceOptions(true);
    });

    vGdBtn.addEventListener('click', function() {
        selectService('v.gd', vGdBtn, [isGdBtn, tinyUrlBtn]);
        toggleServiceOptions(true);
    });

    tinyUrlBtn.addEventListener('click', function() {
        selectService('tinyurl', tinyUrlBtn, [isGdBtn, vGdBtn]);
        toggleServiceOptions(false);
    });

    function selectService(service, activeBtn, inactiveBtns) {
        selectedService = service;
        activeBtn.classList.add('active');
        inactiveBtns.forEach(btn => btn.classList.remove('active'));
        // Save preference
        browser.storage.sync.set({ selectedService: service });
        if (error.classList.contains('visible')) {
            hideError();
        }
    }

    function loadServicePreference() {
        browser.storage.sync.get(['selectedService']).then((result) => {
            if (result.selectedService) {
                const service = result.selectedService;
                selectedService = service;
                const btnMap = { 'is.gd': isGdBtn, 'v.gd': vGdBtn, 'tinyurl': tinyUrlBtn };
                const activeBtn = btnMap[service];
                if (activeBtn) {
                    Object.values(btnMap).forEach(btn => btn.classList.remove('active'));
                    activeBtn.classList.add('active');
                    toggleServiceOptions(service !== 'tinyurl');
                }
            }
        });
    }

    function toggleServiceOptions(show) {
        const optionsSection = document.querySelector('.options-section');
        const customAliasSection = document.querySelector('.custom-alias-section');
        if (optionsSection) {
            optionsSection.style.display = show ? '' : 'none';
        }
        if (customAliasSection) {
            customAliasSection.style.display = show ? '' : 'none';
        }
    }

    // Shorten URL
    shortenBtn.addEventListener('click', async function() {
        const url = urlInput.value.trim();
        const alias = customAlias.value.trim();
        const options = getShortenOptions();

        if (!url) {
            showError(getMessage('errorEnterUrl'));
            return;
        }

        if (!isValidUrl(url)) {
            showError(getMessage('errorValidUrl'));
            return;
        }

        hideError();
        showLoading();
        
        try {
            const shortUrl = await shortenUrl(url, selectedService, alias, options);
            showResult(shortUrl);
            saveToHistory(url, shortUrl, selectedService);
        } catch (err) {
            showError(err.message || getMessage('errorShortenFailed'));
        } finally {
            hideLoading();
        }
    });

    // Copy result
    copyBtn.addEventListener('click', async function() {
        try {
            await navigator.clipboard.writeText(resultUrl.value);
            
            // Visual feedback - replace icon with checkmark
            replaceChildrenSafe(copyBtn);
            copyBtn.appendChild(createSvgElement(SVG_PATHS.check, '18px', '#28a745'));
            copyBtn.style.borderColor = '#28a745';
            
            setTimeout(() => {
                replaceChildrenSafe(copyBtn);
                copyBtn.appendChild(createSvgElement(SVG_PATHS.copy, '18px', 'currentColor'));
                copyBtn.style.borderColor = '';
            }, 3000);
        } catch (copyErr) {
            showError(getMessage('errorCopyFailed'));
        }
    });

    // Enter key support
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            shortenBtn.click();
        }
    });

    customAlias.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            shortenBtn.click();
        }
    });

    async function shortenUrl(url, service, alias = '', options = {}) {
        // TinyURL service
        if (service === 'tinyurl') {
            return await shortenWithTinyUrl(url);
        }

        // is.gd / v.gd service
        const baseUrl = service === 'is.gd' ? 'https://is.gd/create.php' : 'https://v.gd/create.php';
        
        const params = new URLSearchParams({
            format: 'simple',
            url: url
        });

        if (alias) {
            params.append('shorturl', alias);
        }

        // Add shorten options
        if (options.type === 'lowercase') {
            params.append('opt_lowercase', '1');
        } else if (options.type === 'pronounceable') {
            params.append('opt_pronounceable', '1');
        }

        if (options.logStats) {
            params.append('opt_logstats', '1');
        }

        try {
            // Add timeout to the fetch request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

            const response = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'text/plain, */*',
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': 'URL Shorten Firefox Extension'
                },
                body: params.toString(),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // Handle specific HTTP status codes
                if (response.status >= 500 && response.status < 600) {
                    throw new Error(getMessage('errorServiceUnavailable'));
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
                } else if (response.status === 403) {
                    throw new Error('Access denied by the service. Please try again later.');
                } else if (response.status >= 400 && response.status < 500) {
                    const errorText = await response.text().catch(() => '');
                    throw new Error(errorText || `Client error (${response.status}). Please check your request.`);
                } else {
                    const errorText = await response.text().catch(() => '');
                    throw new Error(getMessage('errorServiceError') + (errorText ? ': ' + errorText : ''));
                }
            }

            const result = await response.text();
            
            // Check for error responses from the service
            if (result.includes('Error:')) {
                const errorMessage = result.replace('Error: ', '').trim();
                // Handle common service errors
                if (errorMessage.toLowerCase().includes('database query failed')) {
                    throw new Error(getMessage('errorDatabaseFailed'));
                } else if (errorMessage.toLowerCase().includes('invalid url')) {
                    throw new Error(getMessage('errorValidUrl'));
                } else if (errorMessage.toLowerCase().includes('custom url already taken') || errorMessage.toLowerCase().includes('keyword unavailable')) {
                    throw new Error('The custom alias is already taken. Please choose a different one.');
                } else if (errorMessage.toLowerCase().includes('rate limit') || errorMessage.toLowerCase().includes('too many requests')) {
                    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
                } else {
                    throw new Error(errorMessage);
                }
            }

            // Check for other error indicators
            if (result.toLowerCase().includes('error') && !result.startsWith('http')) {
                throw new Error(getMessage('errorServiceError'));
            }

            if (!result.startsWith('http')) {
                throw new Error('Invalid response from service. Please try again.');
            }

            return result.trim();

        } catch (error) {
            // Handle network-specific errors
            if (error.name === 'AbortError') {
                throw new Error(getMessage('errorNetworkTimeout'));
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                // Network connectivity issues
                throw new Error(getMessage('errorNoConnection'));
            } else if (error.name === 'TypeError' && (
                error.message.includes('NetworkError') || 
                error.message.includes('Failed to fetch') ||
                error.message.includes('Load failed')
            )) {
                throw new Error(getMessage('errorNoConnection'));
            } else if (error.message && (
                error.message.includes('No internet connection') ||
                error.message.includes('service is currently unavailable') ||
                error.message.includes('Request timed out') ||
                error.message.includes('service returned an error')
            )) {
                // Re-throw our custom error messages
                throw error;
            } else {
                // For any other errors, provide a generic fallback
                console.error('Unexpected error in shortenUrl:', error);
                throw new Error(error.message || getMessage('errorShortenFailed'));
            }
        }
    }

    async function shortenWithTinyUrl(url) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status >= 500) {
                    throw new Error(getMessage('errorServiceUnavailable'));
                }
                throw new Error(getMessage('errorServiceError'));
            }

            const result = await response.text();

            if (!result.startsWith('http')) {
                throw new Error(getMessage('errorServiceError'));
            }

            return result.trim();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(getMessage('errorNetworkTimeout'));
            } else if (error.message && (
                error.message.includes('Failed to fetch') ||
                error.message.includes('Load failed') ||
                error.message.includes('NetworkError')
            )) {
                throw new Error(getMessage('errorNoConnection'));
            }
            throw error;
        }
    }

    function getShortenOptions() {
        const selectedType = shortenType.value;
        const logStatsChecked = logStats.checked;

        return {
            type: selectedType,
            logStats: logStatsChecked
        };
    }

    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    function showLoading() {
        loading.classList.add('visible');
        shortenBtn.disabled = true;
        resultSection.classList.remove('visible');
    }

    function hideLoading() {
        loading.classList.remove('visible');
        shortenBtn.disabled = false;
    }

    function showResult(shortUrl) {
        resultUrl.value = shortUrl;
        resultSection.classList.add('visible');
    }

    function hideResult() {
        resultSection.classList.remove('visible');
        resultUrl.value = '';
    }

    function showError(message) {
        // Clear any previous timer
        if (errorTimer) {
            clearTimeout(errorTimer);
            errorTimer = null;
        }

        // Clear any previous error content
        error.textContent = '';
        
        // Create error content with dismiss button
        const errorContent = document.createElement('span');
        errorContent.textContent = message;
        
        const dismissBtn = document.createElement('button');
        dismissBtn.className = 'error-dismiss';
        dismissBtn.textContent = '\u00D7';
        dismissBtn.title = getMessage('dismissError');
        dismissBtn.addEventListener('click', function() {
            hideError(true);
        });
        
        error.appendChild(errorContent);
        error.appendChild(dismissBtn);
        error.classList.add('visible');
        
        // Auto-hide after 5 seconds
        errorTimer = setTimeout(function() {
            hideError(false);
        }, 5000);
    }

    function hideError(immediate) {
        if (errorTimer) {
            clearTimeout(errorTimer);
            errorTimer = null;
        }
        error.classList.remove('visible');
        if (immediate) {
            replaceChildrenSafe(error);
        } else {
            // Clear content after CSS transition completes
            setTimeout(function() {
                replaceChildrenSafe(error);
            }, 300);
        }
    }

    // ===== QR Code =====
    qrBtn.addEventListener('click', function() {
        const url = resultUrl.value;
        if (!url) return;

        if (qrCodeContainer.classList.contains('visible')) {
            qrCodeContainer.classList.remove('visible');
            replaceChildrenSafe(qrCodeContainer);
            return;
        }

        generateQRCode(url);
    });

    function generateQRCode(text) {
        replaceChildrenSafe(qrCodeContainer);
        const canvas = document.createElement('canvas');
        const size = 160;
        canvas.width = size;
        canvas.height = size;
        
        // Simple QR code generation using Canvas
        // We use the QR Server API as image source
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, size, size);
            ctx.drawImage(img, 0, 0, size, size);
            qrCodeContainer.appendChild(canvas);
            qrCodeContainer.classList.add('visible');
        };
        img.onerror = function() {
            // Fallback: show as text link
            const fallback = document.createElement('div');
            fallback.style.cssText = 'text-align:center;padding:8px;font-size:12px;color:#999;';
            fallback.textContent = getMessage('qrCodeError');
            qrCodeContainer.appendChild(fallback);
            qrCodeContainer.classList.add('visible');
        };
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
    }

    // ===== Dark Mode =====
    darkModeToggle.addEventListener('click', function() {
        const isDark = document.body.classList.toggle('dark-mode');
        browser.storage.sync.set({ darkMode: isDark });
        updateDarkModeIcon(isDark);
    });

    function loadDarkModePreference() {
        browser.storage.sync.get(['darkMode']).then((result) => {
            if (result.darkMode === true) {
                document.body.classList.add('dark-mode');
                updateDarkModeIcon(true);
            } else if (result.darkMode === undefined) {
                // Auto-detect system preference
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.body.classList.add('dark-mode');
                    updateDarkModeIcon(true);
                }
            }
        });
    }

    function updateDarkModeIcon(isDark) {
        const icon = document.getElementById('darkModeIcon');
        const svgNS = 'http://www.w3.org/2000/svg';
        replaceChildrenSafe(icon);
        const path = document.createElementNS(svgNS, 'path');
        if (isDark) {
            // Sun icon for light mode switch
            path.setAttribute('d', SVG_PATHS.sun);
        } else {
            // Moon icon for dark mode switch
            path.setAttribute('d', SVG_PATHS.moon);
        }
        icon.appendChild(path);
    }

    // ===== History =====
    function saveToHistory(originalUrl, shortUrl, service) {
        browser.storage.local.get(['urlHistory']).then((result) => {
            let history = result.urlHistory || [];
            // Add to beginning
            history.unshift({
                original: originalUrl,
                short: shortUrl,
                service: service,
                date: Date.now()
            });
            // Keep only MAX_HISTORY items
            if (history.length > MAX_HISTORY) {
                history = history.slice(0, MAX_HISTORY);
            }
            browser.storage.local.set({ urlHistory: history }).then(() => {
                renderHistory();
            });
        });
    }

    function renderHistory() {
        browser.storage.local.get(['urlHistory']).then((result) => {
            const history = result.urlHistory || [];
            replaceChildrenSafe(historyList);

            if (history.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'history-empty';
                empty.textContent = getMessage('historyEmpty');
                historyList.appendChild(empty);
                return;
            }

            history.forEach((item, index) => {
                const el = document.createElement('div');
                el.className = 'history-item';

                const info = document.createElement('div');
                info.className = 'history-item-info';

                const shortLink = document.createElement('div');
                shortLink.className = 'history-item-short';
                shortLink.textContent = item.short;

                const originalLink = document.createElement('div');
                originalLink.className = 'history-item-original';
                originalLink.textContent = item.original;

                info.appendChild(shortLink);
                info.appendChild(originalLink);

                const meta = document.createElement('div');
                meta.className = 'history-item-meta';
                meta.textContent = formatDate(item.date);

                const copyBtn2 = document.createElement('button');
                copyBtn2.className = 'history-item-copy';
                copyBtn2.title = getMessage('copyToClipboard');
                copyBtn2.appendChild(createSvgElement(SVG_PATHS.copy, '14px', 'currentColor'));
                copyBtn2.addEventListener('click', async function(e) {
                    e.stopPropagation();
                    try {
                        await navigator.clipboard.writeText(item.short);
                        replaceChildrenSafe(copyBtn2);
                        copyBtn2.appendChild(createSvgElement(SVG_PATHS.checkSmall, '14px', '#28a745'));
                        setTimeout(() => {
                            replaceChildrenSafe(copyBtn2);
                            copyBtn2.appendChild(createSvgElement(SVG_PATHS.copy, '14px', 'currentColor'));
                        }, 2000);
                    } catch (err) { /* ignore */ }
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'history-item-delete';
                deleteBtn.title = getMessage('deleteHistoryItem');
                deleteBtn.appendChild(createSvgElement(SVG_PATHS.close, '14px', 'currentColor'));
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    deleteHistoryItem(index);
                });

                el.appendChild(info);
                el.appendChild(meta);
                el.appendChild(copyBtn2);
                el.appendChild(deleteBtn);

                // Click to load URL
                el.addEventListener('click', function() {
                    urlInput.value = item.original;
                    resultUrl.value = item.short;
                    resultSection.classList.add('visible');
                });

                historyList.appendChild(el);
            });
        });
    }

    function deleteHistoryItem(index) {
        browser.storage.local.get(['urlHistory']).then((result) => {
            let history = result.urlHistory || [];
            history.splice(index, 1);
            browser.storage.local.set({ urlHistory: history }).then(() => {
                renderHistory();
            });
        });
    }

    clearHistoryBtn.addEventListener('click', function() {
        browser.storage.local.set({ urlHistory: [] }).then(() => {
            renderHistory();
        });
    });

    function formatDate(timestamp) {
        const d = new Date(timestamp);
        const now = new Date();
        const diff = now - d;
        
        if (diff < 60000) return getMessage('justNow');
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
        if (diff < 604800000) return Math.floor(diff / 86400000) + 'd';
        return d.toLocaleDateString();
    }
});

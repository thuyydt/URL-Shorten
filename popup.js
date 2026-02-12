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

    let selectedService = 'is.gd';

    // Load messages and initialize UI
    loadMessages().then(() => {
        loadLanguagePreference();
        updateUI();
        initializeUI();
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
        const stored = await new Promise((resolve) => {
            chrome.storage.sync.get(['selectedLanguage'], (result) => {
                resolve(result.selectedLanguage);
            });
        });
        
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
            const response = await fetch(chrome.runtime.getURL(`_locales/${lang}/messages.json`));
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
                element.textContent = messages[key].message;
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
        chrome.storage.sync.get(['selectedLanguage'], (result) => {
            // If no stored preference, use browser language detection
            if (!result.selectedLanguage) {
                currentLanguage = detectBrowserLanguage();
                // Save the detected language as the user's preference
                chrome.storage.sync.set({ selectedLanguage: currentLanguage });
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
            chrome.storage.sync.set({ selectedLanguage: selectedLang });
            
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

    // Initialize on load
    initializeUI();

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
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && tabs[0].url && !tabs[0].url.startsWith('chrome://')) {
            urlInput.value = tabs[0].url;
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
        if (error.classList.contains('visible')) {
            hideError();
        }
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
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#28a745"><path d="M268-240 42-466l57-56 170 170 56 56-57 56Zm226 0L268-466l56-57 170 170 368-368 56 57-424 424Zm0-226-57-56 198-198 57 56-198 198Z"/></svg>
            `;
            copyBtn.style.borderColor = '#28a745';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.style.borderColor = '';
            }, 3000);
        } catch (err) {
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
                    'User-Agent': 'URL Shorten Chrome Extension'
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
        // Clear any previous error content
        error.textContent = '';
        
        // Create error content with dismiss button
        const errorContent = document.createElement('span');
        errorContent.textContent = message;
        
        const dismissBtn = document.createElement('button');
        dismissBtn.className = 'error-dismiss';
        dismissBtn.innerHTML = '×';
        dismissBtn.title = getMessage('dismissError');
        dismissBtn.addEventListener('click', hideError);
        
        error.appendChild(errorContent);
        error.appendChild(dismissBtn);
        error.classList.add('visible');
        
        // Auto-hide after 5 seconds
        setTimeout(hideError, 5000);
    }

    function hideError() {
        // Clear content after transition
        setTimeout(() => {
            error.classList.remove('visible');
            setTimeout(() => {
                error.innerHTML = '';
            }, 300);
        }, 3000);
    }
});

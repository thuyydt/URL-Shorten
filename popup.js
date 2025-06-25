document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('urlInput');
    const customAlias = document.getElementById('customAlias');
    const isGdBtn = document.getElementById('isGdBtn');
    const vGdBtn = document.getElementById('vGdBtn');
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

    let selectedService = 'is.gd';

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
        selectService('is.gd', isGdBtn, vGdBtn);
    });

    vGdBtn.addEventListener('click', function() {
        selectService('v.gd', vGdBtn, isGdBtn);
    });

    function selectService(service, activeBtn, inactiveBtn) {
        selectedService = service;
        activeBtn.classList.add('active');
        inactiveBtn.classList.remove('active');
        if (error.classList.contains('visible')) {
            hideError();
        }
    }

    // Shorten URL
    shortenBtn.addEventListener('click', async function() {
        const url = urlInput.value.trim();
        const alias = customAlias.value.trim();
        const options = getShortenOptions();

        if (!url) {
            showError('Please enter a URL to shorten');
            return;
        }

        if (!isValidUrl(url)) {
            showError('Please enter a valid URL');
            return;
        }

        hideError();
        showLoading();
        
        try {
            const shortUrl = await shortenUrl(url, selectedService, alias, options);
            showResult(shortUrl);
        } catch (err) {
            showError(err.message || 'Failed to shorten URL');
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
                <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="#28a745">
                    <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
                </svg>
            `;
            copyBtn.style.borderColor = '#28a745';
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.style.borderColor = '';
            }, 1500);
        } catch (err) {
            showError('Failed to copy to clipboard');
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

        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Accept': 'text/plain, */*',
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'URL Shortener Chrome Extension'
            },
            body: params.toString()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}${errorText ? ': ' + errorText : ''}`);
        }

        const result = await response.text();
        
        // Check for error responses
        if (result.includes('Error:') || result.includes('error')) {
            throw new Error(result.replace('Error: ', ''));
        }

        if (!result.startsWith('http')) {
            throw new Error('Invalid response from service');
        }

        return result.trim();
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
        dismissBtn.title = 'Dismiss error';
        dismissBtn.addEventListener('click', hideError);
        
        error.appendChild(errorContent);
        error.appendChild(dismissBtn);
        error.classList.add('visible');
        
        // Auto-hide after 5 seconds
        setTimeout(hideError, 5000);
    }

    function hideError() {
        error.classList.remove('visible');
        // Clear content after transition
        setTimeout(() => {
            error.innerHTML = '';
        }, 300);
    }
});

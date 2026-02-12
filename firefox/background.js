// Background script for URL Shorten extension (Firefox)

browser.runtime.onInstalled.addListener(async () => {
    // Get or detect the user's language preference
    const result = await browser.storage.sync.get(['selectedLanguage']);
    let language = result.selectedLanguage;
    
    // If no stored language, detect browser language
    if (!language) {
        language = detectBrowserLanguage();
        // Save the detected language
        browser.storage.sync.set({ selectedLanguage: language });
    }
    
    // Create context menu item with localized text
    const contextMenuTitle = browser.i18n.getMessage('contextMenuShorten') || 'Shorten this URL';
    
    browser.contextMenus.create({
        id: 'shortenUrl',
        title: contextMenuTitle,
        contexts: ['link', 'page']
    });
});

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
        return languageMap[fullLangCode];
    }
    
    // Fallback to English if language not supported
    return 'en';
}

// Handle context menu clicks
browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'shortenUrl') {
        const urlToShorten = info.linkUrl || info.pageUrl || tab.url;
        
        // Store the URL for the popup to use (use storage.local since Firefox MV2 has no storage.session)
        browser.storage.local.set({ 
            pendingUrl: urlToShorten 
        });
        
        // Firefox MV2 doesn't support browserAction.openPopup() reliably,
        // so we open the popup as a small window instead
        browser.windows.create({
            url: browser.runtime.getURL('popup.html') + '?pending=true',
            type: 'popup',
            width: 360,
            height: 600
        });
    }
});

// Listen for messages from popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPendingUrl') {
        return browser.storage.local.get(['pendingUrl']).then((result) => {
            // Clear the pending URL after retrieval
            browser.storage.local.remove(['pendingUrl']);
            return { url: result.pendingUrl };
        });
    }
});

// Handle extension icon click
browser.browserAction.onClicked.addListener((tab) => {
    // This will be handled by the popup, but we can store the current tab URL
    browser.storage.local.set({ 
        currentTabUrl: tab.url 
    });
});

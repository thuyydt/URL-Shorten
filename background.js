// Background script for URL Shorten extension

chrome.runtime.onInstalled.addListener(async () => {
    // Get or detect the user's language preference
    const result = await chrome.storage.sync.get(['selectedLanguage']);
    let language = result.selectedLanguage;
    
    // If no stored language, detect browser language
    if (!language) {
        language = detectBrowserLanguage();
        // Save the detected language
        chrome.storage.sync.set({ selectedLanguage: language });
    }
    
    // Create context menu item with localized text
    const contextMenuTitle = chrome.i18n.getMessage('contextMenuShorten') || 'Shorten this URL';
    
    chrome.contextMenus.create({
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
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'shortenUrl') {
        const urlToShorten = info.linkUrl || info.pageUrl || tab.url;
        
        // Store the URL for the popup to use
        chrome.storage.session.set({ 
            pendingUrl: urlToShorten 
        });
        
        // Open the extension popup
        chrome.action.openPopup();
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPendingUrl') {
        chrome.storage.session.get(['pendingUrl']).then((result) => {
            sendResponse({ url: result.pendingUrl });
            // Clear the pending URL after retrieval
            chrome.storage.session.remove(['pendingUrl']);
        });
        return true; // Will respond asynchronously
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // This will be handled by the popup, but we can store the current tab URL
    chrome.storage.session.set({ 
        currentTabUrl: tab.url 
    });
});

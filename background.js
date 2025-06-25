// Background script for URL Shorten extension

chrome.runtime.onInstalled.addListener(() => {
    // Create context menu item
    chrome.contextMenus.create({
        id: 'shortenUrl',
        title: 'Shorten this URL',
        contexts: ['link', 'page']
    });
});

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

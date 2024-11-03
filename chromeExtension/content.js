// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'getUrl':
            sendResponse({
                type: 'urlResponse',
                url: window.location.href,
                title: document.title
            });
            break;

        case 'getSelection':
            sendResponse({
                type: 'selectionResponse',
                selectedText: window.getSelection()?.toString() || ''
            });
            break;

        case 'getPageInfo':
            sendResponse({
                type: 'pageInfoResponse',
                url: window.location.href,
                title: document.title,
                selectedText: window.getSelection()?.toString() || ''
            });
            break;
    }
    return true; // Will respond asynchronously
}); 
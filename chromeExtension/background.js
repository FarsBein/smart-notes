let ws = null;

function connectToElectron() {
    ws = new WebSocket('ws://localhost:8887');
    console.log("ws connecting on port 8887...");
    ws.onopen = () => {
        console.log('Connected to Electron app');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received from Electron:', data);
        handleElectronRequest(data);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('Disconnected from Electron app');
        setTimeout(connectToElectron, 5000);
    };
}

function handleElectronRequest(data) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs[0]) {
            const tab = tabs[0];
            chrome.tabs.sendMessage(tab.id, { action: data.action }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error('Error:', chrome.runtime.lastError);
                    // Send fallback response based on action type
                    switch (data.action) {
                        case 'getUrl':
                            ws.send(JSON.stringify({
                                type: 'urlResponse',
                                error: chrome.runtime.lastError.message,
                                url: tab.url,
                                title: tab.title
                            }));
                            break;
                        case 'getSelection':
                            ws.send(JSON.stringify({
                                type: 'selectionResponse',
                                error: chrome.runtime.lastError.message,
                                selectedText: ''
                            }));
                            break;
                        case 'getPageInfo':
                            ws.send(JSON.stringify({
                                type: 'pageInfoResponse',
                                error: chrome.runtime.lastError.message,
                                url: tab.url,
                                title: tab.title,
                                selectedText: ''
                            }));
                            break;
                    }
                } else if (response) {
                    ws.send(JSON.stringify(response));
                }
            });
        }
    });
}

// Connect when extension loads
connectToElectron();

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        return true; // Will respond asynchronously
    }
}); 
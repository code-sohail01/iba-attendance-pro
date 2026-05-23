chrome.runtime.onInstalled.addListener((details) => {
    // Only triggers once, exactly when the user first installs the extension
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({ 
            url: "https://code-sohail01.github.io/iba-attendance-website/" 
        });
    }
});
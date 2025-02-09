chrome.runtime.onInstalled.addListener(() => {
    console.log("Background script loaded.");
});

chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.sendMessage(tab.id, { action: "openPopup" });
});

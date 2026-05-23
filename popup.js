// The exact URL the user should be sent to
const PORTAL_URL = "http://sibagrades.iba-suk.edu.pk:86/Default.aspx";

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const currentTab = tabs[0];

  // Check if the user is currently on the portal
  if (currentTab && currentTab.url && currentTab.url.includes("iba-suk.edu.pk")) {
    
    // 1. Show the Master Controls
    document.getElementById('controls-view').style.display = 'block';

    // 2. Sync the toggles with the actual widget state
    chrome.tabs.sendMessage(currentTab.id, { action: "getState" }, (response) => {
      if (response) {
        document.getElementById('toggle-visibility').checked = response.isVisible;
        document.getElementById('toggle-theme').checked = response.isLight;
      }
    });
  } else {
    // IF NOT ON THE PORTAL: Show the redirect button instead
    document.getElementById('redirect-view').style.display = 'block';
  }
});

// --- EVENT LISTENERS ---

// Redirect Button Logic
document.getElementById('btn-go-portal').addEventListener('click', () => {
  // Opens a new tab directly to the university portal
  chrome.tabs.create({ url: PORTAL_URL });
});

// Visibility Toggle Logic
document.getElementById('toggle-visibility').addEventListener('change', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url.includes("iba-suk.edu.pk")) {
    chrome.tabs.sendMessage(tab.id, { action: "toggleVisibility" });
  }
});

// Theme Toggle Logic
document.getElementById('toggle-theme').addEventListener('change', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url.includes("iba-suk.edu.pk")) {
    chrome.tabs.sendMessage(tab.id, { action: "toggleTheme" });
  }
});
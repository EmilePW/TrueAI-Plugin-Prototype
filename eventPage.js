// Open connection to conversationData port from content script
chrome.runtime.onConnect.addListener(function (port) {
  console.assert(port.name === 'conversationData');

  port.onMessage.addListener(function (msg) {
    port.postMessage({response: msg});
  });
});

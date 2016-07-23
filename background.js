// Pseudo-code to get the context from the intercom page
/*
// On page load
getContext();

function getContext (selector) {
// Access the shared DOM
  // var DOM = getDOM()

// Select conversation text content
  // conversationNodes = DOM.querySelector(selector)

// Select context
  // context = conversationNodes.map((messageNode) => messageNode.messageText)

// Return context (this should maybe be async instead and make use of a callback)
  // return context
}

function sendContext (context) {
// Send message to chrome extension
  // chrome.extension.sendMessage(context)
}
*/

chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.executeScript({
    code: 'document.body.querySelector(".composer-inbox.conversation__text").querySelector("p").innerText="Hey there!"'
  });

  chrome.tabs.executeScript({
    code: 'for(var i = 0; i < 8; i++) { console.log(document.body.querySelector(".conversation__stream").querySelectorAll(".conversation__text p")[i].innerText)}'
  })
});

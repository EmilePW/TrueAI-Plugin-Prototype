// Selectors for each platform which can use the TrueAI API
// Allows for reuse of functions as different selectors can be passed as params for each platform
var selectors = {
  intercom: {
    // For messages sent by admin
    admin: '.o__admin-comment',
    // For conversation box
    conversation: '.conversation__stream',
    // For message blocks in a conversation
    conversationNodes: '.conversation__bubble',
    // For pieces of text in the conversation
    conversationText: '.conversation__text p',
    // For messages sent by user
    user: '.o__user-comment'
  }
}

// Identify platform from url
var platform = (function (url) {
  if (/(intercom.io)/.test(url)) {
    return 'intercom';
  }
  else {
    return undefined;
  }
})(document.location.hostname);

// Config for message observer
var config = { attributes: true, childList: true, characterData: true };

// Don't attempt to get messages before message box is in the DOM
// Check if message box is in the DOM every second
var checkForMessageBox = setInterval(function () {
  var messageBox = document.querySelector(selectors[platform].conversation);
  
  if (messageBox) {
    // Observe updates to conversation
    messageObserver.observe(messageBox, config);
  }
  else {
    // Message box not in the DOM
    console.log('Message box not in the DOM');
  }
}, 1000)

var messageObserver = new MutationObserver (function(mutations) {
  if (false) {
    // If message box has been removed from the DOM
    console.log('Message Box removed from DOM');

    // Restart check for message box
  }
  else {
    // Cancel check for message box
    clearInterval(checkForMessageBox);

    // Get the conversation content upon changes to the message box
    getConversation(selectors[platform]);
  }
});

function getConversation (platform) {
  // Select all elements which contain conversation text, not yet sorted by whether user or admin
  var conversationNodes = document.querySelector(platform.conversation).querySelectorAll(platform.conversationNodes);
  
  function getSenderType (message) {
    // Specify whether the message is from a user, an admin or unknown
    if (message.querySelector(platform.admin)) {
      return 'admin'
    }
    else if (message.querySelector(platform.user)) {
      return 'user';
    }
    else {
      return 'unspecified';
    }
  }

  function getText (node) {
    // Get text content of a message DOM node
    var textNode = node.querySelector(platform.conversationText);

    if (textNode && textNode.innerText) {
      return textNode.innerText;
    }
    else {
      return undefined;
    }
  }

  var conversationInfo = [];

  for (var i = 0; i < conversationNodes.length - 1; i++) {
    var text = getText(conversationNodes[i]);

    // Only add the message to the conversation array if there is text
    // This avoids e.g. DOM nodes where the user is typing but the actual message does not exist yet
    if (text) {
      conversationInfo.push({
        text: text,
        senderType: getSenderType(conversationNodes[i])
      })
    }
  }
}

function sendContext (context) {
// Send message to chrome extension
  // chrome.extension.sendMessage(context)
}
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

// Open port for sending to and receiving from parent extension
var port = chrome.runtime.connect({name: 'conversationData'});
port.onMessage.addListener(function (msg) {
  console.log(msg);
})

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
    messageObserver.disconnect();
    console.log('Message box not in the DOM');
  }
}, 1000)

var messageObserver = new MutationObserver (function(mutations) {
    // Get the conversation content upon changes to the message box
    var convoData = getConversation(selectors[platform]);
    sendConversationData(convoData);
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

  return conversationInfo;
}

function sendConversationData (data) {
  // Send message to chrome extension
  port.postMessage({data: data});
}


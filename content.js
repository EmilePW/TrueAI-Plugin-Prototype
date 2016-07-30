'use strict'

// DOM selectors for each platform which can use the TrueAI API
// Allows for reuse of functions across platforms as different selectors can be passed as params for each platform
var selectors = {
  intercom: {
    // For messages sent by admin
    admin: '.o__admin-comment',
    // For conversation box
    messageBox: '.conversation__stream',
    // For message blocks in a conversation
    message: '.conversation__bubble',
    // For pieces of text in the conversation
    messageText: '.conversation__text p',
    // For the message text editor
    messageTerminal: '.composer-inbox p',
    // For messages sent by user
    user: '.o__user-comment'
  }
}

var messageInterface = (function (platformSelectors) {
  // Identify platform from url
  var platform = (function (url) {
    if (/(intercom.io)/.test(url)) {
      return 'intercom'
    } else {
      return undefined
    }
  })(document.location.hostname)

  // Get the DOM selectors for this platform
  var selectors = platformSelectors[platform]
  
  function getNode (selector, parent) {
    parent = parent || document

    return parent.querySelector(selectors[selector])
  }

  function getNodes (selector, parent) {
    parent = parent || document

    return parent.querySelectorAll(selectors[selector])
  }

  function isAvailable () {
    // Checks DOM for message box
    return !!getNode('messageBox')
  }

  function initialise () {
    this.messageBox = getNode('messageBox')
  }

  function getConversation () {
    function getSenderType (message) {
      // Specify whether the message is from a user, an admin or unknown
      if (!!getNode('admin', message)) {
        return 'admin'
      } else if (!!getNode('user', message)) {
        return 'user'
      } else {
        return 'unspecified'
      }
    }

    function getText (message) {
      // Get text content of a message DOM node
      var textNode = getNode('messageText', message)

      if (textNode && (textNode.innerText || textNode.hasChildNodes())) {
        return textNode.innerText || 'glyph'
      } else {
        return undefined
      }
    }
    
    var c = []

    // Select all elements which contain conversation text, not yet sorted by whether user or admin
    var messages = getNodes('message')

    for (var i = 0; i < messages.length; i++) {
      if (getText(messages[i])) {
        c.push({
          node: messages[i],
          senderType: getSenderType(messages[i]),
          text: getText(messages[i])
        })
      }
    }

    return c
  }

  function getContext () {
    var lastMessage = getConversation().pop()

    if (lastMessage.senderType === 'user') {
      return lastMessage.text
    } else {
      return false
    }
  }

  function sendContext () {
    var context = getContext()

    if (context) {
      // Context must be a message from a user
      // Send message to chrome extension
      port.postMessage({data: context.text})
    }
  }

  function insertResponse (response) {
    var messageTerminal = getNode('messageTerminal')
    messageTerminal.innerText = response.responseText
  }

  return {
    isAvailable: isAvailable,
    initialise: initialise,
    sendContext: sendContext,
    insertResponse: insertResponse,
    messageBox: undefined
  }
})(selectors)

// Open port for sending to and receiving from parent extension
var port = chrome.runtime.connect({name: 'conversationData'})
port.onMessage.addListener(function (msg) {
  // update terminal
  messageInterface.insertResponse(msg)
})

// Send context to the API on changes in the message box (i.e. new messages)
var messageObserver = new MutationObserver(messageInterface.sendContext)

// Don't attempt to get messages before message box is in the DOM
// Check if message box is in the DOM every second
var checkForMessageBox = setInterval(function () {
  if (messageInterface.isAvailable()) {
    messageInterface.initialise()

    // Watch for DOM and data changes on the messageBox and its children
    var observerConfig = { childList: true, subtree: true }

    // Observe updates to conversation
    messageObserver.observe(messageInterface.messageBox, observerConfig)
  } else {
    // Message box not in the DOM so no need to observe changes
    messageObserver.disconnect()
  }
}, 1000)






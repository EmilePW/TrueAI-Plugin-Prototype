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
    // Message editor parent
    messageTerminalContainer: '.composer-inbox',
    // For reply/send message button,
    sendMessage: '.inbox__conversation-controls__button',
    // Place to append suggestions
    suggestionPosition: '.profile__events__container',
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

    // Reference for position to insert suggestions
    if (!this.suggestionArea) {
      var suggestionPosition = getNode('suggestionPosition')
      var suggestionArea = document.createElement('section')
          
          suggestionArea.className = 'trueai-suggestions-area'
          suggestionPosition.appendChild(suggestionArea)

      this.suggestionArea = suggestionArea
    }

    this.sendMessage = getNode('sendMessage')
    this.sendMessage.addEventListener('click', removeSuggestions.bind(this))
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
    
    var conversation = []

    // Select all elements which contain conversation text, not yet sorted by whether user or admin
    var messages = getNodes('message')

    for (var i = 0; i < messages.length; i++) {
      if (getText(messages[i])) {
        conversation.push({
          node: messages[i],
          senderType: getSenderType(messages[i]),
          text: getText(messages[i])
        })
      }
    }

    return conversation
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
      port.postMessage({
        context: context.text,
        companyName: platform
      })
    }
  }

  function isMessageTerminalEmpty () {
    // Boolean for whether the message terminal is 'empty'
    // Max length is 1 as the text editors often contain special characters when no text is visible
    var messageTerminal = getNode('messageTerminal')
    return messageTerminal.innerText.length <= 1
  }

  function insertResponse (response) {
    var messageTerminal = getNode('messageTerminal')
    messageTerminal.innerText = response
    
    // This fixes bug on intercom where no text is sent until the editor is clicked on
    if (platform === 'intercom') {
      var messageTerminalContainer = getNode('messageTerminalContainer')
      messageTerminalContainer.click()
    }
  }

  function insertSuggestions (suggestions) {
    // Suggestions should be an array of strings
    var suggestionArea = this.suggestionArea

    suggestions.forEach(function (text) {
        /* React.js would be nice here if it gets any larger */

        // Sticker to be appended to inserted responses to indicate they came from TrueAI
        var sticker = document.createElement('span')
            sticker.className = 'trueai-sticker'

        var logo = document.createElement('img')
            logo.className = 'trueai-logo'
            logo.src = 'https://pbs.twimg.com/profile_images/728184818115215360/C-OSDu91.jpg'
            sticker.appendChild(logo)

        var suggestionText = document.createElement('span')
            suggestionText.className = 'trueai-suggestion-text'
            suggestionText.innerText = text

        // Clickable button to display and add suggestions
        var suggestionBox = document.createElement('button')
            suggestionBox.className = 'trueai-suggestion-' + platform
            suggestionBox.appendChild(suggestionText)
            suggestionBox.appendChild(sticker)
            suggestionBox.addEventListener('click', function () { insertResponse(text) })

        suggestionArea.appendChild(suggestionBox)
    })
  }

  function hasSuggestions () {
    return !!this.suggestionArea.lastChild
  }

  function removeSuggestions () {
    while (this.suggestionArea.lastChild) {
      this.suggestionArea.removeChild(this.suggestionArea.lastChild);
    }
  }

  return {
    isAvailable: isAvailable,
    initialise: initialise,
    sendContext: sendContext,
    isMessageTerminalEmpty: isMessageTerminalEmpty,
    hasSuggestions: hasSuggestions,
    insertSuggestions: insertSuggestions,
    messageBox: undefined,
    suggestionArea: undefined
  }
})(selectors)

// Open port for sending to and receiving from event page
var port = chrome.runtime.connect({name: 'messageData'})
    port.onMessage.addListener(function (msg) {
      // update terminal if empty
      if (!messageInterface.hasSuggestions()) {
        messageInterface.insertSuggestions(msg)
      }
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

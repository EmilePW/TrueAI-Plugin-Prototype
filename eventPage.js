'use strict'

// Open connection to conversationData port from content script
chrome.runtime.onConnect.addListener(function (port) {
  console.assert(port.name === 'conversationData')

  // Waiting for conversation data to be sent from the page
  port.onMessage.addListener(function (msg) {
    var req = new XMLHttpRequest()

    // Open mock API to get responses to messages
    req.open('GET', 'https://mock-ai-api.herokuapp.com/suggestions/?q=' + msg + '&company=intercom')

    req.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        // Send the 'AI' response back to the content script to be injected into the page
        var responseText = JSON.parse(this.response)
        port.postMessage({responseText: responseText})
      } else {
        port.postMessage({error: this.statusText})
      }
    }

    req.onerror = function (err) {
      port.postMessage({
        error: err
      })
    }

    req.send()
  })
})

'use strict'

// Open connection to conversationData port from content script
chrome.runtime.onConnect.addListener(function (port) {
  console.assert(port.name === 'conversationData')

  port.onMessage.addListener(function (msg) {
    var req = new XMLHttpRequest()
    req.open('GET', 'https://mock-ai-api.herokuapp.com/suggestions/?q=' + msg + '&company=intercom')

    req.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        var response = JSON.parse(this.response)
        port.postMessage({response: response})
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

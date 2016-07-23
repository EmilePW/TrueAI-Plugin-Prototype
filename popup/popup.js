


/*
 * @param object - name of customer platform (must be one of those available)
**/
function getContext (options, url) {
  // Get context of conversations from a customer support tab
}

function setContent (newContent) {
  document.getElementById('status').textContent = newContent;
}

function getCurrentTab (callback) {
  var options = {
    active: true,
    currentWindow: true
  }

  chrome.tabs.query(options, function (tabs) {
    var tab = tabs[0]

    callback(tab.url)
  })
}

document.addEventListener('DOMContentLoaded', function () {
  chrome.tabs.getCurrent(function() {
    alert(tab.title)
  })
})




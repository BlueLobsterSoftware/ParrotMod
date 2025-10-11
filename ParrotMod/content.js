(async function () {
  // Inject the main logic into the page context so React event listeners receive our synthetic events.
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injected.js');
  document.documentElement.appendChild(script);
  script.remove();
})();

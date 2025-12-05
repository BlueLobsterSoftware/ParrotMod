// ==UserScript==
// @name         ParrotMod
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  ParrotMod is the new sensation
// @author       Blue Lobster Software
// @match        https://www.tryparrotai.com/app/create*
// @grant        none
// @icon         https://github.com/BlueLobsterSoftware/ParrotMod/blob/main/ParrotMod.png?raw=true
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ------------------------------------------------------------
  // Quick guard: don't initialize twice
  // ------------------------------------------------------------
  // If the wrapper already exists, another instance has run; bail out.
  if (document.getElementById('customInputWrapper')) return;

  // ------------------------------------------------------------
  // Config / Constants
  // ------------------------------------------------------------
  const LOGO_URL = 'https://github.com/BlueLobsterSoftware/ParrotMod/blob/main/ParrotMod.png?raw=true';
  const DEFAULT_TEXTAREA_PLACEHOLDER = 'Enter your text here...';

  // Target selectors used throughout the script. If the target site changes,
  // update these selectors in one place.
  const SELECTORS = {
    counter: 'div.w-full.text-right.text-gray-500',
    watermarkLabel: 'label.cursor-pointer',
    watermarkSpan: 'span.label-text',
    header: 'h1.text-4xl',
    generateButton: 'button.btn.btn-primary.w-full.mt-3',
    logoImages: 'img[alt="Parrot AI logo"]',
  };

  // ------------------------------------------------------------
  // Small utility helpers
  // ------------------------------------------------------------
  /**
   * Wait for an element matching `selector` to exist, then call `callback(el)`.
   * Times out after `timeout` ms (default 10000).
   * This is a tiny helper instead of importing a library.
   *
   * @param {string} selector
   * @param {(el: Element) => void} callback
   * @param {number} [timeout=10000]
   */
  function waitForElement(selector, callback, timeout = 10000) {
    const interval = 300;
    let elapsed = 0;
    const timer = setInterval(() => {
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(timer);
        callback(el);
        return;
      }
      elapsed += interval;
      if (elapsed >= timeout) clearInterval(timer);
    }, interval);
  }

  // ------------------------------------------------------------
  // CSS injection: styles used by the script
  // ------------------------------------------------------------
  // We inject a small <style> block so we don't rely on external stylesheets.
  const style = document.createElement('style');
  style.innerHTML = `
    /* Hide a few Parrot-provided textareas/buttons by matching their attributes */
    textarea[placeholder*="Let's make this call great"],
    textarea[placeholder^="Enter some text for"],
    textarea[placeholder^="Well, I am"],
    textarea[placeholder][class*="w-full"][class*="p-2"][class*="border"][class*="rounded"],
    body > div:nth-child(2) > div > div:nth-child(2) > div > section:nth-child(2) > div > button {
      display: none !important;
    }

    /* Fun header animation */
    @keyframes rainbowFlash {
      0% { color: red; }
      20% { color: orange; }
      40% { color: yellow; }
      60% { color: green; }
      80% { color: blue; }
      100% { color: violet; }
    }
    .rainbow-text {
      font-size: 3rem !important;
      font-weight: bold !important;
      animation: rainbowFlash 2s infinite;
    }

    /* Button background color cycling */
    @keyframes buttonFlashLoop {
      0%, 100% { background-color: #4f46e5; }
      25% { background-color: #ff5722; }
      50% { background-color: #ffc107; }
      75% { background-color: #00bcd4; }
    }
    .flash-loop {
      animation: buttonFlashLoop 2s infinite;
    }
  `;
  document.head.appendChild(style);

  // ------------------------------------------------------------
  // Create the custom input UI (textarea) and attach behavior
  // ------------------------------------------------------------
  const wrapper = document.createElement('div');
  wrapper.id = 'customInputWrapper';
  wrapper.style.width = '100%';
  wrapper.style.marginTop = '16px';
  wrapper.style.marginBottom = '10px';

  const input = document.createElement('textarea');
  input.placeholder = DEFAULT_TEXTAREA_PLACEHOLDER;
  Object.assign(input.style, {
    padding: '12px',
    width: '100%',
    fontSize: '16px',
    border: '2px solid #4f46e5',
    borderRadius: '8px',
    outline: 'none',
    resize: 'vertical',
  });
  input.rows = 5;

  /**
   * When the textarea loses focus we serialize its contents to the page URL
   * as a `text` query parameter. Spaces are converted to `+` to preserve the
   * previous behavior used by the original script.
   */
  input.addEventListener('blur', () => {
    const text = input.value.trim();
    if (!text) return; // don't write empty text to the URL

    // Convert spaces to + (note: this is a very small, intentional encoding)
    const plusText = text.replace(/ /g, '+');

    const currentURL = new URL(window.location.href);
    const base = `${currentURL.origin}${currentURL.pathname}`;

    // Rebuild the query string, preserving existing params except `text` (explicit)
    const params = [];
    currentURL.searchParams.forEach((value, key) => {
      if (key !== 'text') params.push(`${key}=${value}`);
    });
    params.push(`text=${plusText}`);
    const finalURL = `${base}?${params.join('&')}`;

    // Use history.replaceState so we don't create back-button noise
    window.history.replaceState(null, '', finalURL);
  });

  wrapper.appendChild(input);

  // Insert the custom UI next to the counter element when it appears
  waitForElement(SELECTORS.counter, counter => {
    // Visible label used elsewhere; we replace the text here
    counter.textContent = 'ED_UNLIMITED';
    // Insert the wrapper just before the counter element
    counter.parentElement.insertBefore(wrapper, counter);
  });

  // ------------------------------------------------------------
  // Small accessibility/UX tweaks: auto-toggle watermark, relabel text
  // ------------------------------------------------------------
  waitForElement(SELECTORS.watermarkLabel, () => {
    // Find label that contains the watermark text and click it (to toggle)
    const label = Array.from(document.querySelectorAll(SELECTORS.watermarkLabel))
      .find(label => label.innerText.includes('Remove "made with Parrot" watermark'));
    if (label) label.click();
  });

  waitForElement(SELECTORS.watermarkSpan, () => {
    // Find the span and change its text to a friendlier label
    const span = Array.from(document.querySelectorAll(SELECTORS.watermarkSpan))
      .find(el => el.textContent.includes('Remove "made with Parrot" watermark'));
    if (span) span.textContent = 'Remove the Parrot AI watermark';
  });

  // ------------------------------------------------------------
  // MutationObserver: continually tune header, button, and logos as DOM changes
  // ------------------------------------------------------------
  const observer = new MutationObserver(() => {
    // Make the page header colorful and rename it to the script name
    const header = document.querySelector(SELECTORS.header);
    if (header && !header.classList.contains('rainbow-text')) {
      header.textContent = 'ParrotMod';
      header.classList.add('rainbow-text');
    }

    // Give the generate button a flashing background and alter its label
    const genBtn = document.querySelector(SELECTORS.generateButton);
    if (genBtn && !genBtn.classList.contains('flash-loop')) {
      genBtn.textContent = 'ED_GenerateButton';
      genBtn.classList.add('flash-loop');
    }

    // Swap any official logo images to the repo-hosted ParrotMod image
    const imgs = document.querySelectorAll(SELECTORS.logoImages);
    imgs.forEach(img => {
      if (!img.src.includes('ParrotMod.png')) {
        img.src = LOGO_URL;
        img.srcset = img.src;
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();

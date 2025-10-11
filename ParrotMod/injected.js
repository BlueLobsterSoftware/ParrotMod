(function () {
  'use strict';

  if (document.getElementById('customInputWrapper')) return;

  const LOGO_URL = 'https://github.com/BlueLobsterSoftware/ParrotMod/blob/main/ParrotMod/ParrotMod.png?raw=true';
  const DEFAULT_TEXTAREA_PLACEHOLDER = 'Enter your text here...';
  const SELECTORS = {
    counter: 'div.w-full.text-right.text-gray-500',
    watermarkLabel: 'label.cursor-pointer',
    watermarkSpan: 'span.label-text',
    header: 'h1.text-4xl',
    generateButton: 'button.btn.btn-primary.w-full.mt-3',
    logoImages: 'img[alt="Parrot AI logo"]'
  };

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

  function createStyle() {
    const style = document.createElement('style');
    style.textContent = `
      textarea[placeholder*="Let's make this call great"],
      textarea[placeholder^="Enter some text for"],
      textarea[placeholder^="Well, I am"],
      textarea[placeholder][class*="w-full"][class*="p-2"][class*="border"][class*="rounded"],
      body > div:nth-child(2) > div > div:nth-child(2) > div > section:nth-child(2) > div > button {
        display: none !important;
      }

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
    (document.head || document.documentElement).appendChild(style);
  }

  function main() {
    createStyle();

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
      resize: 'vertical'
    });
    input.rows = 5;

    input.addEventListener('blur', () => {
      const text = input.value.trim();
      if (!text) return;
      const plusText = text.replace(/ /g, '+');
      const currentURL = new URL(window.location.href);
      const base = `${currentURL.origin}${currentURL.pathname}`;
      const params = [];
      currentURL.searchParams.forEach((value, key) => {
        if (key !== 'text') params.push(`${key}=${value}`);
      });
      params.push(`text=${plusText}`);
      const finalURL = `${base}?${params.join('&')}`;
      window.history.replaceState(null, '', finalURL);
    });

    wrapper.appendChild(input);

    function getExternalTextareas() {
      return Array.from(document.querySelectorAll('textarea')).filter(t => t !== input);
    }

    function copyToOriginalTextareas() {
      const text = input.value || '';
      getExternalTextareas().forEach(t => {
        try {
          t.value = text;
          t.dispatchEvent(new Event('input', { bubbles: true }));
          t.dispatchEvent(new Event('change', { bubbles: true }));
        } catch {}
      });
    }

    input.addEventListener('input', () => copyToOriginalTextareas());

    waitForElement(SELECTORS.counter, counter => {
      counter.textContent = 'ED_UNLIMITED';
      counter.parentElement.insertBefore(wrapper, counter);
    });

    waitForElement(SELECTORS.watermarkLabel, () => {
      const label = Array.from(document.querySelectorAll(SELECTORS.watermarkLabel))
        .find(l => l.innerText.includes('Remove "made with Parrot" watermark'));
      if (label) label.click();
    });

    waitForElement(SELECTORS.watermarkSpan, () => {
      const span = Array.from(document.querySelectorAll(SELECTORS.watermarkSpan))
        .find(el => el.textContent.includes('Remove "made with Parrot" watermark'));
      if (span) span.textContent = 'Remove the Parrot AI watermark';
    });

    const observer = new MutationObserver(() => {
      const header = document.querySelector(SELECTORS.header);
      if (header && !header.classList.contains('rainbow-text')) {
        header.textContent = 'ParrotMod';
        header.classList.add('rainbow-text');
      }

      const genBtn = document.querySelector(SELECTORS.generateButton);
      if (genBtn && !genBtn.classList.contains('flash-loop')) {
        genBtn.textContent = 'ED_GenerateButton';
        genBtn.classList.add('flash-loop');
      }

      if (genBtn && !genBtn.dataset.edAttached) {
        const handler = (e) => {
          copyToOriginalTextareas();
          const text = (input.value || '').trim();
          if (!text) {
            e.preventDefault();
            e.stopImmediatePropagation();
            input.focus();
            input.style.borderColor = '#ff5722';
            setTimeout(() => (input.style.borderColor = '#4f46e5'), 1200);
          }
        };
        genBtn.addEventListener('click', handler, true);
        genBtn.dataset.edAttached = '1';
      }

      const imgs = document.querySelectorAll(SELECTORS.logoImages);
      imgs.forEach(img => {
        if (!img.src.includes('ParrotMod.png')) {
          img.src = LOGO_URL;
          img.srcset = img.src;
        }
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Ensure we run after all page scripts
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(main, 1000);
  } else {
    window.addEventListener('load', () => setTimeout(main, 1000));
  }
})();

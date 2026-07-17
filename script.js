document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const id = link.getAttribute('href');
    if (id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });
});

(function initGalleryLightbox() {
  const triggers = Array.from(document.querySelectorAll('.gallery-trigger'));
  const lightbox = document.getElementById('lightbox');
  if (!triggers.length || !lightbox) return;

  const imageEl = document.getElementById('lightbox-image');
  const captionEl = document.getElementById('lightbox-caption');
  const dialog = lightbox.querySelector('.lightbox-dialog');
  const prevBtn = lightbox.querySelector('.lightbox-prev');
  const nextBtn = lightbox.querySelector('.lightbox-next');
  const closeButtons = lightbox.querySelectorAll('[data-lightbox-close]');

  const items = triggers.map((trigger) => {
    const img = trigger.querySelector('img');
    const figure = trigger.closest('.gallery-item');
    const caption = figure ? figure.querySelector('figcaption') : null;
    return {
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt') || '',
      caption: caption ? caption.textContent.trim() : ''
    };
  });

  let index = 0;
  let lastFocus = null;

  const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function getFocusable() {
    return Array.from(dialog.querySelectorAll(focusableSelector)).filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
    );
  }

  function render() {
    const item = items[index];
    imageEl.src = item.src;
    imageEl.alt = item.alt;
    captionEl.textContent = item.caption;
  }

  function open(startIndex) {
    index = startIndex;
    lastFocus = document.activeElement;
    render();
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    dialog.focus();
  }

  function close() {
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    imageEl.removeAttribute('src');
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
  }

  function showNext(step) {
    index = (index + step + items.length) % items.length;
    render();
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      open(Number(trigger.dataset.galleryIndex) || 0);
    });
  });

  closeButtons.forEach((button) => {
    button.addEventListener('click', close);
  });

  prevBtn.addEventListener('click', () => showNext(-1));
  nextBtn.addEventListener('click', () => showNext(1));

  document.addEventListener('keydown', (event) => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showNext(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      showNext(1);
    } else if (event.key === 'Tab') {
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
})();

(function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const success = document.getElementById('form-success');
  const error = document.getElementById('form-error');
  const isLocalHost =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.hostname === '[::1]';

  function showSuccess() {
    if (error) {
      error.hidden = true;
      error.textContent = '';
    }
    form.reset();
    form.querySelectorAll('label, button, .trust-note').forEach((el) => {
      el.hidden = true;
    });
    if (success) {
      success.hidden = false;
      success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  if (new URLSearchParams(window.location.search).get('success') === 'true') {
    showSuccess();
  }

  form.addEventListener('submit', async (event) => {
    if (error) {
      error.hidden = true;
      error.textContent = '';
    }

    if (!form.checkValidity()) {
      return;
    }

    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
    }

    // Lokale Vorschau: kein Netlify-Backend – Erfolgszustand nur simulieren
    if (isLocalHost) {
      showSuccess();
      return;
    }

    try {
      const formData = new FormData(form);
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      });

      if (!response.ok) {
        throw new Error('Formular konnte nicht gesendet werden.');
      }

      showSuccess();
    } catch (err) {
      if (error) {
        error.hidden = false;
        error.textContent =
          'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder schreiben Sie direkt an berlin.alexander@icloud.com.';
      }
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
})();

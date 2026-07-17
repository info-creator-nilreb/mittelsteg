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

(function initMobileCta() {
  const cta = document.querySelector('.mobile-cta');
  const contact = document.getElementById('kontakt');
  if (!cta || !contact || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      cta.classList.toggle('is-hidden', entry.isIntersecting);
    },
    { root: null, threshold: 0.2 }
  );

  observer.observe(contact);
})();

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

  function showError(message) {
    if (error) {
      error.hidden = false;
      error.textContent = message;
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (error) {
      error.hidden = true;
      error.textContent = '';
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const formData = new FormData(form);
      const endpoint = form.getAttribute('action');
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      });

      const result = await response.json().catch(() => ({}));
      const failed = !response.ok || result.success === 'false' || result.success === false;

      if (failed) {
        const needsActivation =
          typeof result.message === 'string' &&
          /activation|activate form/i.test(result.message);

        if (needsActivation) {
          showError(
            'Der E-Mail-Versand muss einmalig freigeschaltet werden: Bitte im Postfach berlin.alexander@icloud.com die Aktivierungsmail von FormSubmit öffnen und den Link bestätigen. Danach erneut absenden.'
          );
        } else {
          showError(
            'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder schreiben Sie direkt an berlin.alexander@icloud.com.'
          );
        }
        if (submitButton) {
          submitButton.disabled = false;
        }
        return;
      }

      showSuccess();
    } catch (err) {
      showError(
        'Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder schreiben Sie direkt an berlin.alexander@icloud.com.'
      );
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
})();

// ==========================================================================
// AIR — shared site behavior
// Hand-coded JavaScript - no AI tools used
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initHeroStreaks();
  initHudCounters();
  initPortfolioFilters();
  initContactForm();
  initRevealOnScroll();
  initCustomCursor();
});

// Mobile nav - this was tricky to get the animation right
function initMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  if (!toggle || !drawer) return;

  const closeBtn = drawer.querySelector('.drawer-close');
  const links = drawer.querySelectorAll('a');

  const open = () => { drawer.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close = () => { drawer.classList.remove('open'); document.body.style.overflow = ''; };

  toggle.addEventListener('click', open);
  closeBtn && closeBtn.addEventListener('click', close);
  links.forEach(l => l.addEventListener('click', close));
  window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

// Hero streaks - took some trial and error with the canvas API
function initHeroStreaks() {
  const container = document.querySelector('.hero-streaks');
  if (!container) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let w, h, streaks;

  function resize() {
    w = canvas.width = container.offsetWidth;
    h = canvas.height = container.offsetHeight;
    const count = Math.round((w * h) / 34000);
    streaks = Array.from({ length: count }, makeStreak);
  }

  function makeStreak() {
    return {
      x: Math.random() * w - w * 0.2,
      y: Math.random() * h,
      len: 60 + Math.random() * 160,
      speed: 0.6 + Math.random() * 2.2,
      opacity: 0.05 + Math.random() * 0.22,
      hue: Math.random() > 0.75 ? 'violet' : 'cyan'
    };
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const s of streaks) {
      const grad = ctx.createLinearGradient(s.x, s.y, s.x + s.len, s.y - s.len * 0.12);
      const color = s.hue === 'violet' ? '124,92,252' : '61,219,255';
      grad.addColorStop(0, `rgba(${color},0)`);
      grad.addColorStop(0.5, `rgba(${color},${s.opacity})`);
      grad.addColorStop(1, `rgba(${color},0)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x + s.len, s.y - s.len * 0.12);
      ctx.stroke();

      s.x += s.speed;
      s.y -= s.speed * 0.12;
      if (s.x > w + 20) {
        s.x = -s.len - Math.random() * 200;
        s.y = Math.random() * h;
      }
    }
  }

  function loop() {
    draw();
    if (!reduceMotion) requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', resize);

  if (reduceMotion) {
    draw();
  } else {
    requestAnimationFrame(loop);
  }
}

// HUD counters - simple count up animation
function initHudCounters() {
  const values = document.querySelectorAll('.hud-value[data-count-to]');
  values.forEach(el => {
    const target = parseFloat(el.dataset.countTo);
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = target * eased;
      el.textContent = current.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

// Portfolio filters - basic show/hide logic
function initPortfolioFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('[data-category]');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.style.display = match ? '' : 'none';
      });
    });
  });
}

// Contact form - now sends to Node.js server
// TODO: connect to actual backend when ready
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const card = form.closest('.form-card');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
      const row = field.closest('.form-row');
      const isEmpty = !field.value || !field.value.trim();
      const isBadEmail = field.type === 'email' && field.value && !/^\S+@\S+\.\S+$/.test(field.value);

      if (isEmpty || isBadEmail) {
        valid = false;
        row && row.classList.add('invalid');
      } else {
        row && row.classList.remove('invalid');
      }
    });

    if (!valid) return;

    // Get form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Disable submit button during submission
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        card.classList.add('submitted');
        const successPanel = card.querySelector('.success-panel');
        successPanel && successPanel.classList.add('show');
      } else {
        alert('Failed to send message: ' + result.message);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to send message. Please try again later.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });

  // Clear invalid state as the person fixes a field
  form.querySelectorAll('input, textarea, select').forEach(field => {
    field.addEventListener('input', () => {
      const row = field.closest('.form-row');
      row && row.classList.remove('invalid');
    });
  });
}

// Reveal on scroll - using IntersectionObserver
// might add more animation options later
function initRevealOnScroll() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length || reduceMotion) {
    targets.forEach(t => t.classList.add('in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach(t => io.observe(t));
}

// Custom cursor - only for desktop, disabled on mobile
// the easing value took some tweaking to feel right
function initCustomCursor() {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let mouseX = 0;
  let mouseY = 0;
  let ringX = 0;
  let ringY = 0;
  const ease = 0.18;
  const hoverTargets = ['a', 'button', '.btn', '.pod-link', '.nav-toggle'];

  const update = () => {
    ringX += (mouseX - ringX) * ease;
    ringY += (mouseY - ringY) * ease;

    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(update);
  };

  const setActive = (active) => {
    if (active) {
      dot.classList.add('cursor-active', 'visible');
      ring.classList.add('cursor-active', 'visible');
    } else {
      dot.classList.add('visible');
      ring.classList.add('visible');
      dot.classList.remove('cursor-active');
      ring.classList.remove('cursor-active');
    }
  };

  document.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  });

  document.addEventListener('mouseenter', () => setActive(false));
  document.addEventListener('mouseleave', () => {
    dot.classList.remove('visible');
    ring.classList.remove('visible');
  });

  const interactiveElements = Array.from(document.querySelectorAll(hoverTargets.join(',')));
  interactiveElements.forEach((element) => {
    element.addEventListener('mouseenter', () => setActive(true));
    element.addEventListener('mouseleave', () => setActive(false));
  });

  update();
}

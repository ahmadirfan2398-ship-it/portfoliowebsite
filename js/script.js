const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================
   SCROLL PROGRESS BAR + RING
   ============================================ */
const progressBar = document.getElementById('progressBar');
const progressRing = document.getElementById('progressRing');
const RING_CIRCUMFERENCE = 119.4;

function updateProgressBar() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  if (progressBar) progressBar.style.width = pct + '%';
  if (progressRing) {
    const offset = RING_CIRCUMFERENCE - (pct / 100) * RING_CIRCUMFERENCE;
    progressRing.style.strokeDashoffset = offset;
  }
}
window.addEventListener('scroll', updateProgressBar, { passive: true });
updateProgressBar();

/* ============================================
   THEME TOGGLE (dark / light) — persisted in localStorage.
   Wrapped in try/catch so it still works even inside
   sandboxed preview frames where localStorage is blocked.
   ============================================ */
const themeToggle = document.getElementById('themeToggle');
const htmlEl = document.documentElement;

function applyTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
}

try {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    applyTheme(savedTheme);
  }
} catch (e) { /* localStorage unavailable — keep default */ }

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isLight = htmlEl.getAttribute('data-theme') === 'light';
    const next = isLight ? 'dark' : 'light';
    applyTheme(next);
    try {
      localStorage.setItem('theme', next);
    } catch (e) { /* ignore */ }
  });
}

/* ============================================
   NAV DROPDOWN ("More")
   ============================================ */
const moreBtn = document.getElementById('moreBtn');
const moreMenu = document.getElementById('moreMenu');

if (moreBtn && moreMenu) {
  moreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = moreMenu.classList.toggle('is-open');
    moreBtn.setAttribute('aria-expanded', String(isOpen));
  });
  document.addEventListener('click', (e) => {
    if (!moreMenu.contains(e.target) && e.target !== moreBtn) {
      moreMenu.classList.remove('is-open');
      moreBtn.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      moreMenu.classList.remove('is-open');
      moreBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ============================================
   SIDEBAR MENU TOGGLE (top-left)
   Opens a left sidebar; same button closes it.
   ============================================ */
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebarClose = document.getElementById('sidebarClose');
const sidebarMoreBtn = document.getElementById('sidebarMoreBtn');
const sidebarMoreLinks = document.getElementById('sidebarMoreLinks');

function setSidebar(open) {
  if (sidebar) sidebar.classList.toggle('is-open', open);
  if (sidebarOverlay) sidebarOverlay.classList.toggle('is-open', open);
  if (sidebarToggle) sidebarToggle.setAttribute('aria-expanded', String(open));
  if (sidebar) sidebar.setAttribute('aria-hidden', String(!open));
  if (sidebarOverlay) sidebarOverlay.setAttribute('aria-hidden', String(!open));
}

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => {
    setSidebar(!sidebar.classList.contains('is-open'));
  });

  sidebar.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setSidebar(false));
  });

  if (sidebarClose) {
    sidebarClose.addEventListener('click', () => setSidebar(false));
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => setSidebar(false));
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setSidebar(false);
  });
}

if (sidebarMoreBtn && sidebarMoreLinks) {
  sidebarMoreBtn.addEventListener('click', () => {
    const isOpen = sidebarMoreLinks.classList.toggle('is-open');
    sidebarMoreBtn.setAttribute('aria-expanded', String(isOpen));
  });
}

/* ============================================
   SIDEBAR SECTION DOTS — active state on scroll
   ============================================ */
const sideDots = document.querySelectorAll('.side-dots .dot');
const trackedSections = ['top', 'work', 'about', 'skills', 'faq', 'contact']
  .map((id) => document.getElementById(id))
  .filter(Boolean);

if (sideDots.length && trackedSections.length && 'IntersectionObserver' in window) {
  const dotObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        sideDots.forEach((dot) => {
          dot.classList.toggle('active', dot.dataset.section === id);
        });
      }
    });
  }, { threshold: 0.4, rootMargin: '-10% 0px -10% 0px' });

  trackedSections.forEach((section) => dotObserver.observe(section));
}

/* ============================================
   BACK TO TOP
   ============================================ */
const backToTop = document.getElementById('backToTop');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('is-visible', window.scrollY > 500);
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
}

/* ============================================
   ANIMATED COUNTERS
   ============================================ */
const statEls = document.querySelectorAll('.stat');
if (statEls.length && 'IntersectionObserver' in window) {
  const animateCount = (el) => {
    const target = parseInt(el.dataset.target, 10) || 0;
    const countEl = el.querySelector('.count');
    if (!countEl) return;

    if (prefersReducedMotion) {
      countEl.textContent = target;
      return;
    }

    const duration = 1200;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      countEl.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statEls.forEach((el) => statObserver.observe(el));
}

/* ============================================
   TABS
   ============================================ */
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabBtns.forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    tabPanels.forEach((p) => p.classList.remove('active'));

    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    const target = document.getElementById(btn.dataset.tab);
    if (target) target.classList.add('active');
  });
});

/* ============================================
   DESIGN PLAYGROUND — range sliders update the card live
   ============================================ */
const playgroundCard = document.getElementById('playgroundCard');
const radiusRange = document.getElementById('radiusRange');
const brightnessRange = document.getElementById('brightnessRange');
const grayscaleRange = document.getElementById('grayscaleRange');
const radiusVal = document.getElementById('radiusVal');
const brightnessVal = document.getElementById('brightnessVal');
const grayscaleVal = document.getElementById('grayscaleVal');
const playgroundReset = document.getElementById('playgroundReset');

function updatePlayground() {
  if (!playgroundCard) return;
  const radius = radiusRange.value;
  const brightness = brightnessRange.value;
  const grayscale = grayscaleRange.value;
  if (radiusVal) radiusVal.textContent = radius + 'px';
  if (brightnessVal) brightnessVal.textContent = brightness + '%';
  if (grayscaleVal) grayscaleVal.textContent = grayscale + '%';
  playgroundCard.style.borderRadius = radius + 'px';
  playgroundCard.style.filter = 'brightness(' + brightness + '%) grayscale(' + grayscale + '%)';
}

if (playgroundCard && radiusRange) {
  [radiusRange, brightnessRange, grayscaleRange].forEach((range) => {
    if (range) range.addEventListener('input', updatePlayground);
  });
  if (playgroundReset) {
    playgroundReset.addEventListener('click', () => {
      radiusRange.value = 12;
      brightnessRange.value = 100;
      grayscaleRange.value = 0;
      updatePlayground();
    });
  }
  updatePlayground();
}

/* ============================================
   PASSWORD STRENGTH
   ============================================ */
const passwordInput = document.getElementById('passwordInput');
const passwordMeter = document.getElementById('passwordMeter');
const passwordMessage = document.getElementById('passwordMessage');
const passwordRules = {
  length: (pw) => pw.length >= 8,
  case: (pw) => /[a-z]/.test(pw) && /[A-Z]/.test(pw),
  number: (pw) => /\d/.test(pw),
  symbol: (pw) => /[^A-Za-z0-9]/.test(pw)
};

function checkPassword() {
  if (!passwordInput || !passwordMeter || !passwordMessage) return;
  const pw = passwordInput.value;

  document.querySelectorAll('.password-rules li').forEach((li) => {
    const rule = li.dataset.rule;
    if (passwordRules[rule]) {
      li.classList.toggle('is-met', passwordRules[rule](pw));
    }
  });

  if (!pw) {
    passwordMeter.setAttribute('data-score', '0');
    passwordMessage.setAttribute('data-strength', '');
    passwordMessage.textContent = 'Start typing to check strength…';
    return;
  }

  let score = 0;
  if (passwordRules.length(pw)) score++;
  if (passwordRules.case(pw)) score++;
  if (passwordRules.number(pw)) score++;
  if (passwordRules.symbol(pw)) score++;

  const labels = { 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong' };
  const strengths = { 1: 'weak', 2: 'fair', 3: 'good', 4: 'strong' };

  passwordMeter.setAttribute('data-score', String(score));
  passwordMessage.setAttribute('data-strength', strengths[score] || '');
  passwordMessage.textContent = labels[score] || 'Too weak';
}

if (passwordInput) {
  passwordInput.addEventListener('input', checkPassword);
  checkPassword();
}

/* ============================================
   AUTH — real signup / login via MongoDB backend
   ============================================ */
const authName = document.getElementById('authName');
const authEmail = document.getElementById('authEmail');
const signupBtn = document.getElementById('signupBtn');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authNote = document.getElementById('authNote');
const navAuthBtn = document.getElementById('navAuthBtn');

function setAuthNote(text, type) {
  if (!authNote) return;
  authNote.textContent = text;
  authNote.setAttribute('data-auth', type || '');
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function currentScore() {
  const pw = passwordInput ? passwordInput.value : '';
  if (!pw) return 0;
  return passwordRules.length(pw) +
    passwordRules.case(pw) +
    passwordRules.number(pw) +
    passwordRules.symbol(pw);
}

function setLoggedIn(userName) {
  if (logoutBtn) logoutBtn.classList.remove('is-hidden');
  if (signupBtn) signupBtn.classList.add('is-hidden');
  if (loginBtn) loginBtn.classList.add('is-hidden');
  if (navAuthBtn) {
    navAuthBtn.dataset.mode = 'loggedin';
    navAuthBtn.textContent = 'Hi, ' + (userName || 'User');
  }
}

function setLoggedOut() {
  if (logoutBtn) logoutBtn.classList.add('is-hidden');
  if (signupBtn) signupBtn.classList.remove('is-hidden');
  if (loginBtn) loginBtn.classList.remove('is-hidden');
  if (navAuthBtn) {
    navAuthBtn.dataset.mode = 'signup';
    navAuthBtn.textContent = 'Sign Up';
  }
}

if (navAuthBtn) {
  navAuthBtn.addEventListener('click', () => {
    const demo = document.getElementById('authDemo');
    if (demo) demo.scrollIntoView({ behavior: 'smooth' });
  });
}

if (signupBtn) {
  signupBtn.addEventListener('click', async () => {
    const name = authName.value.trim();
    const email = authEmail.value.trim();
    const pw = passwordInput.value;
    if (!name) { setAuthNote('Sign up ke liye apna naam bhi likho.', 'error'); return; }
    if (!email) { setAuthNote('Email likho pehle.', 'error'); return; }
    if (!pw) { setAuthNote('Password likho.', 'error'); return; }
    if (pw.length < 8) {
      setAuthNote('Password kam se kam 8 characters ka ho.', 'error');
      return;
    }
    setAuthNote('Creating account…', '');
    try {
      const { res, data } = await apiPost('/api/auth/signup', { name, email, password: pw });
      if (!res.ok || !data.ok) throw new Error(data.error || 'Signup failed.');
      localStorage.setItem('token', data.token);
      authName.value = '';
      authEmail.value = '';
      passwordInput.value = '';
      checkPassword();
      setLoggedIn(data.user.name);
      setAuthNote('Account ban gaya — welcome, ' + data.user.name + '!', 'ok');
    } catch (err) {
      setAuthNote(err.message, 'error');
    }
  });
}

if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const email = authEmail.value.trim();
    const pw = passwordInput.value;
    if (!email || !pw) { setAuthNote('Email aur password dono likho.', 'error'); return; }
    setAuthNote('Logging in…', '');
    try {
      const { res, data } = await apiPost('/api/auth/login', { email, password: pw });
      if (!res.ok || !data.ok) throw new Error(data.error || 'Login failed.');
      localStorage.setItem('token', data.token);
      authEmail.value = '';
      passwordInput.value = '';
      checkPassword();
      setLoggedIn(data.user.name);
      setAuthNote('Logged in — welcome back, ' + data.user.name + '!', 'ok');
    } catch (err) {
      setAuthNote(err.message, 'error');
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    setLoggedOut();
    setAuthNote('Logged out.', 'ok');
  });
}

(function restoreSession() {
  if (!localStorage.getItem('token')) return;
  fetch('/api/auth/me', {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.ok && data.user) {
        setLoggedIn(data.user.name);
        setAuthNote('Logged in as ' + data.user.name + '.', 'ok');
      } else {
        localStorage.removeItem('token');
      }
    })
    .catch(() => {});
})();

/* ============================================
   ACCORDION / FAQ
   ============================================ */
document.querySelectorAll('.accordion-btn').forEach((btn) => {
  const panel = btn.nextElementSibling;
  btn.addEventListener('click', () => {
    const isOpen = btn.getAttribute('aria-expanded') === 'true';

    // Close other open items for a classic accordion feel
    document.querySelectorAll('.accordion-btn').forEach((otherBtn) => {
      if (otherBtn !== btn) {
        otherBtn.setAttribute('aria-expanded', 'false');
        otherBtn.nextElementSibling.style.maxHeight = null;
      }
    });

    btn.setAttribute('aria-expanded', String(!isOpen));
    panel.style.maxHeight = isOpen ? null : panel.scrollHeight + 'px';
  });
});

/* ============================================
   MODAL / DIALOG
   ============================================ */
const modalBackdrop = document.getElementById('modalBackdrop');
const modalTriggers = document.querySelectorAll('[data-modal]');

function openModal(id) {
  if (!modalBackdrop) return;
  document.querySelectorAll('.modal').forEach((m) => m.classList.remove('is-active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('is-active');
  modalBackdrop.classList.add('is-open');
}

function closeModal() {
  if (!modalBackdrop) return;
  modalBackdrop.classList.remove('is-open');
}

modalTriggers.forEach((trigger) => {
  trigger.addEventListener('click', () => openModal(trigger.dataset.modal));
});

document.querySelectorAll('.modal-close').forEach((btn) => {
  btn.addEventListener('click', closeModal);
});

if (modalBackdrop) {
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) closeModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

/* ============================================
   CONTACT FORM — sends via the Express server
   (server.js) which relays to the Brevo API.
   Run `npm start` and open http://localhost:3000
   ============================================ */
const contactForm = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('fname').value.trim();
    const email = document.getElementById('femail').value.trim();
    const message = document.getElementById('fmsg').value.trim();
    const submitBtn = contactForm.querySelector('.form-submit');

    if (!name || !email || !message) {
      if (formNote) {
        formNote.textContent = 'Please fill in all fields.';
        formNote.style.color = 'var(--orange)';
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }
    if (formNote) formNote.textContent = '';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Could not send the message.');
      }

      if (formNote) {
        formNote.textContent = 'Thanks — your message is on its way. I will reply soon!';
        formNote.style.color = 'var(--blue)';
      }
      contactForm.reset();
    } catch (err) {
      if (formNote) {
        formNote.textContent = 'Could not send: ' + err.message;
        formNote.style.color = 'var(--orange)';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Message <span class="arrow">→</span>';
      }
    }
  });
}

/* ============================================
   INFINITE SCROLL — appends more project cards as the
   user nears the bottom of the list. This demo cycles
   through placeholder project data; swap `moreProjects`
   for a real API call when you have more real projects.
   ============================================ */
const projectList = document.getElementById('projectList');
const infiniteLoader = document.getElementById('infiniteLoader');
const infiniteEnd = document.getElementById('infiniteEnd');

const moreProjects = [
  {
    title: 'Wayfare — Trip Planning App',
    desc: 'A collaborative trip planner with shared itineraries. Built with React, an Express API, and WebSocket sync for real-time edits.',
    tags: ['React', 'WebSockets', '2023'],
    img: 'https://images.unsplash.com/photo-1624996752380-8ec242e0f85d?auto=format&fit=crop&w=600&q=60'
  },
  {
    title: 'Ledgerly — SaaS Billing Dashboard',
    desc: 'Subscription and invoicing dashboard for a small SaaS company, integrated with Stripe Billing and built on Next.js.',
    tags: ['Next.js', 'Stripe', '2023'],
    img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=60'
  },
  {
    title: 'Pinboard — Team Notes App',
    desc: 'A lightweight internal notes and bookmarking tool for a 12-person team, with tagging, search, and Slack notifications.',
    tags: ['Vue', 'Node.js', '2022'],
    img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=60'
  }
];

let loadedBatches = 0;
const MAX_BATCHES = 2; // caps the demo so it doesn't scroll forever
let projectCounter = 3;
let isLoading = false;

function buildProjectCard(project) {
  projectCounter += 1;
  const index = String(projectCounter).padStart(2, '0');
  const article = document.createElement('article');
  article.className = 'project';
  article.style.opacity = '0';
  article.style.transform = 'translateY(16px)';
  article.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  article.innerHTML = `
    <span class="bracket bracket-tl"></span><span class="bracket bracket-br"></span>
    <div class="project-index mono-label">P.${index}</div>
    <div class="project-body">
      <h3>${project.title}</h3>
      <p>${project.desc}</p>
      <div class="tags">${project.tags.map((t) => `<span class="tag">${t}</span>`).join('')}</div>
      <span class="project-link mono-label" aria-disabled="true">VIEW →</span>
    </div>
    <div class="project-thumb">
      <img src="${project.img}" alt="${project.title}" loading="lazy">
    </div>
  `;
  return article;
}

function loadMoreProjects() {
  if (isLoading || !projectList) return;
  if (loadedBatches >= MAX_BATCHES) {
    if (infiniteLoader) infiniteLoader.classList.remove('is-active');
    if (infiniteEnd) infiniteEnd.classList.add('is-visible');
    return;
  }

  isLoading = true;
  if (infiniteLoader) infiniteLoader.classList.add('is-active');

  setTimeout(() => {
    moreProjects.forEach((project) => {
      const card = buildProjectCard(project);
      projectList.appendChild(card);
      requestAnimationFrame(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      });
    });

    loadedBatches += 1;
    isLoading = false;
    if (infiniteLoader) infiniteLoader.classList.remove('is-active');

    if (loadedBatches >= MAX_BATCHES && infiniteEnd) {
      infiniteEnd.classList.add('is-visible');
    }
  }, 700);
}

if (infiniteLoader && 'IntersectionObserver' in window) {
  const infiniteObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) loadMoreProjects();
    });
  }, { rootMargin: '200px' });

  infiniteObserver.observe(infiniteLoader);
}

/* ============================================
   SCROLL REVEAL
   ============================================ */
if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const revealTargets = document.querySelectorAll(
    '.project, .skill-block, .about-grid, .section-contact, .stat, .accordion-item'
  );

  revealTargets.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealTargets.forEach((el) => revealObserver.observe(el));
}

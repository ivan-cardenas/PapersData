
/* Build a nested TOC (h2 > h3) and add utilities */
(function() {
  const tocList = document.getElementById('toc-list');
  const headings = Array.from(document.querySelectorAll('main h2, main h3'));

  function slugify(text){
    return text.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-');
  }

  headings.forEach(h => {
    if (!h.id) h.id = slugify(h.textContent);
    // inject copy-link buttons into anchor-wraps
    const wrap = h.querySelector('.anchor-wrap');
    if (wrap && !wrap.querySelector('.copy-link')) {
      const btn = document.createElement('button');
      btn.className = 'copy-link'; btn.textContent = '#'; btn.setAttribute('aria-label','Copy link');
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = `${location.origin}${location.pathname}#${h.id}`;
        navigator.clipboard.writeText(url).then(()=>{
          btn.textContent = '✓'; setTimeout(()=> btn.textContent = '#', 900);
        });
      });
      wrap.appendChild(btn);
    }

    const li = document.createElement('li');
    const a  = document.createElement('a');
    a.href = `#${h.id}`; a.textContent = h.textContent.replace('#','').trim();
    a.className = h.tagName === 'H2' ? 'depth-1' : 'depth-2';
    li.appendChild(a); tocList.appendChild(li);
  });

  // Scrollspy active link via IntersectionObserver
  const tocLinks = Array.from(document.querySelectorAll('.toc a'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        tocLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
      }
    });
  }, { rootMargin: '0px 0px -70% 0px', threshold: 0.01 });

  headings.filter(h => ['H2','H3'].includes(h.tagName)).forEach(h => observer.observe(h));

  // Reading progress
  const progress = document.getElementById('progress');
  const setProgress = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = Math.max(0, Math.min(1, scrollTop / docH));
    progress.style.transform = `scaleX(${pct})`;
  };
  document.addEventListener('scroll', setProgress, { passive: true });
  setProgress();

  // Lazy-load PDFs when <details> open
  document.querySelectorAll('details.pdf').forEach(d => {
    const obj = d.querySelector('object.pdf-object');
    d.addEventListener('toggle', () => {
      if (d.open && obj && !obj.getAttribute('data-loaded')) {
        const src = obj.getAttribute('data-src');
        if (src) { obj.setAttribute('data-loaded','true'); obj.setAttribute('data', src); obj.style.display = 'block'; }
      }
    });
    // If open by default
    if (d.hasAttribute('open')) {
      const src = obj.getAttribute('data-src');
      if (src) { obj.setAttribute('data-loaded','true'); obj.setAttribute('data', src); obj.style.display = 'block'; }
    }
  });

  // Reveal on scroll
  const revealEls = document.querySelectorAll('.reveal');
  const revObs = new IntersectionObserver((entries, ob) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); ob.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  revealEls.forEach(el => revObs.observe(el));

  // Back to top button
  const toTop = document.getElementById('to-top');
  const setTopBtn = () => {
    if (window.scrollY > 800) toTop.classList.add('show');
    else toTop.classList.remove('show');
  };
  document.addEventListener('scroll', setTopBtn, { passive: true });
  toTop.querySelector('button').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Theme toggle
  const toggle = document.getElementById('theme-toggle');
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if (saved) root.setAttribute('data-theme', saved);
  toggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next); localStorage.setItem('theme', next);
  });
})();
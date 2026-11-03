const cases={airgap:{title:'Airgap Graph',label:'OFFLINE INTELLIGENCE / 2026—PRESENT',intro:'An offline-first platform for exploring entities and understanding technical drawings.',sections:[['Trace every connection','Entity extraction and co-occurrence relationships feed an interactive force-directed graph with neighborhood exploration and source-level character-offset provenance.'],['Read the drawing','Aspect-preserving scaling, overlapping tiles, adaptive zoom, and sub-patch localization support architectural and engineering diagrams.'],['Ground the answer','Visual proof crops, coordinate mapping, and confidence checks connect answers to source evidence. Local persistence supports encrypted storage and optional SQLCipher.']]},retrieval:{title:'Retrieval Funnel Toolkit',label:'CODEBASE INTELLIGENCE / 2026',intro:'Give a model the context that matters, with less of the repository noise.',sections:[['Six stages of context','A six-stage code analysis pipeline uses ast-grep and ripgrep to produce structured dependency graphs from Git repositories.'],['Rank the architecture','Pydantic schema validation keeps outputs structured. PageRank-based ranking prioritizes useful architectural context.'],['Reported benchmark','The résumé reports a reduction from 8.7 million to 2.1 million LLM input tokens — 75.86%. This is a project-specific benchmark, not a universal performance guarantee.']],url:'https://github.com/harsh-f9/retrieval_funnel_toolkit'},flood:{title:'FloodCast + Copilot',label:'CLIMATE RESILIENCE / 2025–2026',intro:'Forecasting and decision support for flood early warning in Uttar Pradesh.',sections:[['Coverage','Architected and deployed during an internship at the Climate Resilience Observatory, Government of Uttar Pradesh. The system covers 378 gauge stations across 69 districts with seven-day, multi-tier risk forecasts.'],['Forecasting pipeline','Automated ETL connects five climate and geospatial data sources to a hybrid LSTM and XGBoost workflow.'],['A copilot for decisions','Natural-language queries connect users to reservoir telemetry, historical anomalies, and forecast risk levels.']],url:'https://github.com/harsh-f9/floodcast'}};
cases.airgap.images=[['assets/airgap-entities.png','Entity explorer','Explore the entity network and trace connections to their sources.'],['assets/airgap-blueprint.png','Blueprint Vision','Architectural drawing retrieval with localized visual evidence.']];
cases.flood.images=[['assets/floodcast-map.jpg','District and station map','Select districts and gauge stations for a seven-day forecast.'],['assets/floodcast-streamflow.jpg','Streamflow dashboard','Station specifications, risk thresholds, and streamflow records.'],['assets/floodcast-copilot.jpg','FloodCast copilot','Ask questions across stations and inspect the supporting tool results.']];

const dialog = document.querySelector('#case-dialog');
const caseContent = document.querySelector('#case-content');
document.querySelectorAll('[data-project]').forEach(button => {
  button.addEventListener('click', () => {
    const project = cases[button.dataset.project];
    caseContent.innerHTML = `<span class="eyebrow">${project.label}</span><h2 id="case-title">${project.title}</h2><p>${project.intro}</p>${project.images ? `<div class="case-gallery">${project.images.map(([src, title, caption]) => `<figure><a href="${src}" target="_blank" rel="noreferrer" aria-label="Enlarge ${title}"><img src="${src}" alt="${title}" loading="lazy"></a><figcaption><strong>${title}</strong>${caption}</figcaption></figure>`).join('')}</div>` : ''}${project.sections.map(([title, text]) => `<h4>${title}</h4><p>${text}</p>`).join('')}${project.url ? `<a href="${project.url}" target="_blank" rel="noreferrer">View repository ↗</a>` : ''}`;
    dialog.showModal();
    dialog.scrollTop = 0;
  });
});
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
const filters = [...document.querySelectorAll('[data-filter]')];
const projects = [...document.querySelectorAll('[data-category]')];
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(filter => {
    filter.classList.toggle('selected', filter === button);
    filter.setAttribute('aria-pressed', String(filter === button));
  });
  projects.forEach(project => project.hidden = button.dataset.filter !== 'all' && project.dataset.category !== button.dataset.filter);
  const count = projects.filter(project => !project.hidden).length;
  document.querySelector('.filter-status').textContent = `${count} ${count === 1 ? 'project' : 'projects'} shown`;
}));
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Open navigation');
  navigation.classList.remove('open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  navigation.classList.toggle('open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) closeMenu();
});
const copyButton = document.querySelector('#copy-email');
const copyStatus = document.querySelector('#copy-status');
let copyTimeout;
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('harshf9@proton.me');
    copyStatus.textContent = 'Email copied!';
    clearTimeout(copyTimeout);
    copyTimeout = setTimeout(() => copyStatus.textContent = '', 2500);
  } catch {
    copyStatus.textContent = 'You can select and copy the email above.';
  }
});
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navigation.querySelectorAll('a').forEach(link => {
      const active = link.hash === `#${entry.target.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, {rootMargin: '-15% 0px -55% 0px'});
document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
document.querySelector('#year').textContent = new Date().getFullYear();

// Both views use the same content and interactions; only presentation changes.
const designButtons = [...document.querySelectorAll('button[data-design]')];
const pageRoot = document.documentElement;
function syncDesignButtons() {
  const selected = pageRoot.dataset.design === 'classic' ? 'classic' : 'modern';
  designButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.design === selected)));
  document.querySelector('meta[name="theme-color"]').content = selected === 'classic' ? '#ffffff' : '#a30e25';
}
syncDesignButtons();
designButtons.forEach(button => button.addEventListener('click', () => {
  const design = button.dataset.design;
  if ((pageRoot.dataset.design || 'modern') === design) return;
  // Keep the current section in view when its layout changes between designs.
  const sections = [...document.querySelectorAll('main section[id]')];
  const anchor = sections.filter(section => section.getBoundingClientRect().top <= 150).at(-1);
  const wasAtTop = window.scrollY < 60;
  closeMenu();
  pageRoot.dataset.design = design;
  syncDesignButtons();
  try { localStorage.setItem('harsh-design', design); } catch {}
  const scrollBehavior = pageRoot.style.scrollBehavior;
  pageRoot.style.scrollBehavior = 'auto';
  if (wasAtTop) window.scrollTo({top:0,behavior:'instant'});
  else if (anchor) {
    const headerOffset = design === 'classic' ? 80 : 76;
    window.scrollTo({top:window.scrollY + anchor.getBoundingClientRect().top - headerOffset,behavior:'instant'});
  }
  pageRoot.style.scrollBehavior = scrollBehavior;
  updateSwitchPosition();
}));
function updateSwitchPosition() {
  pageRoot.classList.toggle('switch-docked', window.scrollY > 48);
}
window.addEventListener('scroll', updateSwitchPosition, {passive:true});
window.addEventListener('pageshow', updateSwitchPosition);
updateSwitchPosition();

document.querySelectorAll('a[href="#home"]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  closeMenu();
  history.replaceState(null, '', '#home');
  window.scrollTo({top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
}));

// Keep the supplied SVG live, with a still companion for pause and reduced motion.
const rideScene = document.querySelector('#ride-scene');
const rideToggle = document.querySelector('#toggle-ride');
const rideMotion = matchMedia('(prefers-reduced-motion: reduce)');
function setRidePaused(paused) {
  rideScene.src = paused ? 'assets/pelican-bicycle-still.svg' : 'assets/pelican-bubu-dudu-bicycle.svg';
  rideToggle.setAttribute('aria-pressed', String(paused));
  rideToggle.textContent = paused ? 'Play animation' : 'Pause animation';
  rideToggle.setAttribute('aria-label', paused ? 'Play bicycle animation' : 'Pause bicycle animation');
}
setRidePaused(rideMotion.matches);
rideToggle.addEventListener('click', () => setRidePaused(rideToggle.getAttribute('aria-pressed') !== 'true'));
rideMotion.addEventListener('change', event => setRidePaused(event.matches));

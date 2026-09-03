/* ==========================================================================
   THE CULTURA FIESTA 1.0 - Master Script & Data Engine
   MPSC Cultural Club
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. Global Mobile Navigation Drawer Toggle (Instant Single Tap Trigger)
// --------------------------------------------------------------------------
window.toggleMobileMenu = function(e) {
  if (e && e.preventDefault) e.preventDefault();
  const navMenu = document.querySelector('.nav-menu');
  const mobileToggle = document.querySelector('.mobile-toggle');

  if (navMenu) {
    navMenu.classList.toggle('active');
    const icon = mobileToggle ? mobileToggle.querySelector('i') : null;
    if (icon) {
      if (navMenu.classList.contains('active')) {
        icon.className = 'fa-solid fa-xmark';
      } else {
        icon.className = 'fa-solid fa-bars';
      }
    }
  }
};

// --------------------------------------------------------------------------
// --------------------------------------------------------------------------
// 2. Data Store Helpers (LocalStorage Sync & Defaults - Default Empty)
// --------------------------------------------------------------------------
const DEFAULT_SCHEDULE = {
  day1: [],
  day2: [],
  day3: []
};

const DEFAULT_EC_MEMBERS = [];

function getStoredSchedule() {
  const data = localStorage.getItem('cultura_schedule_events');
  if (!data) {
    localStorage.setItem('cultura_schedule_events', JSON.stringify(DEFAULT_SCHEDULE));
    return DEFAULT_SCHEDULE;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_SCHEDULE;
  }
}

function saveStoredSchedule(scheduleObj) {
  localStorage.setItem('cultura_schedule_events', JSON.stringify(scheduleObj));
}

function getStoredEcMembers() {
  const data = localStorage.getItem('cultura_ec_members');
  if (!data) {
    localStorage.setItem('cultura_ec_members', JSON.stringify(DEFAULT_EC_MEMBERS));
    return DEFAULT_EC_MEMBERS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_EC_MEMBERS;
  }
}

function saveStoredEcMembers(ecArray) {
  localStorage.setItem('cultura_ec_members', JSON.stringify(ecArray));
}

// Wing Labels Map
const WING_LABELS = {
  'BVB': 'Bangla Version Boys (BVB)',
  'EVB': 'English Version Boys (EVB)',
  'BVG': 'Bangla Version Girls (BVG)',
  'EVG': 'English Version Girls (EVG)'
};

// --------------------------------------------------------------------------
// 3. DOM Initialization & Event Listeners
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  initNavbarScroll();
  initTimelineTabs();
  initScrollReveal();

  // Close Mobile Menu on link click
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      const navMenu = document.querySelector('.nav-menu');
      const mobileToggle = document.querySelector('.mobile-toggle');
      if (navMenu) navMenu.classList.remove('active');
      if (mobileToggle) {
        const icon = mobileToggle.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-bars';
      }
    });
  });

  // Async Load Data
  renderLandingSchedule();
  renderLandingEcGrid();
  renderEcPanelPage();
});

// Countdown Clock Logic
function initCountdown() {
  const targetDate = new Date('October 14, 2026 09:00:00').getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      if (document.getElementById('days')) document.getElementById('days').innerText = '00';
      if (document.getElementById('hours')) document.getElementById('hours').innerText = '00';
      if (document.getElementById('minutes')) document.getElementById('minutes').innerText = '00';
      if (document.getElementById('seconds')) document.getElementById('seconds').innerText = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const daysElem = document.getElementById('days');
    const hoursElem = document.getElementById('hours');
    const minutesElem = document.getElementById('minutes');
    const secondsElem = document.getElementById('seconds');

    if (daysElem) daysElem.innerText = days < 10 ? '0' + days : days;
    if (hoursElem) hoursElem.innerText = hours < 10 ? '0' + hours : hours;
    if (minutesElem) minutesElem.innerText = minutes < 10 ? '0' + minutes : minutes;
    if (secondsElem) secondsElem.innerText = seconds < 10 ? '0' + seconds : seconds;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// Sticky Navbar Scroll Listener
function initNavbarScroll() {
  const headerNav = document.querySelector('.header-nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      headerNav?.classList.add('scrolled');
    } else {
      headerNav?.classList.remove('scrolled');
    }
  });
}

// Timeline Day Tabs Listener
function initTimelineTabs() {
  const timelineTabs = document.querySelectorAll('.timeline-tab');
  const timelinePanels = document.querySelectorAll('.timeline-panel');

  timelineTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const day = tab.getAttribute('data-day');

      timelineTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      timelinePanels.forEach(panel => {
        if (panel.id === day) {
          panel.style.display = 'block';
        } else {
          panel.style.display = 'none';
        }
      });
    });
  });
}

// Scroll Reveal Animations
function initScrollReveal() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.glass-panel, .section-header, .stat-card, .ec-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
    observer.observe(el);
  });

  const style = document.createElement('style');
  style.innerHTML = `
    .revealed {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);
}

// Render dynamic schedule on index.html
async function renderLandingSchedule() {
  const schedule = (typeof fetchDbSchedule === 'function') ? await fetchDbSchedule() : getStoredSchedule();

  ['day1', 'day2', 'day3'].forEach(dayKey => {
    const container = document.querySelector(`[data-day-container="${dayKey}"]`);
    if (container) {
      container.innerHTML = '';
      const items = schedule[dayKey] || [];
      if (items.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); font-style: italic;">
            <i class="fa-regular fa-calendar-xmark" style="font-size: 1.8rem; color: var(--gold-primary); margin-bottom: 0.5rem; display: block;"></i>
            No events scheduled for this day yet. Check back soon!
          </div>
        `;
      } else {
        items.forEach(item => {
          const div = document.createElement('div');
          div.className = 'glass-panel timeline-card';
          div.innerHTML = `
            <div class="timeline-time">${item.time}</div>
            <div class="timeline-details">
              <h4>${item.title}</h4>
              <p>${item.desc || ''}</p>
              <div class="timeline-venue"><i class="fa-solid fa-location-dot"></i> ${item.venue}</div>
            </div>
          `;
          container.appendChild(div);
        });
      }
    }
  });
}

// Render dynamic EC roster preview on index.html — infinite seamless marquee
async function renderLandingEcGrid() {
  const ecMembers = (typeof fetchDbEcMembers === 'function') ? await fetchDbEcMembers() : getStoredEcMembers();
  const ecTrack = document.getElementById('landing-ec-grid');
  const ecOuter = document.getElementById('landing-ec-marquee-outer');

  if (!ecTrack) return;

  ecTrack.innerHTML = '';

  if (!ecMembers || ecMembers.length === 0) {
    if (ecOuter) ecOuter.style.overflow = 'visible';
    ecTrack.style.animation = 'none';
    ecTrack.innerHTML = `
      <div style="text-align:center;padding:3rem 1rem;color:var(--text-muted);font-style:italic;background:var(--bg-card);border:1px dashed var(--border-gold);border-radius:var(--radius-md);min-width:300px;flex:none;">
        <i class="fa-solid fa-users-slash" style="font-size:2.2rem;color:var(--gold-primary);margin-bottom:0.8rem;display:block;"></i>
        No Executive Committee members added yet.
      </div>
    `;
    return;
  }

  // Sort: rank first, then wing (BVB→EVB→BVG→EVG) within each rank
  const WING_ORDER = ['BVB', 'EVB', 'BVG', 'EVG'];
  const ROLE_RANK_LANDING = [
    'President','Vice President','General Secretary','Organizing Secretary',
    'Publication Secretary','Office Secretary','Head of Coordinator','Head of Volunteer','Treasurer'
  ];

  const sorted = [...ecMembers].sort((a, b) => {
    const rankDiff = (ROLE_RANK_LANDING.indexOf(a.role) === -1 ? 99 : ROLE_RANK_LANDING.indexOf(a.role))
                   - (ROLE_RANK_LANDING.indexOf(b.role) === -1 ? 99 : ROLE_RANK_LANDING.indexOf(b.role));
    if (rankDiff !== 0) return rankDiff;
    return (WING_ORDER.indexOf((a.wing||'BVB').toUpperCase()) === -1 ? 9 : WING_ORDER.indexOf((a.wing||'BVB').toUpperCase()))
         - (WING_ORDER.indexOf((b.wing||'BVB').toUpperCase()) === -1 ? 9 : WING_ORDER.indexOf((b.wing||'BVB').toUpperCase()));
  });

  function buildCard(member) {
    const wingLabel = (member.wing || 'BVB').toUpperCase();
    return `
      <div class="glass-panel ec-card">
        <div class="ec-avatar-wrapper">
          <img src="${member.image || 'logo.png'}" alt="${member.name}" class="ec-avatar-img" onerror="this.src='logo.png'">
        </div>
        <h3 class="ec-name">${member.name}</h3>
        <p class="ec-role">${member.role}</p>
        <span class="ec-wing-badge">${wingLabel}</span>
      </div>
    `;
  }

  // --- Calculate how many full repetitions we need ---
  // Each card is ~200px wide + ~19px gap = ~219px per card
  const cardWidthEstimate = 219;
  const oneSetPx = sorted.length * cardWidthEstimate;
  const viewportW = window.innerWidth || 1280;

  // We need: (copies - 1) * oneSetPx >= viewportW so there's never a gap visible
  // And copies must be even so translateX(-50%) snaps back to the same visual start
  let copies = Math.ceil(viewportW / oneSetPx) + 2; // +2 buffer
  if (copies % 2 !== 0) copies++; // force even

  const cardsHTML = sorted.map(buildCard).join('');
  ecTrack.innerHTML = cardsHTML.repeat(copies);

  // The animation moves by (1/copies * 100)% = width of ONE set
  // Update the keyframe dynamically via a style tag
  const pct = (100 / copies).toFixed(4);
  let styleTag = document.getElementById('ec-marquee-keyframe-style');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'ec-marquee-keyframe-style';
    document.head.appendChild(styleTag);
  }
  styleTag.textContent = `
    @keyframes ec-marquee-scroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-${pct}%); }
    }
  `;

  // Speed: ~60px/s feels smooth
  const duration = Math.round(oneSetPx / 60);
  ecTrack.style.animationDuration = `${duration}s`;
  ecTrack.style.animation = `ec-marquee-scroll ${duration}s linear infinite`;
}


// Render Full EC Panel Page with 4 Wing Teams (BVB, EVB, BVG, EVG) on ec-panel.html
async function renderEcPanelPage() {
  const container = document.getElementById('ec-panel-wings-container');
  if (!container) return;

  const ecMembers = (typeof fetchDbEcMembers === 'function') ? await fetchDbEcMembers() : getStoredEcMembers();

  if (!ecMembers || ecMembers.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 4rem 1rem; color: var(--text-muted); font-style: italic; background: var(--bg-card); border: 1px dashed var(--border-gold); border-radius: var(--radius-md); max-width: 600px; margin: 0 auto;">
        <i class="fa-solid fa-users-slash" style="font-size: 2.5rem; color: var(--gold-primary); margin-bottom: 1rem; display: block;"></i>
        <h3 style="color: #FFF; font-family: var(--font-heading); margin-bottom: 0.5rem;">Executive Committee Roster Empty</h3>
        <p>No wing panel members have been added yet. Admin can populate members via the Admin Center.</p>
      </div>
    `;
    return;
  }

  const wings = ['BVB', 'EVB', 'BVG', 'EVG'];
  let html = '';

  wings.forEach(wingKey => {
    const rawMembers = ecMembers.filter(m => (m.wing || 'BVB').toUpperCase() === wingKey);
    const wingMembers = (typeof sortEcMembersByRank === 'function') ? sortEcMembersByRank(rawMembers) : rawMembers;
    
    html += `
      <div class="ec-wing-box">
        <div class="ec-wing-title-bar">
          <h2 class="ec-wing-title-heading">
            ${WING_LABELS[wingKey]}
          </h2>
        </div>
    `;

    if (wingMembers.length === 0) {
      html += `
        <div style="padding: 1.5rem 0; color: var(--text-muted); font-size: 0.9rem; font-style: italic;">
          No executive panel members added for ${wingKey} yet.
        </div>
      `;
    } else {
      html += `<div class="ec-horizontal-scroll">`;
      wingMembers.forEach(member => {
        html += `
          <div class="glass-panel ec-card ec-horizontal-card">
            <div class="ec-avatar-wrapper">
              <img src="${member.image || 'logo.png'}" alt="${member.name}" class="ec-avatar-img" onerror="this.src='logo.png'">
            </div>
            <h3 class="ec-name">${member.name}</h3>
            <p class="ec-role">${member.role}</p>
            <span class="ec-wing-badge">${wingKey}</span>
          </div>
        `;
      });
      html += `</div>`;
    }

    html += `</div>`;
  });

  container.innerHTML = html;
}


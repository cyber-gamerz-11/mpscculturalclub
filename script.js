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
  renderEventsPage();
  initCaPortalButton();
});

// Campus Ambassador Portal Toggle Check for Homepage Hero Button
async function initCaPortalButton() {
  const heroCaBtn = document.getElementById('heroCaBtn');
  if (!heroCaBtn) return;
  try {
    const isEnabled = (typeof fetchCaPortalStatus === 'function') ? await fetchCaPortalStatus() : true;
    if (isEnabled) {
      heroCaBtn.style.display = 'inline-flex';
    } else {
      heroCaBtn.style.display = 'none';
    }
  } catch (err) {
    console.error('Error fetching CA Portal status:', err);
    heroCaBtn.style.display = 'none';
  }
}

// Countdown Clock Logic
function initCountdown() {
  const targetDate = new Date('October 1, 2026 09:00:00').getTime();

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

let currentLandingEcMembers = [];

// Helper to render EC Marquee Track
function renderLandingEcMarqueeUI(ecMembers) {
  const ecTrack = document.getElementById('landing-ec-grid');
  const ecOuter = document.getElementById('landing-ec-marquee-outer');
  if (!ecTrack) return;

  if (ecMembers && ecMembers.length > 0) {
    currentLandingEcMembers = ecMembers;
  }

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
    'Publication Secretary','Graphic Designer','Office Secretary','Head of Coordinator',
    'Head of Volunteer','External Affairs Secretary','Treasurer'
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

  const cardWidthEstimate = 219;
  const oneSetPx = sorted.length * cardWidthEstimate;
  const viewportW = window.innerWidth || 1280;

  let copies = Math.ceil(viewportW / oneSetPx) + 2;
  if (copies % 2 !== 0) copies++;

  const cardsHTML = sorted.map(buildCard).join('');
  ecTrack.innerHTML = cardsHTML.repeat(copies);

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

  const duration = Math.round(oneSetPx / 60);
  ecTrack.style.animationDuration = `${duration}s`;
  ecTrack.style.animation = `ec-marquee-scroll ${duration}s linear infinite`;
}

// Window resize listener to recalculate marquee duplicates on screen size change
let ecMarqueeResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(ecMarqueeResizeTimer);
  ecMarqueeResizeTimer = setTimeout(() => {
    if (currentLandingEcMembers && currentLandingEcMembers.length > 0) {
      renderLandingEcMarqueeUI(currentLandingEcMembers);
    }
  }, 200);
});

// Render dynamic EC roster preview on index.html — infinite seamless marquee
async function renderLandingEcGrid() {
  const landingModContainer = document.getElementById('landing-moderator-container');
  if (landingModContainer) {
    landingModContainer.innerHTML = buildModeratorRowHTML();
  }

  // 1. Synchronously render 0ms local storage state
  const localMembers = (typeof getStoredEcMembers === 'function') ? getStoredEcMembers() : [];
  renderLandingEcMarqueeUI(localMembers);

  // 2. Asynchronously fetch Supabase database state
  try {
    if (typeof fetchDbEcMembers === 'function') {
      const dbMembers = await fetchDbEcMembers();
      if (Array.isArray(dbMembers)) {
        renderLandingEcMarqueeUI(dbMembers);
      }
    }
  } catch (e) {
    console.warn('Async fetchDbEcMembers notice:', e);
  }
}


function buildModeratorRowHTML() {
  const mods = [
    { num: '1', title: 'Moderator', role: 'Club Moderator', isChief: true },
    { num: '2', title: 'Co-Moderator', role: 'Club Co-Moderator', isChief: false },
    { num: '3', title: 'Co-Moderator', role: 'Club Co-Moderator', isChief: false },
    { num: '4', title: 'Co-Moderator', role: 'Club Co-Moderator', isChief: false }
  ];

  const cardsHTML = mods.map(m => {
    const badgeBg = m.isChief 
      ? 'background: rgba(212,175,55,0.25); color: #FFD700; border-color: #FFD700;' 
      : 'background: rgba(52,152,219,0.2); color: #3498DB; border-color: rgba(52,152,219,0.4);';
    const avatarGlow = m.isChief ? 'box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); border-color: var(--gold-light);' : '';
    const borderStyle = m.isChief ? 'border: 1px solid var(--border-gold);' : 'border: 1px solid rgba(255,255,255,0.1);';

    return `
      <div class="glass-panel ec-card ec-horizontal-card" style="text-align: center; ${borderStyle}">
        <div class="ec-avatar-wrapper" style="${avatarGlow}">
          <img src="moderators/${m.num}.jpg" alt="${m.title}" class="ec-avatar-img" 
            onerror="if(!this.t1){this.t1=true;this.src='moderators/${m.num}.png';}else if(!this.t2){this.t2=true;this.src='images/moderators/${m.num}.jpg';}else if(!this.t3){this.t3=true;this.src='images/moderators/${m.num}.png';}else if(!this.t4){this.t4=true;this.src='${m.num}.jpg';}else if(!this.t5){this.t5=true;this.src='${m.num}.png';}else{this.src='logo.png';}">
        </div>
        <h3 class="ec-name" style="margin-top: 0.4rem; font-size: 1rem;">${m.title} ${m.num}</h3>
        <p class="ec-role">${m.role}</p>
        <span class="ec-wing-badge" style="${badgeBg}">${m.title.toUpperCase()}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="ec-horizontal-scroll moderator-scroll-box">
      ${cardsHTML}
    </div>
  `;
}

// Render Full EC Panel Page with 4 Wing Teams (BVB, EVB, BVG, EVG) on ec-panel.html
async function renderEcPanelPage() {
  const container = document.getElementById('ec-panel-wings-container');
  if (!container) return;

  let html = `
    <!-- Partition 1 Header: Meet Our Moderators -->
    <div class="section-header" style="margin-bottom: 2rem; text-align: center;">
      <span class="section-subtitle">Faculty & Guidance</span>
      <h2 class="section-title">Meet Our <span>Moderators</span></h2>
      <div class="title-line"></div>
    </div>

    ${buildModeratorRowHTML()}

    <!-- Partition Divider -->
    <div class="ec-partition-divider" style="margin: 3.5rem 0 3.5rem 0; display: flex; align-items: center; justify-content: center; gap: 1.5rem;">
      <div style="flex: 1; max-width: 250px; height: 1px; background: linear-gradient(90deg, transparent, rgba(212,175,55,0.4));"></div>
      <span style="color: var(--gold-light); font-size: 1rem;"><i class="fa-solid fa-star"></i></span>
      <div style="flex: 1; max-width: 250px; height: 1px; background: linear-gradient(90deg, rgba(212,175,55,0.4), transparent);"></div>
    </div>

    <!-- Partition 2 Header: Executive Panel 2026-27 -->
    <div class="section-header" style="margin-bottom: 2.5rem; text-align: center;">
      <span class="section-subtitle">Leadership & Management</span>
      <h2 class="section-title">Executive Panel <span>2026–27</span></h2>
      <div class="title-line"></div>
    </div>
  `;

  const ecMembers = (typeof fetchDbEcMembers === 'function') ? await fetchDbEcMembers() : getStoredEcMembers();

  if (!ecMembers || ecMembers.length === 0) {
    container.innerHTML = html;
    return;
  }

  const wings = ['BVB', 'EVB', 'BVG', 'EVG'];

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

// --------------------------------------------------------------------------
// 4. Events Page & Interactive 3-Tier Tree Modal Renderer
// --------------------------------------------------------------------------
let globalSegmentsCache = [];

function formatIconClass(iconStr) {
  if (!iconStr || typeof iconStr !== 'string') return 'fa-solid fa-star';
  let clean = iconStr.trim();
  if (clean.startsWith('fa-solid ') || clean.startsWith('fa-regular ') || clean.startsWith('fa-brands ')) {
    return clean;
  }
  if (!clean.startsWith('fa-')) {
    clean = 'fa-' + clean;
  }
  return 'fa-solid ' + clean;
}

async function renderEventsPage() {
  const container = document.getElementById('segments-grid');
  if (!container) return;

  const segments = (typeof fetchDbSegments === 'function') ? await fetchDbSegments() : getStoredSegments();
  globalSegmentsCache = segments;

  if (!segments || segments.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 4rem 1rem; color: var(--text-muted); grid-column: 1 / -1;">
        <i class="fa-solid fa-layer-group" style="font-size: 2.5rem; color: var(--gold-primary); margin-bottom: 1rem; display: block;"></i>
        <h3>No Segments Available</h3>
        <p>Segments will appear here once configured in the Admin Center.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = segments.map((seg, idx) => {
    const evtCount = (seg.events || []).length;
    const iconClass = formatIconClass(seg.icon);
    const tagText = seg.tag || 'Cultura Festival';
    const descText = seg.description || 'Competition segment details, age categories, and guidelines.';
    const dayText = seg.day_info || 'Festival Schedule';

    return `
      <div class="glass-panel segment-card" onclick="openSegmentModal('${seg.id || idx}')" style="cursor: pointer;">
        <div class="segment-icon-box"><i class="${iconClass}"></i></div>
        <span class="segment-tag">${tagText}</span>
        <h3 class="segment-title">${seg.title || 'Competition Segment'}</h3>
        <p class="segment-desc">${descText}</p>
        <div class="segment-footer">
          <span class="segment-meta"><i class="fa-solid fa-calendar-day"></i> ${dayText} &bull; ${evtCount} Event(s)</span>
          <span class="text-gold" style="font-weight: 700;">View Details <i class="fa-solid fa-chevron-right"></i></span>
        </div>
      </div>
    `;
  }).join('');
}

window.openSegmentModal = function(segmentId) {
  const modal = document.getElementById('segmentDetailModal');
  const content = document.getElementById('modalSegmentContent');
  if (!modal || !content) return;

  const seg = globalSegmentsCache.find((s, idx) => String(s.id) === String(segmentId) || String(idx) === String(segmentId));
  if (!seg) return;

  const tagText = seg.tag || 'Cultura Festival';
  const descText = seg.description || 'Competition segment details, age categories, and guidelines.';

  let eventsHTML = '';
  if (!seg.events || seg.events.length === 0) {
    eventsHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); font-style: italic; background: rgba(11, 19, 43, 0.4); border-radius: var(--radius-md); border: 1px dashed var(--border-gold);">
        No competition events added under this segment yet.
      </div>
    `;
  } else {
    eventsHTML = seg.events.map((evt, eIdx) => {
      const boxId = `cat-box-${evt.id || eIdx}`;
      const hasGroups = evt.groups && evt.groups.length > 0;

      let groupsCollapsibleHTML = '';
      if (hasGroups) {
        groupsCollapsibleHTML = `
          <div id="${boxId}" class="event-categories-box" style="display: none;">
            ${evt.groups.map(grp => {
              const isGrpTeam = grp.is_team || evt.is_team;
              const grpMaxMembers = grp.is_team ? grp.max_team_members : (evt.is_team ? evt.max_team_members : 1);
              const priceTag = grp.price ? ` · ৳${grp.price}` : '';
              const safeSegTitle = (seg.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
              const safeEvtTitle = (evt.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
              const safeGrpName = (grp.group_name || grp.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
              return `
              <div class="category-block-item">
                <div class="category-block-info">
                  <div class="category-block-name">
                    ${grp.group_name || grp.name || 'Category'}
                    ${isGrpTeam ? `<span class="ec-wing-badge" style="background: rgba(52, 152, 219, 0.2); color: #3498DB; border-color: rgba(52, 152, 219, 0.4); margin-left: 0.4rem; font-size: 0.72rem;"><i class="fa-solid fa-users"></i> Team (Max ${grpMaxMembers})</span>` : ''}
                  </div>
                  ${(grp.age_limit || grp.age_group) ? `<span class="category-block-eligibility">${grp.age_limit || grp.age_group}</span>` : ''}
                  ${grp.rules ? `<div class="category-block-rules">${grp.rules}</div>` : ''}
                </div>
                <div>
                  <button type="button" class="btn-gold-sm" onclick="openRegistrationModal('${safeSegTitle}', '${safeEvtTitle}', '${safeGrpName}', '${grp.price || ''}', ${isGrpTeam}, ${grpMaxMembers})"><i class="fa-solid fa-ticket"></i> Register${priceTag}</button>
                </div>
              </div>
            `;
            }).join('')}
          </div>
        `;
      }

      const isEvtTeam = !!evt.is_team;
      const evtMaxMembers = evt.max_team_members || 1;
      const evtPriceTag = evt.price ? ` · ৳${evt.price}` : '';
      const safeSegTitle = (seg.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const safeEvtTitle = (evt.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');

      return `
        <div class="event-block-card">
          <div class="event-block-header">
            <div class="event-block-title">
              ${evt.title || 'Event'}
              ${isEvtTeam ? `<span class="ec-wing-badge" style="background: rgba(52, 152, 219, 0.2); color: #3498DB; border-color: rgba(52, 152, 219, 0.4); margin-left: 0.5rem; font-size: 0.75rem;"><i class="fa-solid fa-users"></i> Team Event (Max ${evtMaxMembers})</span>` : ''}
            </div>
          </div>
          ${evt.venue ? `<div class="event-block-venue"><i class="fa-solid fa-location-dot"></i> ${evt.venue}</div>` : ''}
          ${evt.description ? `<p class="event-block-desc">${evt.description}</p>` : ''}

          <div class="event-block-footer">
            ${hasGroups ? `
              <button type="button" class="btn-outline-gold-sm" onclick="toggleEventCategories('${boxId}')">
                <i class="fa-solid fa-layer-group"></i> View Categories (${evt.groups.length}) <i class="fa-solid fa-chevron-down"></i>
              </button>
            ` : `
              <button type="button" class="btn-gold-sm" onclick="openRegistrationModal('${safeSegTitle}', '${safeEvtTitle}', '', '${evt.price || ''}', ${isEvtTeam}, ${evtMaxMembers})"><i class="fa-solid fa-ticket"></i> Register${evtPriceTag}</button>
            `}
          </div>

          ${groupsCollapsibleHTML}
        </div>
      `;
    }).join('');
  }

  content.innerHTML = `
    <div style="text-align: center; margin-bottom: 1.8rem; padding-bottom: 1.2rem; border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
      <span class="ec-wing-badge" style="margin-bottom: 0.6rem;">${tagText}</span>
      <h2 style="font-family: var(--font-heading); color: #FFF; font-size: clamp(1.4rem, 4vw, 2rem); margin-bottom: 0.5rem;">${seg.title || 'Competition Segment'}</h2>
      <p style="color: var(--text-muted); font-size: 0.92rem; max-width: 650px; margin: 0 auto; line-height: 1.6;">${descText}</p>
    </div>

    <!-- Block-by-Block Events Stack -->
    <div class="events-block-stack">
      ${eventsHTML}
    </div>
  `;

  modal.classList.add('open');
};

window.toggleEventCategories = function(boxId) {
  const box = document.getElementById(boxId);
  if (box) {
    if (box.style.display === 'none' || !box.style.display) {
      box.style.display = 'flex';
    } else {
      box.style.display = 'none';
    }
  }
};

window.closeSegmentModal = function() {
  const modal = document.getElementById('segmentDetailModal');
  if (modal) modal.classList.remove('open');
};

/* ==========================================================================
   PARTICIPANT REGISTRATION & BKASH MODAL CONTROLLER
   ========================================================================== */
let activeRegistration = null;

window.openRegistrationModal = function(segmentTitle, eventTitle, categoryName, priceAmount, isTeam = false, maxTeamMembers = 1) {
  closeSegmentModal(); // Close segment detail view

  activeRegistration = {
    segment_title: segmentTitle || 'Cultural Segment',
    event_title: eventTitle || 'Fiesta Event',
    category_name: categoryName || '',
    amount: priceAmount || '0',
    is_team: !!isTeam,
    max_team_members: parseInt(maxTeamMembers) || 1
  };

  const regModal = document.getElementById('registrationModal');
  if (!regModal) return;

  // Set Modal Header Badges & Amounts
  let badgeText = categoryName ? `${segmentTitle} · ${eventTitle} (${categoryName})` : `${segmentTitle} · ${eventTitle}`;
  if (isTeam) {
    badgeText += ` · 👥 Team Event (Max ${maxTeamMembers} Members)`;
  }
  const displayPrice = priceAmount && priceAmount !== '0' ? `Registration Fee: ৳${priceAmount}` : 'Registration Fee: FREE';
  const displayPayable = priceAmount && priceAmount !== '0' ? `Total Payable: ৳${priceAmount}` : 'Total Payable: FREE';

  if (document.getElementById('regEventBadge')) document.getElementById('regEventBadge').innerText = badgeText;
  if (document.getElementById('regPriceDisplay')) document.getElementById('regPriceDisplay').innerText = displayPrice;
  if (document.getElementById('regPaymentAmountDisplay')) document.getElementById('regPaymentAmountDisplay').innerText = displayPayable;

  // Setup Team Section & Inputs
  const regTeamSection = document.getElementById('regTeamSection');
  const regTeamNameInput = document.getElementById('regTeamNameInput');
  const membersContainer = document.getElementById('regTeamMembersContainer');

  if (regTeamSection) {
    if (isTeam) {
      regTeamSection.style.display = 'block';
      if (regTeamNameInput) regTeamNameInput.required = true;
      if (membersContainer) {
        membersContainer.innerHTML = '';
        const extraMembers = Math.max(1, parseInt(maxTeamMembers) - 1);
        for (let i = 2; i <= extraMembers + 1; i++) {
          const div = document.createElement('div');
          div.className = 'form-group-full';
          div.innerHTML = `
            <label class="form-label" style="font-size: 0.8rem; color: #FFF;"><i class="fa-solid fa-user-plus"></i> MEMBER ${i} FULL NAME ${i === 2 ? '*' : '(Optional)'}</label>
            <input type="text" class="form-input reg-team-member-input" placeholder="e.g. Member ${i} Name" ${i === 2 ? 'required' : ''}>
          `;
          membersContainer.appendChild(div);
        }
      }
    } else {
      regTeamSection.style.display = 'none';
      if (regTeamNameInput) {
        regTeamNameInput.required = false;
        regTeamNameInput.value = '';
      }
      if (membersContainer) membersContainer.innerHTML = '';
    }
  }

  // bKash Number Setup
  const bkashNum = (window.CULTURA_CONFIG && window.CULTURA_CONFIG.bkashNumber) ? window.CULTURA_CONFIG.bkashNumber : '01700000000';
  if (document.getElementById('bkashNumberText')) document.getElementById('bkashNumberText').innerText = bkashNum;

  // Reset forms and show step 1
  document.getElementById('regFormStep1')?.reset();
  document.getElementById('regFormStep2')?.reset();
  if (regTeamSection && isTeam) regTeamSection.style.display = 'block';
  showRegStep(1);

  regModal.classList.add('open');
};

window.closeRegistrationModal = function() {
  const regModal = document.getElementById('registrationModal');
  if (regModal) regModal.classList.remove('open');
};

window.showRegStep = function(stepNum) {
  const step1 = document.getElementById('regStep1');
  const step2 = document.getElementById('regStep2');
  const step3 = document.getElementById('regStep3');

  if (step1) step1.style.display = (stepNum === 1) ? 'block' : 'none';
  if (step2) step2.style.display = (stepNum === 2) ? 'block' : 'none';
  if (step3) step3.style.display = (stepNum === 3) ? 'block' : 'none';
};

window.copyBkashNumber = function() {
  const numText = document.getElementById('bkashNumberText')?.innerText || '01700000000';
  navigator.clipboard.writeText(numText).then(() => {
    alert('bKash Number copied to clipboard: ' + numText);
  }).catch(() => {
    alert('bKash Number: ' + numText);
  });
};

window.handleRegStep1Submit = function(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!activeRegistration) return;

  activeRegistration.name = document.getElementById('regNameInput').value.trim();
  activeRegistration.class_name = document.getElementById('regClassInput').value.trim();
  activeRegistration.institute = document.getElementById('regInstituteInput').value.trim();
  activeRegistration.phone = document.getElementById('regPhoneInput').value.trim();
  activeRegistration.email = document.getElementById('regEmailInput').value.trim();

  if (activeRegistration.is_team) {
    activeRegistration.team_name = document.getElementById('regTeamNameInput')?.value.trim() || '';
    const memberInputs = document.querySelectorAll('.reg-team-member-input');
    const membersList = Array.from(memberInputs)
      .map((inp, idx) => inp.value.trim() ? `Member ${idx + 2}: ${inp.value.trim()}` : '')
      .filter(Boolean)
      .join('; ');
    activeRegistration.team_members = membersList;
  } else {
    activeRegistration.team_name = '';
    activeRegistration.team_members = '';
  }

  // If price is free / 0
  if (!activeRegistration.amount || activeRegistration.amount === '0') {
    document.getElementById('regSenderBkashInput').value = 'N/A (Free Event)';
    document.getElementById('regTrxIdInput').value = 'FREE-REG';
  } else {
    document.getElementById('regSenderBkashInput').value = activeRegistration.phone;
  }

  showRegStep(2);
};

window.handleRegStep2Submit = async function(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!activeRegistration) return;

  const btnSubmit = document.getElementById('btnSubmitRegistration');
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;
  }

  activeRegistration.sender_bkash = document.getElementById('regSenderBkashInput').value.trim();
  activeRegistration.trx_id = document.getElementById('regTrxIdInput').value.trim();

  try {
    const savedReg = (typeof addDbRegistration === 'function') ? await addDbRegistration(activeRegistration) : activeRegistration;
    
    // Populate Success Screen Details
    if (document.getElementById('successParticipantName')) document.getElementById('successParticipantName').innerText = activeRegistration.name;
    if (document.getElementById('successEventTitle')) document.getElementById('successEventTitle').innerText = activeRegistration.event_title + (activeRegistration.category_name ? ` (${activeRegistration.category_name})` : '');
    if (document.getElementById('successTrxId')) document.getElementById('successTrxId').innerText = activeRegistration.trx_id;
    if (document.getElementById('successPhone')) document.getElementById('successPhone').innerText = activeRegistration.phone;

    showRegStep(3);
  } catch (err) {
    console.error('Registration submit error:', err);
    alert('Could not submit registration. Please try again.');
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<i class="fa-solid fa-circle-check"></i> Complete Registration`;
    }
  }
};

// Backdrop click listener to close modal
document.addEventListener('click', (e) => {
  const modal = document.getElementById('segmentDetailModal');
  if (modal && e.target === modal) {
    closeSegmentModal();
  }
});


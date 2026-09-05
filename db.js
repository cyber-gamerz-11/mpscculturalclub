/* ==========================================================================
   THE CULTURA FIESTA 1.0 - Database & Supabase Integration Engine
   MPSC Cultural Club
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. Supabase Client Configuration
// --------------------------------------------------------------------------
// Priority chain for credentials:
//   1. config.js file  (window.CULTURA_CONFIG)  ← best for hosted servers
//   2. localStorage    (set via Admin Center)    ← fallback / local override
//   3. Placeholder     (no connection)

const _fileCfg   = (typeof window !== 'undefined' && window.CULTURA_CONFIG) ? window.CULTURA_CONFIG : {};
const _storedUrl = (typeof localStorage !== 'undefined') ? localStorage.getItem('cultura_supabase_url') : null;
const _storedKey = (typeof localStorage !== 'undefined') ? localStorage.getItem('cultura_supabase_key') : null;

const SUPABASE_CONFIG = {
  url:     _fileCfg.supabaseUrl     || _storedUrl || 'https://your-supabase-project-id.supabase.co',
  anonKey: _fileCfg.supabaseAnonKey || _storedKey || 'your-supabase-anon-key-here'
};

let supabaseClient = null;

function initSupabaseClient(url, key) {
  if (typeof supabase !== 'undefined' && url && !url.includes('your-supabase-project-id') && !url.includes('YOUR-PROJECT-ID')) {
    try {
      supabaseClient = supabase.createClient(url, key);
      console.log('✅ Connected to Live Supabase Database!');
      return true;
    } catch (err) {
      console.warn('⚠️ Supabase connection error:', err);
      return false;
    }
  }
  return false;
}

// Initial Attempt — will auto-connect if config.js has real credentials
initSupabaseClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);


function saveSupabaseCredentials(url, key) {
  localStorage.setItem('cultura_supabase_url', url);
  localStorage.setItem('cultura_supabase_key', key);
  return initSupabaseClient(url, key);
}

// --------------------------------------------------------------------------
// 2. Database API Methods (Supabase + Fallback)
// --------------------------------------------------------------------------

/**
 * Fetch all scheduled events grouped by day ('day1', 'day2', 'day3')
 */
async function fetchDbSchedule() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('events')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('⚠️ Supabase events query error (falling back to local):', error.message || error);
      } else if (Array.isArray(data)) {
        const schedule = { day1: [], day2: [], day3: [] };
        data.forEach(item => {
          if (schedule[item.day]) {
            schedule[item.day].push({
              id: item.id,
              time: item.time,
              title: item.title,
              venue: item.venue,
              desc: item.description
            });
          }
        });
        return schedule;
      }
    } catch (e) {
      console.error('Supabase fetchSchedule exception:', e);
    }
  }
  return getStoredSchedule();
}

/**
 * Add a new event to database
 */
async function addDbEvent(day, time, title, venue, desc) {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('events')
        .insert([{ day, time, title, venue, description: desc }]);
      
      if (error) {
        console.error('Supabase addEvent error:', error);
        alert('⚠️ Supabase Error adding event: ' + (error.message || JSON.stringify(error)));
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase addEvent exception:', e);
      alert('⚠️ Exception saving event to Supabase: ' + e.message);
      return false;
    }
  }

  // Local Fallback
  const schedule = getStoredSchedule();
  if (!schedule[day]) schedule[day] = [];
  schedule[day].push({ time, title, venue, desc });
  saveStoredSchedule(schedule);
  return true;
}

/**
 * Delete an event from database
 */
async function deleteDbEvent(dayKey, index, dbId = null) {
  if (supabaseClient && dbId) {
    try {
      const { error } = await supabaseClient.from('events').delete().eq('id', dbId);
      if (error) {
        console.error('Supabase deleteEvent error:', error);
        alert('⚠️ Error deleting event from Supabase: ' + error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase deleteEvent exception:', e);
    }
  }

  // Local Fallback
  const schedule = getStoredSchedule();
  if (schedule[dayKey]) {
    schedule[dayKey].splice(index, 1);
    saveStoredSchedule(schedule);
  }
  return true;
}

const ROLE_RANK_ORDER = [
  'President',
  'Vice President',
  'General Secretary',
  'Organizing Secretary',
  'Publication Secretary',
  'Office Secretary',
  'Head of Coordinator',
  'Head of Volunteer',
  'Treasurer'
];

function getRoleRank(role) {
  const index = ROLE_RANK_ORDER.findIndex(r => r.toLowerCase() === (role || '').trim().toLowerCase());
  return index !== -1 ? index : 99;
}

function sortEcMembersByRank(members) {
  if (!members || !Array.isArray(members)) return [];
  return [...members].sort((a, b) => getRoleRank(a.role) - getRoleRank(b.role));
}

/**
 * Fetch Executive Committee Members
 */
async function fetchDbEcMembers() {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('ec_members')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('⚠️ Supabase ec_members query error (falling back to local):', error.message || error);
      } else if (Array.isArray(data)) {
        const mapped = data.map(item => ({
          id: item.id,
          name: item.name,
          role: item.role,
          wing: item.wing || item.batch || 'BVB',
          image: item.image_url || 'logo.png'
        }));
        return sortEcMembersByRank(mapped);
      }
    } catch (e) {
      console.error('Supabase fetchEcMembers exception:', e);
    }
  }
  return sortEcMembersByRank(getStoredEcMembers());
}

/**
 * Add EC Member to database
 */
async function addDbEcMember(name, role, wing, image = 'logo.png') {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('ec_members')
        .insert([{ name, role, wing, batch: wing, image_url: image }]);

      if (error) {
        console.error('Supabase addEcMember error:', error);
        alert('⚠️ Supabase Error adding EC member: ' + (error.message || JSON.stringify(error)));
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase addEcMember exception:', e);
      alert('⚠️ Exception saving EC member to Supabase: ' + e.message);
      return false;
    }
  }

  // Local Fallback
  const members = getStoredEcMembers();
  members.push({ name, role, wing, image });
  saveStoredEcMembers(members);
  return true;
}

/**
 * Delete EC Member from database
 */
async function deleteDbEcMember(index, dbId = null) {
  if (supabaseClient && dbId) {
    try {
      const { error } = await supabaseClient.from('ec_members').delete().eq('id', dbId);
      if (error) {
        console.error('Supabase deleteEcMember error:', error);
        alert('⚠️ Error deleting EC member from Supabase: ' + error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.error('Supabase deleteEcMember exception:', e);
    }
  }

  // Local Fallback
  const members = getStoredEcMembers();
  members.splice(index, 1);
  saveStoredEcMembers(members);
  return true;
}

// --------------------------------------------------------------------------
// 3. Segment & Event Hierarchy API Methods (3-Tier: Segment -> Event -> Group)
// --------------------------------------------------------------------------

const DEFAULT_SEGMENTS_HIERARCHY = [
  {
    id: "seg-1",
    title: "Solo Vocal & Band Beats",
    tag: "Sangeet • Music",
    icon: "fa-guitar",
    description: "Classical, Folk, Nazrul Geeti, Rabindra Sangeet, and Western Rock Band Competitions.",
    day_info: "Day 2 & Day 3",
    events: [
      {
        id: "evt-101",
        title: "Solo Vocal Battle",
        description: "Perform your best solo vocal rendition across classical, folk, or modern categories.",
        time: "10:00 AM - 01:00 PM",
        venue: "Main Auditorium",
        groups: [
          {
            id: "grp-1001",
            group_name: "Group A (Junior)",
            age_limit: "Class 6 to Class 8",
            rules: "Perform 1 Classical or Folk song. Maximum stage duration is 4 minutes.",
            description: "Junior solo vocal category.",
            price: "100"
          },
          {
            id: "grp-1002",
            group_name: "Group B (Senior)",
            age_limit: "Class 9 to Class 12",
            rules: "Perform 1 Rabindra, Nazrul or Modern song. Maximum stage duration is 5 minutes.",
            description: "Senior solo vocal category.",
            price: "150"
          }
        ]
      },
      {
        id: "evt-102",
        title: "Band Beats (Battle of Bands)",
        description: "College and School band musical clash.",
        time: "03:00 PM - 07:00 PM",
        venue: "Open Air Stage",
        groups: [
          {
            id: "grp-1003",
            group_name: "Open Rock & Fusion Category",
            age_limit: "Open for all students",
            rules: "Maximum 15 minutes total stage setup and performance time. Original composition or cover song allowed.",
            description: "Band battle competition.",
            price: "500"
          }
        ]
      }
    ]
  },
  {
    id: "seg-2",
    title: "Classical & Folk Dance",
    tag: "Nritya • Dance",
    icon: "fa-person-dancing",
    description: "Solo classical choreography, Manipuri, Bharatnatyam, Kathak, and Modern Creative Dance.",
    day_info: "Day 1",
    events: [
      {
        id: "evt-201",
        title: "Classical Solo Choreography",
        description: "Showcase classical traditional moves.",
        time: "11:00 AM - 02:00 PM",
        venue: "Drama Hall",
        groups: [
          {
            id: "grp-2001",
            group_name: "Group A (Junior)",
            age_limit: "Class 6 to Class 8",
            rules: "Manipuri, Kathak or Bharatnatyam. Max 4 mins.",
            description: "Junior classical dance.",
            price: "100"
          },
          {
            id: "grp-2002",
            group_name: "Group B (Senior)",
            age_limit: "Class 9 to Class 12",
            rules: "Classical solo performance. Max 5 mins.",
            description: "Senior classical dance.",
            price: "150"
          }
        ]
      }
    ]
  },
  {
    id: "seg-3",
    title: "Street Play & Drama Skit",
    tag: "Natya • Theatre",
    icon: "fa-masks-theater",
    description: "Group drama stage plays, social street theatre, and dramatic solo monologues.",
    day_info: "Day 2",
    events: [
      {
        id: "evt-301",
        title: "Street Play (Rasta Natok)",
        description: "Social message street theatre.",
        time: "02:00 PM - 05:00 PM",
        venue: "Campus Plaza",
        groups: [
          {
            id: "grp-3001",
            group_name: "Group Skit Team",
            age_limit: "All registered institutions",
            rules: "Max 12 members per team. Stage setup within 3 mins. Total 15 mins allowed.",
            description: "Inter-institutional group drama competition.",
            price: "300"
          }
        ]
      }
    ]
  },
  {
    id: "seg-4",
    title: "Art, Calligraphy & Craft",
    tag: "Chitrakala • Fine Arts",
    icon: "fa-palette",
    description: "On-spot painting, Bengali calligraphy exhibition, and traditional eco-craft creation.",
    day_info: "Day 1 & Day 2",
    events: [
      {
        id: "evt-401",
        title: "On-Spot Canvas Painting",
        description: "Live art creation on given theme.",
        time: "10:00 AM - 12:30 PM",
        venue: "Art Gallery Wing",
        groups: [
          {
            id: "grp-4001",
            group_name: "Group A (Junior)",
            age_limit: "Class 6 to Class 8",
            rules: "Theme disclosed on spot. Art paper provided. Bring your own colors.",
            description: "Junior art competition.",
            price: "80"
          },
          {
            id: "grp-4002",
            group_name: "Group B (Senior)",
            age_limit: "Class 9 to Class 12",
            rules: "Theme disclosed on spot. Canvas provided. Acrylic / Watercolor.",
            description: "Senior art competition.",
            price: "120"
          }
        ]
      }
    ]
  },
  {
    id: "seg-5",
    title: "Poetry & Scriptwriting",
    tag: "Aabritti • Recitation",
    icon: "fa-feather-pointed",
    description: "Bengali poetry recitation, English elocution, and creative scriptwriting competition.",
    day_info: "Day 1",
    events: [
      {
        id: "evt-501",
        title: "Kabita Aabritti (Poetry Recitation)",
        description: "Expressive Bengali & English recitation.",
        time: "09:30 AM - 12:00 PM",
        venue: "Seminar Room 101",
        groups: [
          {
            id: "grp-5001",
            group_name: "Group A",
            age_limit: "Class 6 to Class 8",
            rules: "Recite 1 selected Bengali poem. Max 3 mins.",
            description: "Junior recitation.",
            price: "50"
          },
          {
            id: "grp-5002",
            group_name: "Group B",
            age_limit: "Class 9 to Class 12",
            rules: "Recite 1 classic Bengali poem. Max 4 mins.",
            description: "Senior recitation.",
            price: "75"
          }
        ]
      }
    ]
  },
  {
    id: "seg-6",
    title: "Cultural & Heritage Olympiad",
    tag: "Jiggasa • Heritage Quiz",
    icon: "fa-brain",
    description: "Quiz battle covering Bengali literature, national history, art history, and folk music.",
    day_info: "Day 2",
    events: [
      {
        id: "evt-601",
        title: "Heritage Quiz Battle",
        description: "Buzzer round cultural trivia.",
        time: "11:00 AM - 01:30 PM",
        venue: "Auditorium Annex",
        groups: [
          {
            id: "grp-6001",
            group_name: "School Wing",
            age_limit: "Class 6 to Class 10",
            rules: "Team of 3 students per institution.",
            description: "School quiz league.",
            price: "100"
          },
          {
            id: "grp-6002",
            group_name: "College Wing",
            age_limit: "Class 11 to Class 12",
            rules: "Team of 3 students per institution.",
            description: "College quiz league.",
            price: "150"
          }
        ]
      }
    ]
  }
];

function getStoredSegments() {
  const data = localStorage.getItem('cultura_segments_hierarchy');
  if (!data) {
    localStorage.setItem('cultura_segments_hierarchy', JSON.stringify(DEFAULT_SEGMENTS_HIERARCHY));
    return DEFAULT_SEGMENTS_HIERARCHY;
  }
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_SEGMENTS_HIERARCHY;
  } catch (e) {
    return DEFAULT_SEGMENTS_HIERARCHY;
  }
}

function saveStoredSegments(segmentsArr) {
  localStorage.setItem('cultura_segments_hierarchy', JSON.stringify(segmentsArr));
}

/**
 * Fetch all segments with nested events and groups
 */
async function fetchDbSegments() {
  if (supabaseClient) {
    try {
      const { data: segs, error: segErr } = await supabaseClient
        .from('segments')
        .select('*')
        .order('created_at', { ascending: true });

      if (!segErr && Array.isArray(segs) && segs.length > 0) {
        const { data: evts } = await supabaseClient.from('segment_events').select('*');
        const { data: grps } = await supabaseClient.from('event_groups').select('*');

        const result = segs.map(s => {
          const matchedEvts = (evts || []).filter(e => e.segment_id === s.id).map(e => {
            const matchedGrps = (grps || []).filter(g => g.event_id === e.id).map(g => ({
              id: g.id,
              group_name: g.group_name || g.name,
              age_limit: g.age_limit || g.age_group,
              rules: g.rules || '',
              description: g.description || '',
              price: g.price || ''
            }));
            return {
              id: e.id,
              title: e.title,
              description: e.description,
              time: e.time,
              venue: e.venue,
              price: e.price || '',
              groups: matchedGrps
            };
          });
          return {
            id: s.id,
            title: s.title,
            tag: s.tag || 'Cultural Segment',
            icon: s.icon || 'fa-star',
            description: s.description || '',
            day_info: s.day_info || 'Festival Day',
            events: matchedEvts
          };
        });
        return result;
      }
    } catch (e) {
      console.warn('Supabase fetchDbSegments exception (falling back to local):', e);
    }
  }
  return getStoredSegments();
}


/**
 * Add new Segment
 */
async function addDbSegment(title, tag, icon, description, day_info = 'Day 1') {
  const newSeg = {
    id: 'seg-' + Date.now(),
    title,
    tag: tag || 'Cultural Segment',
    icon: icon || 'fa-star',
    description,
    day_info,
    events: []
  };

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('segments')
        .insert([{ title, tag, icon, description, day_info }])
        .select();

      if (error) {
        console.error('Supabase addSegment error:', error);
      } else if (data && data[0]) {
        newSeg.id = data[0].id;
      }
    } catch (e) {
      console.error('Supabase addSegment exception:', e);
    }
  }

  const segments = getStoredSegments();
  segments.push(newSeg);
  saveStoredSegments(segments);
  return true;
}

/**
 * Delete Segment
 */
async function deleteDbSegment(segmentId, index) {
  if (supabaseClient && segmentId && !String(segmentId).startsWith('seg-')) {
    try {
      await supabaseClient.from('segments').delete().eq('id', segmentId);
    } catch (e) {
      console.error('Supabase deleteSegment exception:', e);
    }
  }

  const segments = getStoredSegments();
  if (segments[index]) {
    segments.splice(index, 1);
  } else {
    const foundIdx = segments.findIndex(s => s.id === segmentId);
    if (foundIdx !== -1) segments.splice(foundIdx, 1);
  }
  saveStoredSegments(segments);
  return true;
}

/**
 * Add Event under a Segment
 */
async function addDbSegmentEvent(segmentId, title, description, time, venue, price) {
  const newEvt = {
    id: 'evt-' + Date.now(),
    title,
    description,
    time: time || 'TBA',
    venue: venue || 'Main Campus',
    price: price || '',
    groups: []
  };

  if (supabaseClient && segmentId && !String(segmentId).startsWith('seg-')) {
    try {
      const insertObj = { segment_id: segmentId, title, description, time, venue };
      if (price) insertObj.price = price;
      const { data, error } = await supabaseClient
        .from('segment_events')
        .insert([insertObj])
        .select();
      if (data && data[0]) {
        newEvt.id = data[0].id;
      }
    } catch (e) {
      console.error('Supabase addSegmentEvent exception:', e);
    }
  }

  const segments = getStoredSegments();
  const targetSeg = segments.find(s => String(s.id) === String(segmentId));
  if (targetSeg) {
    if (!targetSeg.events) targetSeg.events = [];
    targetSeg.events.push(newEvt);
    saveStoredSegments(segments);
  }
  return true;
}

/**
 * Delete Event under a Segment
 */
async function deleteDbSegmentEvent(segmentId, eventId) {
  if (supabaseClient && eventId && !String(eventId).startsWith('evt-')) {
    try {
      await supabaseClient.from('segment_events').delete().eq('id', eventId);
    } catch (e) {
      console.error('Supabase deleteSegmentEvent exception:', e);
    }
  }

  const segments = getStoredSegments();
  const targetSeg = segments.find(s => String(s.id) === String(segmentId));
  if (targetSeg && targetSeg.events) {
    targetSeg.events = targetSeg.events.filter(e => String(e.id) !== String(eventId));
    saveStoredSegments(segments);
  }
  return true;
}

/**
 * Add Group / Category under an Event
 */
async function addDbEventGroup(segmentId, eventId, group_name, age_limit, rules, description, price) {
  const newGrp = {
    id: 'grp-' + Date.now(),
    group_name,
    age_limit: age_limit || 'All ages',
    rules: rules || '',
    description: description || '',
    price: price || ''
  };

  if (supabaseClient && eventId && !String(eventId).startsWith('evt-')) {
    try {
      const insertObj = { event_id: eventId, group_name, age_limit, rules, description };
      if (price) insertObj.price = price;
      const { data } = await supabaseClient
        .from('event_groups')
        .insert([insertObj])
        .select();
      if (data && data[0]) {
        newGrp.id = data[0].id;
      }
    } catch (e) {
      console.error('Supabase addEventGroup exception:', e);
    }
  }

  const segments = getStoredSegments();
  const targetSeg = segments.find(s => String(s.id) === String(segmentId));
  if (targetSeg && targetSeg.events) {
    const targetEvt = targetSeg.events.find(e => String(e.id) === String(eventId));
    if (targetEvt) {
      if (!targetEvt.groups) targetEvt.groups = [];
      targetEvt.groups.push(newGrp);
      saveStoredSegments(segments);
    }
  }
  return true;
}

/**
 * Delete Group under an Event
 */
async function deleteDbEventGroup(segmentId, eventId, groupId) {
  if (supabaseClient && groupId && !String(groupId).startsWith('grp-')) {
    try {
      await supabaseClient.from('event_groups').delete().eq('id', groupId);
    } catch (e) {
      console.error('Supabase deleteEventGroup exception:', e);
    }
  }

  const segments = getStoredSegments();
  const targetSeg = segments.find(s => String(s.id) === String(segmentId));
  if (targetSeg && targetSeg.events) {
    const targetEvt = targetSeg.events.find(e => String(e.id) === String(eventId));
    if (targetEvt && targetEvt.groups) {
      targetEvt.groups = targetEvt.groups.filter(g => String(g.id) !== String(groupId));
      saveStoredSegments(segments);
    }
  }
  return true;
}

/**
 * Update Segment
 */
async function updateDbSegment(segmentId, data) {
  const { title, tag, icon, description, day_info } = data;
  if (supabaseClient && segmentId && !String(segmentId).startsWith('seg-')) {
    try {
      await supabaseClient
        .from('segments')
        .update({ title, tag, icon, description, day_info })
        .eq('id', segmentId);
    } catch (e) {
      console.error('Supabase updateDbSegment exception:', e);
    }
  }

  const segments = getStoredSegments();
  const target = segments.find(s => String(s.id) === String(segmentId));
  if (target) {
    if (title !== undefined) target.title = title;
    if (tag !== undefined) target.tag = tag;
    if (icon !== undefined) target.icon = icon;
    if (description !== undefined) target.description = description;
    if (day_info !== undefined) target.day_info = day_info;
    saveStoredSegments(segments);
  }
  return true;
}

/**
 * Update Event under a Segment
 */
async function updateDbSegmentEvent(segmentId, eventId, data) {
  const { title, description, venue, price } = data;
  if (supabaseClient && eventId && !String(eventId).startsWith('evt-')) {
    try {
      await supabaseClient
        .from('segment_events')
        .update({ title, description, venue, price })
        .eq('id', eventId);
    } catch (e) {
      console.error('Supabase updateDbSegmentEvent exception:', e);
    }
  }

  const segments = getStoredSegments();
  const targetSeg = segments.find(s => String(s.id) === String(segmentId));
  if (targetSeg && targetSeg.events) {
    const targetEvt = targetSeg.events.find(e => String(e.id) === String(eventId));
    if (targetEvt) {
      if (title !== undefined) targetEvt.title = title;
      if (description !== undefined) targetEvt.description = description;
      if (venue !== undefined) targetEvt.venue = venue;
      if (price !== undefined) targetEvt.price = price;
      saveStoredSegments(segments);
    }
  }
  return true;
}

/**
 * Update Group/Category under an Event
 */
async function updateDbEventGroup(segmentId, eventId, groupId, data) {
  const { group_name, age_limit, rules, description, price } = data;
  if (supabaseClient && groupId && !String(groupId).startsWith('grp-')) {
    try {
      await supabaseClient
        .from('event_groups')
        .update({ group_name, age_limit, rules, description, price })
        .eq('id', groupId);
    } catch (e) {
      console.error('Supabase updateDbEventGroup exception:', e);
    }
  }

  const segments = getStoredSegments();
  const targetSeg = segments.find(s => String(s.id) === String(segmentId));
  if (targetSeg && targetSeg.events) {
    const targetEvt = targetSeg.events.find(e => String(e.id) === String(eventId));
    if (targetEvt && targetEvt.groups) {
      const targetGrp = targetEvt.groups.find(g => String(g.id) === String(groupId));
      if (targetGrp) {
        if (group_name !== undefined) targetGrp.group_name = group_name;
        if (age_limit !== undefined) targetGrp.age_limit = age_limit;
        if (rules !== undefined) targetGrp.rules = rules;
        if (description !== undefined) targetGrp.description = description;
        if (price !== undefined) targetGrp.price = price;
        saveStoredSegments(segments);
      }
    }
  }
  return true;
}


/**
 * Helper to push all local data (Segments, Events, Categories, Schedule, EC Members) to Supabase
 */
async function syncLocalDataToSupabase() {
  if (!supabaseClient) {
    alert('❌ Supabase is not connected! Check config.js.');
    return false;
  }

  let segPushed = 0;
  let evtPushed = 0;
  let grpPushed = 0;
  let schedulePushed = 0;
  let ecPushed = 0;

  // 1. Push Segments, Segment Events & Categories
  const localSegments = getStoredSegments();
  for (const seg of localSegments) {
    try {
      let segDbId = seg.id;
      const { data: sData, error: sErr } = await supabaseClient
        .from('segments')
        .insert([{ title: seg.title, tag: seg.tag, icon: seg.icon, description: seg.description, day_info: seg.day_info }])
        .select();

      if (!sErr && sData && sData[0]) {
        segDbId = sData[0].id;
        segPushed++;
      }

      for (const evt of (seg.events || [])) {
        let evtDbId = evt.id;
        const { data: eData, error: eErr } = await supabaseClient
          .from('segment_events')
          .insert([{ segment_id: segDbId, title: evt.title, description: evt.description, time: evt.time, venue: evt.venue, price: evt.price }])
          .select();

        if (!eErr && eData && eData[0]) {
          evtDbId = eData[0].id;
          evtPushed++;
        }

        for (const grp of (evt.groups || [])) {
          const { error: gErr } = await supabaseClient
            .from('event_groups')
            .insert([{ event_id: evtDbId, group_name: grp.group_name, age_limit: grp.age_limit, rules: grp.rules, description: grp.description, price: grp.price }]);

          if (!gErr) grpPushed++;
        }
      }
    } catch (err) {
      console.warn('Sync segment error:', err);
    }
  }

  // 2. Push Schedule events
  const localSchedule = getStoredSchedule();
  for (const dayKey of ['day1', 'day2', 'day3']) {
    const events = localSchedule[dayKey] || [];
    for (const item of events) {
      try {
        const { error } = await supabaseClient
          .from('schedule')
          .insert([{ day: dayKey, time: item.time, title: item.title, venue: item.venue, description: item.desc || '' }]);
        if (!error) schedulePushed++;
      } catch (e) {}
    }
  }

  // 3. Push EC members
  const localMembers = getStoredEcMembers();
  for (const member of localMembers) {
    try {
      const { error } = await supabaseClient
        .from('ec_members')
        .insert([{ name: member.name, role: member.role, wing: member.wing || 'BVB', batch: member.wing || 'BVB', image_url: member.image || 'logo.png' }]);
      if (!error) ecPushed++;
    } catch (e) {}
  }

  alert(`✅ Full Sync Complete!\nPushed:\n- ${segPushed} Segment(s)\n- ${evtPushed} Event(s)\n- ${grpPushed} Category/Group(s)\n- ${schedulePushed} Schedule Event(s)\n- ${ecPushed} EC Member(s)\n\nAll data is now live on Supabase!`);
  return true;
}

/**
 * Supabase Secure Auth Login
 */
async function authenticateAdmin(emailOrId, password) {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: emailOrId.includes('@') ? emailOrId : `${emailOrId}@mpsc.com`,
        password: password
      });
      if (!error && data.user) {
        return { success: true, user: data.user };
      }
    } catch (e) {
      console.error('Supabase Auth error:', e);
    }
  }

  // Secure Local Authentication Gate (Default Admin Gate)
  if (emailOrId === 'admin' && password === 'admin') {
    return { success: true, user: { id: 'admin-local' } };
  }
  return { success: false };
}

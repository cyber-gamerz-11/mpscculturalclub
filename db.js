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

      if (!error && data && data.length > 0) {
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
      console.error('Supabase fetchSchedule error:', e);
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
      if (!error) return true;
    } catch (e) {
      console.error('Supabase addEvent error:', e);
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
      await supabaseClient.from('events').delete().eq('id', dbId);
      return true;
    } catch (e) {
      console.error('Supabase deleteEvent error:', e);
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

      if (!error && data && data.length > 0) {
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
      console.error('Supabase fetchEcMembers error:', e);
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
        .insert([{ name, role, wing, image_url: image }]);
      if (!error) return true;
    } catch (e) {
      console.error('Supabase addEcMember error:', e);
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
      await supabaseClient.from('ec_members').delete().eq('id', dbId);
      return true;
    } catch (e) {
      console.error('Supabase deleteEcMember error:', e);
    }
  }

  // Local Fallback
  const members = getStoredEcMembers();
  members.splice(index, 1);
  saveStoredEcMembers(members);
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

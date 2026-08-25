/** ACADEX Supabase Cloud Sync — Students, Grades & Platform Settings
 *  Lightweight, zero-dependency REST integration with Supabase PostgREST API.
 *  Non-blocking and resilient: local JSON files remain live if offline.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eczotaismhalrbvpanck.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_Q3eEj-h6uR4yjdX0lE9LIg_KLi7DKgg';

const state = {
  initialized: false,
  connected: false,
  lastSync: null,
  syncedStudents: 0,
  syncedGrades: 0,
  lastError: null,
};

const studentIdCache = new Map();

function headers() {
  return {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

/** Helper to determine Zimbabwean academic term from current date or input */
export function currentZimTerm() {
  const month = new Date().getMonth() + 1; // 1-12
  if (month <= 4) return 'Term 1';
  if (month <= 8) return 'Term 2';
  return 'Term 3';
}

/** Check connectivity and initialize platform settings in Supabase */
export async function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('[Supabase] Missing credentials, sync disabled');
    return state;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/settings?select=key&limit=1`, {
      method: 'GET',
      headers: headers(),
    });
    if (res.ok) {
      state.connected = true;
      state.initialized = true;
      state.lastSync = new Date().toISOString();
      console.log('✅ [Supabase] Connected to project:', SUPABASE_URL);
      
      // Sync basic platform info
      await syncSetting('acadex_version', '2.5.0-all-levels');
      await syncSetting('acadex_last_boot', new Date().toISOString());
      await syncSetting('acadex_status', 'online_24_7');
      await syncSetting('acadex_papers_count', '88');
    } else {
      const err = await res.text();
      state.lastError = `HTTP ${res.status}: ${err.slice(0, 100)}`;
      console.warn('⚠️ [Supabase] Connection warning:', state.lastError);
    }
  } catch (e) {
    state.lastError = e.message;
    console.warn('⚠️ [Supabase] Init error:', e.message);
  }
  return state;
}

/** Sync or create student profile in Supabase 'students' table */
export async function syncStudent(phone, learner = {}) {
  if (!state.connected || !phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;

  try {
    const fullName = learner.name ? `${learner.name} (${digits.slice(-4)})` : `Learner ${digits.slice(-4)}`;
    const gradeLevel = learner.form || learner.grade || 'Form 4 (O-Level)';
    const className = learner.school || 'ACADEX WhatsApp';

    // 1. Check if student already exists in cache or DB
    let studentId = studentIdCache.get(digits) || learner.supabase_id;
    if (!studentId) {
      const searchRes = await fetch(`${SUPABASE_URL}/rest/v1/students?full_name=eq.${encodeURIComponent(fullName)}&limit=1`, {
        method: 'GET',
        headers: headers(),
      });
      if (searchRes.ok) {
        const rows = await searchRes.json();
        if (rows && rows.length > 0) {
          studentId = rows[0].id;
          studentIdCache.set(digits, studentId);
        }
      }
    }

    // 2. Insert if not existing
    if (!studentId) {
      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          full_name: fullName,
          grade: gradeLevel,
          class: className,
          status: 'active',
          enrolled_at: new Date().toISOString().slice(0, 10),
        }),
      });
      if (insertRes.ok) {
        const inserted = await insertRes.json();
        if (inserted && inserted[0]) {
          studentId = inserted[0].id;
          studentIdCache.set(digits, studentId);
          state.syncedStudents += 1;
        }
      } else {
        const err = await insertRes.text();
        console.warn('⚠️ [Supabase] Student insert note:', err.slice(0, 120));
      }
    }

    state.lastSync = new Date().toISOString();
    return studentId;
  } catch (e) {
    console.warn('⚠️ [Supabase] syncStudent failed silently:', e.message);
    return null;
  }
}

/** Sync test / mock exam grade to Supabase 'grades' table */
export async function syncGrade(phone, gradeData = {}) {
  if (!state.connected || !phone) return null;
  const digits = String(phone).replace(/\D/g, '');

  try {
    const studentId = studentIdCache.get(digits) || null;
    const subject = gradeData.subject || 'Maths 4004/1';
    let term = gradeData.term || currentZimTerm();
    if (!['Term 1', 'Term 2', 'Term 3'].includes(term)) term = currentZimTerm();
    const year = Number(gradeData.year) || new Date().getFullYear();
    const mark = gradeData.score != null ? Math.round(Number(gradeData.score)) : (gradeData.pct != null ? Math.round(Number(gradeData.pct)) : null);
    const gradeLetter = gradeData.grade_letter || (mark >= 75 ? 'A' : mark >= 65 ? 'B' : mark >= 50 ? 'C' : mark >= 40 ? 'E' : 'U');

    const res = await fetch(`${SUPABASE_URL}/rest/v1/grades`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        student_id: studentId,
        subject,
        term,
        year,
        mark,
        grade_letter: gradeLetter,
      }),
    });

    if (res.ok) {
      state.syncedGrades += 1;
      state.lastSync = new Date().toISOString();
      return true;
    } else {
      const err = await res.text();
      console.warn('⚠️ [Supabase] Grade insert note:', err.slice(0, 120));
      return false;
    }
  } catch (e) {
    console.warn('⚠️ [Supabase] syncGrade failed silently:', e.message);
    return false;
  }
}

/** Sync setting to Supabase 'settings' table */
export async function syncSetting(key, value) {
  if (!state.connected || !key) return false;
  try {
    const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    // Check if key exists
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.${encodeURIComponent(key)}&limit=1`, {
      headers: headers(),
    });
    if (checkRes.ok) {
      const rows = await checkRes.json();
      if (rows && rows.length > 0) {
        // PATCH
        await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.${encodeURIComponent(key)}`, {
          method: 'PATCH',
          headers: headers(),
          body: JSON.stringify({ value: valStr }),
        });
        return true;
      }
    }

    // POST
    await fetch(`${SUPABASE_URL}/rest/v1/settings`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ key, value: valStr }),
    });
    return true;
  } catch (e) {
    console.warn('⚠️ [Supabase] syncSetting error:', e.message);
    return false;
  }
}

/** Get status of Supabase synchronization */
export function getSupabaseStatus() {
  return {
    ...state,
    url: SUPABASE_URL ? SUPABASE_URL.replace(/https?:\/\//, '').split('.')[0] + '.supabase.co' : 'not configured',
  };
}

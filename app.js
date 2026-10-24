/**
 * Chinmay's Expense Tracker - Application Logic & Realtime Cloud Engine
 */

const DEFAULT_CATS = [
  "Parking", "Petrol / Fuel", "Food / Vending Machine", "Rickshaw",
  "Recharge", "Groceries", "Clothing", "Electronics", "Personal Care",
  "Household", "Medical / Pharmacy", "Subscriptions", "Education / Exam Fees",
  "Scooty EMI", "SIP / Investment", "Loan Repayment", "Gift / Birthday / Party", "Other"
];
const KEY = "chinmayDailyGridV4";
const THEME_KEY = "chinmayAppTheme";

// Default fallback configuration (overridden by config.js if present)
const FALLBACK_CONFIG = {
  FIREBASE_DATABASE_URL: "https://chat-app-31ca7-default-rtdb.firebaseio.com",
  FIREBASE_NODE: "expenseTracker",
  DATABASE_SECRET: ""
};

let state = loadLocal();
let currentWeekIndex = 0;
let weeks = [];
let pieChartObj = null, barChartObj = null;
let mobileStartIndex = 0;
let cloudSyncTimeout = null;
let sseSource = null;

// Toast notification helper
function showToast(msg) {
  const t = document.getElementById('toast');
  const txt = document.getElementById('toastMsg');
  if (!t || !txt) return;
  txt.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

function localISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
const todayISO = localISO(new Date());

function ensureEmptyCustomRow() {
  if (!state || !state.categories.length) return;
  let lastCat = state.categories[state.categories.length - 1];
  let hasEntries = Object.keys(state.entries).some(k => k.startsWith(lastCat + "|"));
  let isDefaultOther = lastCat.startsWith("Other");

  if (hasEntries || !isDefaultOther) {
    let newName = "Other";
    let counter = 1;
    while(state.categories.includes(newName)) { 
      counter++; 
      newName = `Other ${counter}`; 
    }
    state.categories.push(newName);
  }
}
ensureEmptyCustomRow();

// Local Storage helpers
function loadLocal() {
  try {
    let x = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { 
      categories: [...new Set([...DEFAULT_CATS, ...(x.categories||[])])], 
      entries: x.entries || {}, 
      momCells: x.momCells || {} 
    };
  } catch { 
    return { categories: [...DEFAULT_CATS], entries: {}, momCells: {} }; 
  }
}
function saveLocal() { 
  localStorage.setItem(KEY, JSON.stringify(state)); 
}
function money(n) { 
  return new Intl.NumberFormat("en-IN", {
    style: "currency", 
    currency: "INR", 
    maximumFractionDigits: 2 
  }).format(n || 0); 
}
function esc(s) { 
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'
  }[c])); 
}

// ============================================================
// CONFIGURATION & FIREBASE REALTIME CLOUD INTEGRATION
// ============================================================
function getFirebaseEndpoint() {
  const cfg = window.APP_CONFIG || FALLBACK_CONFIG;
  let baseUrl = localStorage.getItem("chinmayDbUrl") || cfg.FIREBASE_DATABASE_URL || FALLBACK_CONFIG.FIREBASE_DATABASE_URL;
  let node = localStorage.getItem("chinmayDbNode") || cfg.FIREBASE_NODE || FALLBACK_CONFIG.FIREBASE_NODE;
  let secret = localStorage.getItem("chinmayDbSecret") || cfg.DATABASE_SECRET || "";
  
  baseUrl = baseUrl.trim().replace(/\/+$/, "");
  node = node.trim().replace(/^\/+|\/+$/g, "");
  let authParam = secret ? `?auth=${encodeURIComponent(secret.trim())}` : "";
  
  return {
    baseUrl,
    node,
    secret,
    dataUrl: `${baseUrl}/${node}.json${authParam}`,
    sseUrl: `${baseUrl}/${node}.json${authParam}`
  };
}

function setCloudStatus(status, text) {
  const btn = document.getElementById("cloudStatusBtn");
  const txt = document.getElementById("cloudStatusText");
  if (!btn || !txt) return;
  btn.className = `btn-action btn-cloud ${status}`;
  txt.textContent = text;
}

// Push local state to Firebase Realtime Database
async function pushToCloud(showNotification = false) {
  setCloudStatus('syncing', 'Syncing...');
  const endpoint = getFirebaseEndpoint();
  try {
    const payload = {
      categories: state.categories,
      entries: state.entries,
      momCells: state.momCells,
      updatedAt: Date.now()
    };
    const res = await fetch(endpoint.dataUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      setCloudStatus('synced', 'Cloud Synced');
      if (showNotification) showToast("Synced to Firebase Cloud!");
    } else if (res.status === 401 || res.status === 403) {
      setCloudStatus('error_perm', 'Rules Locked (Click to Fix)');
      if (sseSource) {
        try { sseSource.close(); } catch(e){}
        sseSource = null;
      }
      showToast("Firebase 401: Check Rules in Firebase Console.");
    } else {
      setCloudStatus('offline', 'Sync Error');
    }
  } catch (err) {
    setCloudStatus('offline', 'Offline (Saved Locally)');
  }
}

// Pull state from Firebase Realtime Database
async function fetchCloudData(isBackground = false) {
  const endpoint = getFirebaseEndpoint();
  if (!isBackground) setCloudStatus('syncing', 'Connecting...');
  try {
    const res = await fetch(endpoint.dataUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.entries) {
        state = {
          categories: [...new Set([...DEFAULT_CATS, ...(data.categories || []), ...state.categories])],
          entries: { ...state.entries, ...data.entries },
          momCells: { ...state.momCells, ...(data.momCells || {}) }
        };
        ensureEmptyCustomRow();
        saveLocal();
        render();
        setCloudStatus('synced', 'Cloud Synced');
        if (!isBackground) showToast("Cloud data loaded!");
      } else if (data === null) {
        pushToCloud();
      }
    } else if (res.status === 401 || res.status === 403) {
      setCloudStatus('error_perm', 'Rules Locked (Click to Fix)');
      if (sseSource) {
        try { sseSource.close(); } catch(e){}
        sseSource = null;
      }
      if (!isBackground) showToast("Firebase 401: Click 'Rules Locked' to view 10-sec fix.");
    } else {
      setCloudStatus('offline', 'Offline');
    }
  } catch (err) {
    setCloudStatus('offline', 'Offline (Using Local)');
  }
}

// Real-time live listener using Server-Sent Events (SSE)
function initRealtimeListener() {
  if (sseSource) {
    try { sseSource.close(); } catch(e){}
    sseSource = null;
  }
  try {
    const endpoint = getFirebaseEndpoint();
    sseSource = new EventSource(endpoint.sseUrl);
    sseSource.addEventListener('put', e => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed && parsed.path === "/" && parsed.data && parsed.data.entries) {
          if (document.activeElement && document.activeElement.matches('.amount, .cat-edit')) {
            return;
          }
          const cloudState = parsed.data;
          state = {
            categories: [...new Set([...DEFAULT_CATS, ...(cloudState.categories || [])])],
            entries: cloudState.entries || {},
            momCells: cloudState.momCells || {}
          };
          ensureEmptyCustomRow();
          saveLocal();
          render();
          setCloudStatus('synced', 'Cloud Synced');
        }
      } catch(err){}
    });
    sseSource.onerror = (err) => {
      if (sseSource) {
        try { sseSource.close(); } catch(e){}
        sseSource = null;
      }
    };
  } catch(e) {}
}

function triggerSave(immediateCloud = false) {
  saveLocal();
  clearTimeout(cloudSyncTimeout);
  setCloudStatus('syncing', 'Syncing...');
  if (immediateCloud) {
    pushToCloud();
  } else {
    cloudSyncTimeout = setTimeout(() => {
      pushToCloud();
    }, 700);
  }
}

// Salary cycle: 7th of selected month to 6th of following month
function getCycleDates() {
  let v = document.getElementById("cycle").value;
  if (!v) return [];
  let [y, m] = v.split("-").map(Number);
  let d = new Date(y, m - 1, 7, 0, 0, 0);
  let end = new Date(y, m, 6, 0, 0, 0);
  let dates = [];
  while (d <= end) { 
    dates.push(localISO(d)); 
    d.setDate(d.getDate() + 1); 
  }
  return dates;
}

function updateCycleBadge() {
  let dates = getCycleDates();
  let badge = document.getElementById("cycleRangeBadge");
  if (dates.length && badge) {
    let d1 = new Date(dates[0] + "T00:00:00");
    let d2 = new Date(dates[dates.length - 1] + "T00:00:00");
    let f1 = d1.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    let f2 = d2.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    badge.querySelector("span").textContent = `${f1} – ${f2}`;
  }
}

function buildWeeks() {
  let dates = getCycleDates();
  weeks = [];
  let chunk = [];
  dates.forEach(d => {
    chunk.push(d);
    let dt = new Date(d + "T00:00:00");
    if(dt.getDay() === 0 || d === dates[dates.length-1]) { 
      weeks.push([...chunk]); 
      chunk = []; 
    }
  });
  
  let found = weeks.findIndex(w => w.includes(todayISO));
  currentWeekIndex = (found !== -1) ? found : 0;
  
  if(weeks.length > 0) {
    let todayIdx = weeks[currentWeekIndex].indexOf(todayISO);
    if (todayIdx !== -1) {
      mobileStartIndex = Math.max(0, todayIdx - 2);
    } else {
      mobileStartIndex = 0;
    }
  }
  updateCycleBadge();
}

function shiftMobileDate(dir) {
  if(!weeks.length || !weeks[currentWeekIndex]) return;
  let wkDates = weeks[currentWeekIndex];
  mobileStartIndex += dir;
  
  if (mobileStartIndex < 0) {
    if (currentWeekIndex > 0) {
      currentWeekIndex--;
      mobileStartIndex = Math.max(0, weeks[currentWeekIndex].length - 3); 
    } else {
      mobileStartIndex = 0;
    }
  } else if (mobileStartIndex > wkDates.length - 3 && wkDates.length >= 3) {
    if (currentWeekIndex < weeks.length - 1) {
      currentWeekIndex++;
      mobileStartIndex = 0;
    } else {
      mobileStartIndex = wkDates.length - 3;
    }
  } else if (wkDates.length < 3 && mobileStartIndex > 0) {
    if (currentWeekIndex < weeks.length - 1) {
      currentWeekIndex++;
      mobileStartIndex = 0;
    } else {
      mobileStartIndex = 0; 
    }
  }
  render();
}

function render() {
  if(!weeks.length) return;
  if(currentWeekIndex < 0) currentWeekIndex = 0;
  if(currentWeekIndex >= weeks.length) currentWeekIndex = weeks.length-1;
  
  let focusState = null;
  let active = document.activeElement;
  if (active) {
    if (active.matches('.amount')) focusState = { type: 'amount', key: active.dataset.key };
    else if (active.matches('.cat-edit')) focusState = { type: 'cat', old: active.dataset.old };
  }

  let wkDates = weeks[currentWeekIndex];
  let monthName = new Date(wkDates[0] + "T00:00:00").toLocaleString('default', {month:'short'}).toUpperCase();
  let yearNum = new Date(wkDates[0] + "T00:00:00").getFullYear();
  document.getElementById("currentWeekLabel").textContent = `WK ${currentWeekIndex+1} • ${monthName} ${yearNum}`;
  
  let maxStart = Math.max(0, wkDates.length - 3);
  if (mobileStartIndex > maxStart) mobileStartIndex = maxStart;
  if (mobileStartIndex < 0) mobileStartIndex = 0;
  let visibleIndices = [mobileStartIndex, mobileStartIndex + 1, mobileStartIndex + 2].filter(i => i < wkDates.length);

  // 1. Table Header
  let thead = `<tr><th class="cat-col">Category</th>`;
  wkDates.forEach((d, i) => {
    let dt = new Date(d + "T00:00:00");
    let isToday = (d === todayISO);
    let isMobileVisible = visibleIndices.includes(i);
    let dateStr = `${dt.getDate()} ${dt.toLocaleString('default',{weekday:'short'})}`;
    
    let cls = `day-col ${isToday ? 'today' : ''} ${isMobileVisible ? 'mobile-active' : ''}`;
    
    let mobileNavHtml = `<div class="mobile-date-wrapper">`;
    if (i === visibleIndices[0]) mobileNavHtml += `<button class="m-nav-btn m-prev" aria-label="Previous day">&lt;</button>`;
    else mobileNavHtml += `<span class="spacer"></span>`;
    
    mobileNavHtml += `<span>${dateStr}</span>`;
    
    if (i === visibleIndices[visibleIndices.length - 1]) mobileNavHtml += `<button class="m-nav-btn m-next" aria-label="Next day">&gt;</button>`;
    else mobileNavHtml += `<span class="spacer"></span>`;
    mobileNavHtml += `</div>`;

    thead += `<th class="${cls}">
       <span class="desktop-date">${dateStr}</span>
       ${mobileNavHtml}
    </th>`;
  });
  thead += `<th>Week Total</th></tr>`;
  document.getElementById("gridHead").innerHTML = thead;

  // 2. Table Body
  let tbody = "";
  let searchQuery = document.getElementById("searchBar").value.trim().toLowerCase();
  let displayedCatsCount = 0;

  state.categories.forEach(cat => {
    if (searchQuery && !cat.toLowerCase().includes(searchQuery)) return;
    displayedCatsCount++;

    tbody += `<tr><td class="cat-col"><input class="cat-edit" type="text" value="${esc(cat)}" data-old="${esc(cat)}" placeholder="Category Name"></td>`;
    let catWkTotal = 0;
    wkDates.forEach((d, i) => {
      let k = `${cat}|${d}`;
      let amt = state.entries[k] || "";
      let mom = state.momCells[k] ? "checked" : "";
      let isToday = (d === todayISO);
      let isMobileVisible = visibleIndices.includes(i);
      if(amt) catWkTotal += Number(amt);
      
      let cls = `day-col ${mom ? 'mom-active' : ''} ${isToday ? 'today' : ''} ${isMobileVisible ? 'mobile-active' : ''}`;
      tbody += `<td class="${cls}">
        <div class="cell-wrapper">
          <label class="mom-check-wrap" title="Toggle Mom's Account">
            <input type="checkbox" class="mom-check" data-key="${esc(k)}" ${mom}>
          </label>
          <input type="number" class="amount" data-key="${esc(k)}" value="${amt}" min="0" step="0.01" placeholder="—">
        </div>
      </td>`;
    });
    tbody += `<td class="row-total-cell">${catWkTotal > 0 ? money(catWkTotal) : '—'}</td></tr>`;
  });

  if (displayedCatsCount === 0) {
    tbody = `<tr><td colspan="${wkDates.length + 2}" style="text-align: center; padding: 32px; color: var(--muted);">No matching categories found for "${esc(searchQuery)}"</td></tr>`;
  }
  document.getElementById("gridBody").innerHTML = tbody;

  document.getElementById("catCountPill").textContent = `${displayedCatsCount} / ${state.categories.length} Categories`;

  // 3. Table Footer
  let tfoot = `<tr><td class="cat-col" style="font-weight:700">Daily Total</td>`;
  wkDates.forEach((d, i) => {
    let dTotal = state.categories.reduce((sum, cat) => sum + (Number(state.entries[`${cat}|${d}`]) || 0), 0);
    let isToday = (d === todayISO);
    let isMobileVisible = visibleIndices.includes(i);
    let cls = `day-col ${isToday ? 'today' : ''} ${isMobileVisible ? 'mobile-active' : ''}`;
    tfoot += `<td style="font-weight:700;" class="${cls}">${dTotal ? money(dTotal) : '—'}</td>`;
  });
  let wkGrTotal = wkDates.reduce((s,d) => s + state.categories.reduce((s2,c) => s2 + (Number(state.entries[`${c}|${d}`])||0),0),0);
  tfoot += `<td class="grand-total-cell">${money(wkGrTotal)}</td></tr>`;
  document.getElementById("gridFoot").innerHTML = tfoot;

  updateMetrics();
  drawCharts();

  if (focusState) {
    let el;
    if (focusState.type === 'amount') el = document.querySelector(`.amount[data-key="${focusState.key}"]`);
    else if (focusState.type === 'cat') el = document.querySelector(`.cat-edit[data-old="${focusState.old}"]`);
    if (el) { el.focus(); if (el.select) el.select(); }
  }
}

// Update Header Metric Pills and Sidebar Metrics
function updateMetrics() {
  let total = 0, wk = 0, mom = 0, own = 0;
  let dates = getCycleDates();
  let wkDates = weeks[currentWeekIndex] || [];
  
  dates.forEach(d => {
    state.categories.forEach(cat => {
      let k = `${cat}|${d}`;
      let amt = Number(state.entries[k]) || 0;
      if (amt > 0) {
        total += amt;
        if(state.momCells[k]) mom += amt; else own += amt;
        if(wkDates.includes(d)) wk += amt;
      }
    });
  });
  
  let fTotal = money(total);
  let fWeek = money(wk);
  let fMom = money(mom);
  let fOwn = money(own);

  document.getElementById("m-total").textContent = fTotal;
  document.getElementById("m-week").textContent = fWeek;
  document.getElementById("m-mom").textContent = fMom;
  document.getElementById("m-own").textContent = fOwn;

  let sbTotal = document.getElementById("sb-m-total");
  let sbWeek = document.getElementById("sb-m-week");
  let sbMom = document.getElementById("sb-m-mom");
  let sbOwn = document.getElementById("sb-m-own");
  if (sbTotal) sbTotal.textContent = fTotal;
  if (sbWeek) sbWeek.textContent = fWeek;
  if (sbMom) sbMom.textContent = fMom;
  if (sbOwn) sbOwn.textContent = fOwn;
}

function drawCharts() {
  if (typeof Chart === 'undefined') return;
  let dates = getCycleDates();
  let catData = {}, dailyData = {};
  dates.forEach(d => dailyData[d] = 0);
  state.categories.forEach(c => catData[c] = 0);
  
  dates.forEach(d => {
    state.categories.forEach(cat => {
      let amt = Number(state.entries[`${cat}|${d}`]) || 0;
      catData[cat] += amt;
      dailyData[d] += amt;
    });
  });
  
  let labels = state.categories.filter(c => catData[c] > 0);
  let vals = labels.map(c => catData[c]);
  let isDark = document.body.classList.contains("dark");
  let textColor = isDark ? "#CBD5E1" : "#64748B";
  let gridColor = isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9";

  // 1. Doughnut Chart
  if(pieChartObj) pieChartObj.destroy();
  const pieCanvas = document.getElementById('pieChart');
  if (pieCanvas) {
    const pieCtx = pieCanvas.getContext('2d');
    pieChartObj = new Chart(pieCtx, {
      type: 'doughnut',
      data: { 
        labels: labels.length ? labels : ['No Expenses Yet'], 
        datasets: [{ 
          data: vals.length ? vals : [1], 
          backgroundColor: vals.length ? [
            '#4F46E5','#06B6D4','#10B981','#F59E0B','#EC4899','#8B5CF6','#F43F5E','#3B82F6','#14B8A6'
          ] : [isDark ? '#1E293B' : '#E2E8F0'], 
          borderWidth: 0,
          hoverOffset: 6
        }] 
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        cutout: '72%', 
        plugins: { 
          legend: { 
            position: 'right', 
            labels: {
              color: textColor, 
              font: {family:'Inter', size:11, weight:'500'},
              boxWidth: 10,
              boxHeight: 10,
              borderRadius: 5,
              useBorderRadius: true,
              padding: 12
            } 
          },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                return ` ${ctx.label}: ${money(ctx.raw)}`;
              }
            }
          } 
        } 
      }
    });
  }

  // 2. Daily Bar Chart
  if(barChartObj) barChartObj.destroy();
  const barCanvas = document.getElementById('barChart');
  if (barCanvas) {
    let dLabels = Object.keys(dailyData).map(d => new Date(d + "T00:00:00").getDate());
    let dVals = Object.values(dailyData);
    const barCtx = barCanvas.getContext('2d');
    
    barChartObj = new Chart(barCtx, {
      type: 'bar',
      data: { 
        labels: dLabels, 
        datasets: [{ 
          label: 'Daily Spend', 
          data: dVals, 
          backgroundColor: isDark ? 'rgba(99, 102, 241, 0.85)' : 'rgba(79, 70, 229, 0.85)',
          hoverBackgroundColor: isDark ? '#818CF8' : '#4338CA',
          borderRadius: 5,
          borderSkipped: false
        }] 
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        scales: { 
          x: { 
            grid: { display: false }, 
            ticks: { 
              color: textColor, 
              font: { family:'Inter', size: 10.5 } 
            } 
          }, 
          y: { 
            border: { display: false }, 
            grid: { color: gridColor }, 
            ticks: { 
              color: textColor, 
              font: { family:'Inter', size: 10.5 },
              callback: function(v) { return '₹' + v; }
            } 
          } 
        }, 
        plugins: { 
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                return ` Spend: ${money(ctx.raw)}`;
              }
            }
          } 
        } 
      }
    });
  }
}

// Sidebar Drawer
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const openBtn = document.getElementById("openSidebar");
const closeBtn = document.getElementById("closeSidebar");

function toggleSidebar() { 
  if (!sidebar || !overlay) return;
  sidebar.classList.toggle('active'); 
  overlay.classList.toggle('active'); 
}
if (openBtn) openBtn.addEventListener('click', toggleSidebar);
if (closeBtn) closeBtn.addEventListener('click', toggleSidebar);
if (overlay) overlay.addEventListener('click', toggleSidebar);

// Cloud Settings Modal
const cloudModal = document.getElementById("cloudModal");
const openCloudBtn = document.getElementById("cloudStatusBtn");
const closeCloudModal = document.getElementById("closeCloudModal");
const closeCloudModalBtn = document.getElementById("closeCloudModalBtn");
const sbCloudSettings = document.getElementById("sb-cloudSettings");

function openModal() {
  const ep = getFirebaseEndpoint();
  document.getElementById("cfgDbUrl").value = ep.baseUrl;
  document.getElementById("cfgDbNode").value = ep.node;
  document.getElementById("cfgDbSecret").value = ep.secret;
  cloudModal.classList.add("active");
}
function closeModal() {
  cloudModal.classList.remove("active");
}

if (openCloudBtn) openCloudBtn.addEventListener("click", openModal);
if (sbCloudSettings) sbCloudSettings.addEventListener("click", () => { toggleSidebar(); openModal(); });
if (closeCloudModal) closeCloudModal.addEventListener("click", closeModal);
if (closeCloudModalBtn) closeCloudModalBtn.addEventListener("click", closeModal);
if (cloudModal) cloudModal.addEventListener("click", e => { if (e.target === cloudModal) closeModal(); });

const btnSaveCloudConfig = document.getElementById("btnSaveCloudConfig");
if (btnSaveCloudConfig) {
  btnSaveCloudConfig.addEventListener("click", () => {
    const cfg = window.APP_CONFIG || FALLBACK_CONFIG;
    let url = document.getElementById("cfgDbUrl").value.trim() || cfg.FIREBASE_DATABASE_URL;
    let node = document.getElementById("cfgDbNode").value.trim() || cfg.FIREBASE_NODE;
    let secret = document.getElementById("cfgDbSecret").value.trim();
    localStorage.setItem("chinmayDbUrl", url);
    localStorage.setItem("chinmayDbNode", node);
    localStorage.setItem("chinmayDbSecret", secret);
    closeModal();
    showToast("Firebase settings updated");
    fetchCloudData();
    initRealtimeListener();
  });
}

const btnPushCloud = document.getElementById("btnPushCloud");
if (btnPushCloud) btnPushCloud.addEventListener("click", async () => { await pushToCloud(true); });

const btnPullCloud = document.getElementById("btnPullCloud");
if (btnPullCloud) btnPullCloud.addEventListener("click", async () => { await fetchCloudData(false); });

// Grid Events
document.getElementById("grid").addEventListener("click", e => {
  if(e.target.matches('.m-prev')) { shiftMobileDate(-1); }
  if(e.target.matches('.m-next')) { shiftMobileDate(1); }
});

document.getElementById("grid").addEventListener("change", e => {
  if(e.target.matches(".cat-edit")) {
    let old = e.target.dataset.old;
    let nw = e.target.value.trim();
    if(!nw || nw === old) { e.target.value = old; return; }
    if(state.categories.includes(nw)) { 
      showToast("Category name already exists!"); 
      e.target.value = old; 
      return; 
    }
    
    let idx = state.categories.indexOf(old);
    state.categories[idx] = nw;
    
    let newE = {}, newM = {};
    for(let k in state.entries) { 
      let [c,d] = k.split("|"); 
      newE[`${c===old?nw:c}|${d}`] = state.entries[k]; 
    }
    for(let k in state.momCells) { 
      let [c,d] = k.split("|"); 
      newM[`${c===old?nw:c}|${d}`] = state.momCells[k]; 
    }
    
    state.entries = newE; 
    state.momCells = newM;
    ensureEmptyCustomRow(); 
    triggerSave(true);
    render(); 
    showToast("Category updated"); 
    return;
  }
  
  if(e.target.matches(".amount") || e.target.matches(".mom-check")) {
    let wrapper = e.target.closest('.cell-wrapper');
    let amtInput = wrapper.querySelector('.amount');
    let chkInput = wrapper.querySelector('.mom-check');
    let k = amtInput.dataset.key;
    let v = Number(amtInput.value);
    
    if(v > 0) {
      state.entries[k] = v;
      if(chkInput.checked) state.momCells[k] = true; else delete state.momCells[k];
    } else {
      delete state.entries[k]; 
      delete state.momCells[k];
      amtInput.value = ""; 
      chkInput.checked = false; 
    }
    ensureEmptyCustomRow(); 
    triggerSave(false);
    render();
  }
});

// Enter key navigation
document.getElementById("grid").addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.matches("input.amount")) {
    e.preventDefault();
    let inputs = [...document.querySelectorAll("input.amount")];
    let idx = inputs.indexOf(e.target);
    if(inputs[idx+1]) { 
      inputs[idx+1].focus(); 
      inputs[idx+1].select(); 
    }
  }
});

// Search bar
const searchBar = document.getElementById("searchBar");
const searchClear = document.getElementById("searchClear");

searchBar.addEventListener("input", () => {
  if (searchBar.value.trim().length > 0) {
    searchClear.classList.add("visible");
  } else {
    searchClear.classList.remove("visible");
  }
  render();
});

searchClear.addEventListener("click", () => {
  searchBar.value = "";
  searchClear.classList.remove("visible");
  searchBar.focus();
  render();
});

// Jump to Today
document.getElementById("todayJumpBtn").addEventListener("click", () => {
  let found = weeks.findIndex(w => w.includes(todayISO));
  if (found !== -1) {
    currentWeekIndex = found;
    let todayIdx = weeks[currentWeekIndex].indexOf(todayISO);
    mobileStartIndex = Math.max(0, todayIdx - 2);
    render();
    showToast("Jumped to current week");
  } else {
    let now = new Date();
    document.getElementById("cycle").value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    buildWeeks();
    render();
    showToast("Switched to current cycle");
  }
});

// Month navigation buttons
document.getElementById("prevMonthBtn").addEventListener("click", () => {
  let v = document.getElementById("cycle").value;
  if (!v) return;
  let [y, m] = v.split("-").map(Number);
  let d = new Date(y, m - 2, 1);
  document.getElementById("cycle").value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  buildWeeks();
  render();
});

document.getElementById("nextMonthBtn").addEventListener("click", () => {
  let v = document.getElementById("cycle").value;
  if (!v) return;
  let [y, m] = v.split("-").map(Number);
  let d = new Date(y, m, 1);
  document.getElementById("cycle").value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  buildWeeks();
  render();
});

// Week navigation
document.getElementById("prevWeek").addEventListener("click", () => { 
  currentWeekIndex--; 
  mobileStartIndex = 0;
  render(); 
});
document.getElementById("nextWeek").addEventListener("click", () => { 
  currentWeekIndex++; 
  mobileStartIndex = 0;
  render(); 
});
document.getElementById("cycle").addEventListener("change", () => { 
  buildWeeks(); 
  render(); 
});

// Theme toggle & persistence
function applyTheme(isDark) {
  if (isDark) {
    document.body.classList.add("dark");
    document.getElementById("themeIcon").textContent = "☀️";
  } else {
    document.body.classList.remove("dark");
    document.getElementById("themeIcon").textContent = "🌙";
  }
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  drawCharts();
}

const savedTheme = localStorage.getItem(THEME_KEY);
if (savedTheme === "dark" || (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  applyTheme(true);
} else {
  applyTheme(false);
}

document.getElementById("themeToggle").addEventListener("click", () => {
  let isDark = document.body.classList.toggle("dark");
  applyTheme(isDark);
  showToast(isDark ? "Dark theme enabled" : "Light theme enabled");
});

// CSV Export
function executeCsvExport() {
  let ds = getCycleDates(), cats = state.categories;
  let rows = [
    ["Category", "Date", "Amount INR", "Account"], 
    ...cats.flatMap(cat => ds.map(d => [
      cat, 
      d, 
      state.entries[`${cat}|${d}`] || 0, 
      state.momCells[`${cat}|${d}`] ? "Mom's account" : "My account"
    ]).filter(r => r[2] > 0))
  ];
  let csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  let u = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  let a = document.createElement("a"); 
  a.href = u; 
  a.download = `chinmay-expenses-${document.getElementById("cycle").value}.csv`; 
  a.click();
  showToast("CSV Exported successfully!"); 
  if(sidebar && sidebar.classList.contains('active')) toggleSidebar();
}
document.getElementById("exportCsv").addEventListener("click", executeCsvExport);
const sbExportCsv = document.getElementById("sb-exportCsv");
if (sbExportCsv) sbExportCsv.addEventListener("click", executeCsvExport);

// JSON Backup
function executeBackup() {
  let u = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], {type:"application/json"}));
  let a = document.createElement("a"); 
  a.href = u; 
  a.download = `chinmay-expense-backup-${todayISO}.json`; 
  a.click();
  showToast("Backup saved to file!"); 
  if(sidebar && sidebar.classList.contains('active')) toggleSidebar();
}
document.getElementById("backup").addEventListener("click", executeBackup);
const sbBackup = document.getElementById("sb-backup");
if (sbBackup) sbBackup.addEventListener("click", executeBackup);

// JSON Restore
function executeRestore() {
  document.getElementById("restoreFile").click();
  if(sidebar && sidebar.classList.contains('active')) toggleSidebar();
}
document.getElementById("restore").addEventListener("click", executeRestore);
const sbRestore = document.getElementById("sb-restore");
if (sbRestore) sbRestore.addEventListener("click", executeRestore);

document.getElementById("restoreFile").addEventListener("change", async e => {
  let f = e.target.files[0]; 
  if (!f) return;
  try {
    let x = JSON.parse(await f.text());
    if (!x.entries || !Array.isArray(x.categories)) throw 0;
    state = { 
      categories: [...new Set([...DEFAULT_CATS, ...x.categories])], 
      entries: x.entries, 
      momCells: x.momCells || {} 
    };
    triggerSave(true);
    render(); 
    showToast("Data restored & synced to cloud!");
  } catch { 
    showToast("Invalid backup file."); 
  }
  e.target.value = "";
});

// Window focus refresh
window.addEventListener('focus', () => {
  const btn = document.getElementById("cloudStatusBtn");
  if (btn && !btn.classList.contains("error_perm")) {
    fetchCloudData(true);
  }
});

// Initialize Cycle to current month
let now = new Date();
document.getElementById("cycle").value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
buildWeeks();
render();

// Start Firebase Cloud Sync & Realtime Listener
fetchCloudData(false);
initRealtimeListener();

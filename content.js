// --- 1. UI INJECTION (MODERN + RESIZABLE) ---
const widget = document.createElement('div');
widget.id = 'iba-attendance-widget';
widget.innerHTML = `
  <div class="iba-header" title="Drag to move">
    <div id="iba-student-name">Loading...</div>
    <div id="iba-subject-name">Awaiting Search...</div>
  </div>
  <div class="iba-body">
    <div class="iba-stat-title">Absences Used</div>
    <div class="iba-main-number"><span id="iba-absences-count">0</span><span class="iba-limit"> / 12</span></div>
    <div class="iba-progress-bg">
      <div id="iba-progress-fill"></div>
    </div>
    <div id="iba-status-message">Safe Zone</div>
  </div>
`;

const style = document.createElement('style');
style.textContent = `
  #iba-attendance-widget {
    position: fixed; bottom: 40px; right: 40px; width: 320px;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    color: #f8fafc; border-radius: 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    z-index: 999999; border: 1px solid rgba(255,255,255,0.08);
    transition: background 0.2s ease;
    resize: both; overflow: hidden; min-width: 260px; min-height: 220px; max-width: 500px;
  }
  .iba-header { 
    background: rgba(255, 255, 255, 0.03); padding: 22px 24px; 
    border-bottom: 1px solid rgba(255,255,255,0.05); cursor: grab; user-select: none;
  }
  .iba-header:active { cursor: grabbing; }
  #iba-student-name { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; margin-bottom: 6px; pointer-events: none; }
  #iba-subject-name { font-size: 17px; font-weight: 700; color: #f1f5f9; pointer-events: none; line-height: 1.3; letter-spacing: -0.3px; }
  .iba-body { padding: 28px 24px; text-align: center; display: flex; flex-direction: column; justify-content: center; height: calc(100% - 85px); box-sizing: border-box; }
  .iba-stat-title { font-size: 13px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
  .iba-main-number { font-size: 48px; font-weight: 800; margin: 12px 0 20px 0; color: #ffffff; text-shadow: 0 4px 12px rgba(0,0,0,0.3); letter-spacing: -1px; }
  .iba-limit { font-size: 24px; color: #475569; font-weight: 600; letter-spacing: 0; }
  .iba-progress-bg { width: 100%; height: 8px; background: rgba(255,255,255,0.08); border-radius: 12px; margin-bottom: 20px; overflow: hidden; flex-shrink: 0;}
  #iba-progress-fill { height: 100%; width: 0%; border-radius: 12px; transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.4s ease; }
  #iba-status-message { font-size: 14px; font-weight: 600; padding: 8px 16px; border-radius: 20px; display: inline-block; background: rgba(255,255,255,0.05); letter-spacing: 0.3px; align-self: center;}
`;
document.head.appendChild(style);
document.body.appendChild(widget);

// --- 2. DRAGGABLE LOGIC ---
let isDragging = false;
const header = widget.querySelector('.iba-header');

header.addEventListener('mousedown', (e) => {
  if (e.target !== header) return; 
  isDragging = true;
  const rect = widget.getBoundingClientRect();
  widget.style.bottom = 'auto';
  widget.style.right = 'auto';
  widget.style.left = rect.left + 'px';
  widget.style.top = rect.top + 'px';
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const rect = widget.getBoundingClientRect();
  widget.style.left = (rect.left + e.movementX) + 'px';
  widget.style.top = (rect.top + e.movementY) + 'px';
});

document.addEventListener('mouseup', () => { isDragging = false; });

// --- 3. STATE MEMORY & SCRAPING LOGIC ---
let lastTableDataSnapshot = null; // Memory lock to prevent premature updates

function getDropdownSubject() {
  const exactDropdown = document.querySelector('select[id*="Dpcmscourses"], select[name*="Dpcmscourses"]');
  if (exactDropdown) {
    const checkedOption = exactDropdown.querySelector('option:checked');
    if (checkedOption && !checkedOption.text.includes('Select')) return checkedOption.text.trim();
  }
  const allSelected = document.querySelectorAll('option[selected="selected"], option:checked');
  for (let opt of allSelected) {
    const val = opt.innerText.trim();
    if (val.length > 7 && !val.includes('Spring') && !val.includes('Fall') && !val.toLowerCase().includes('select')) {
      return val;
    }
  }
  return "Subject Not Found";
}

function runScanner() {
  // Extract Student Name safely
  const nameElement = Array.from(document.querySelectorAll('span, div')).find(el => el.innerText.includes('Logout') && el.innerText.includes(','));
  if (nameElement) {
    document.getElementById('iba-student-name').innerText = nameElement.innerText.split(',')[0].trim();
  }

  // Grab current table rows
  const rows = document.querySelectorAll('tr.rgRow, tr.rgAltRow');
  
  // Create a text snapshot of the current table to compare against our memory
  const currentTableDataSnapshot = Array.from(rows).map(row => row.innerText).join('');

  // THE FIX: If the table hasn't changed since the last time we checked, DO NOTHING.
  // This completely blocks the widget from updating just because the dropdown changed.
  if (currentTableDataSnapshot === lastTableDataSnapshot) {
    return;
  }

  // If we reach here, the table HAS changed (button was clicked, or first load).
  // Update our memory lock.
  lastTableDataSnapshot = currentTableDataSnapshot;

  // SCENARIO 1: First load, no table exists yet
  if (rows.length === 0) {
    updateUI("Awaiting Search...", 0, "PENDING");
    return;
  }

  // SCENARIO 2: Table exists and just updated! Now it is safe to read the dropdown.
  const confirmedSubject = getDropdownSubject();
  
  // Calculate Absences (50/100 min rules)
  let totalAbsenceUnits = 0;
  rows.forEach(row => {
    const cols = row.querySelectorAll('td');
    if (cols.length >= 5) {
      const statusText = cols[3].innerText.trim().toLowerCase();
      const minutes = parseInt(cols[4].innerText.trim(), 10) || 50; 
      if (statusText === 'absent') {
        totalAbsenceUnits += (minutes >= 100 ? 2 : 1);
      }
    }
  });

  updateUI(confirmedSubject, totalAbsenceUnits, "ACTIVE");
}

// --- 4. UPDATE VISUALS ---
function updateUI(subjectName, absences, state) {
  document.getElementById('iba-subject-name').innerText = subjectName;
  const countSpan = document.getElementById('iba-absences-count');
  const fillBar = document.getElementById('iba-progress-fill');
  const statusMsg = document.getElementById('iba-status-message');

  countSpan.innerText = absences;
  
  let percentage = (absences / 12) * 100;
  if (percentage > 100) percentage = 100;
  fillBar.style.width = percentage + '%';

  if (state === "PENDING") {
    fillBar.style.backgroundColor = 'rgba(255,255,255,0.1)';
    fillBar.style.boxShadow = 'none';
    statusMsg.innerText = "Select a subject & fetch";
    statusMsg.style.color = '#94a3b8';
    return;
  }

  // Premium glowing colors for ACTIVE state
  if (absences <= 6) {
    fillBar.style.backgroundColor = '#10b981';
    fillBar.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.4)';
    statusMsg.innerText = "Safe Zone";
    statusMsg.style.color = '#10b981';
  } else if (absences <= 9) {
    fillBar.style.backgroundColor = '#fbbf24'; 
    fillBar.style.boxShadow = '0 0 12px rgba(251, 191, 36, 0.4)';
    statusMsg.innerText = "Warning: Approaching Limit";
    statusMsg.style.color = '#fbbf24';
  } else if (absences <= 12) {
    fillBar.style.backgroundColor = '#f97316'; 
    fillBar.style.boxShadow = '0 0 12px rgba(249, 115, 22, 0.4)';
    statusMsg.innerText = "Critical Danger";
    statusMsg.style.color = '#f97316';
  } else {
    fillBar.style.backgroundColor = '#ef4444'; 
    fillBar.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.4)';
    statusMsg.innerText = "Limit Exceeded!";
    statusMsg.style.color = '#ef4444';
  }
}

// --- 5. AUTO-UPDATING ---
let timeout;
const observer = new MutationObserver(() => {
  clearTimeout(timeout);
  timeout = setTimeout(runScanner, 500); 
});

observer.observe(document.body, { childList: true, subtree: true });
setTimeout(runScanner, 1000); // Initial run
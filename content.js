// --- 1. THE TOGGLE LISTENER & STATE SYNC ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const widget = document.getElementById('iba-attendance-widget');
  if (!widget) return;

  if (request.action === "getState") {
    sendResponse({
      isVisible: widget.style.display !== 'none',
      isLight: widget.classList.contains('light')
    });
    return true; 
  }

  if (request.action === "toggleVisibility") {
    widget.style.display = (widget.style.display === 'none' ? 'flex' : 'none');
  } else if (request.action === "toggleTheme") {
    widget.classList.toggle('light');
  }
});

// --- 2. UI INJECTION FUNCTION ---
function injectUI() {
  if (document.getElementById('iba-attendance-widget')) return; 

  const widget = document.createElement('div');
  widget.id = 'iba-attendance-widget';
  
  widget.innerHTML = `
    <div class="iba-header" title="Drag to move" style="position: relative;">
      <button id="iba-share-btn" style="position: absolute; top: 15px; right: 15px; background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 5px 12px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s; cursor: pointer; z-index: 10; font-family: inherit;" onmouseover="this.style.background='rgba(16, 185, 129, 0.3)'" onmouseout="this.style.background='rgba(16, 185, 129, 0.15)'">Share ↗</button>
      
      <div style="display: flex; flex-direction: column; padding-right: 75px; overflow: hidden;">
        <span id="iba-student-name" style="font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text, #f8fafc) !important;">Loading...</span>
        <span id="iba-student-meta" style="font-size: 9.5px; color: #94a3b8; font-weight: 600; margin-top: 4px; letter-spacing: 0.5px; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Syncing Profile...</span>
      </div>
      
      <div id="iba-subject-name" style="margin-top: 14px; font-size: 18px; font-weight: 700; line-height: 1.3; color: var(--text, #f8fafc) !important;">Syncing All Subjects...</div>
    </div>
    <div class="iba-body">
      <div id="iba-loading-bar-container">
        <div id="iba-loading-bar"></div>
      </div>
      <div id="iba-subject-list"></div>
    </div>
    <div style="text-align: center; padding: 12px 15px; font-size: 10px; color: #64748b; font-weight: 500; letter-spacing: 0.5px; border-top: 1px dashed rgba(255,255,255,0.05); background: rgba(0,0,0,0.1); flex-shrink: 0;">
      Created by <a href="https://www.linkedin.com/in/sohail-ahmed-3aab5b377/" target="_blank" style="color: #10b981; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='#34d399'" onmouseout="this.style.color='#10b981'">SOHAIL AHMED</a> for SIBAU Students
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #iba-attendance-widget * { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    
    /* WIDGET WIDENED TO 420PX TO FIT THE CMS ID */
    #iba-attendance-widget {
      position: fixed; bottom: 40px; right: 40px; width: 420px;
      background: var(--bg, rgba(15, 23, 42, 0.95));
      backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      color: var(--text, #f8fafc); border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1);
      z-index: 999999; border: 1px solid var(--border, rgba(255,255,255,0.08));
      transition: background 0.2s ease, color 0.2s ease;
      resize: both; overflow: hidden; min-width: 350px; min-height: 200px; max-height: 80vh; display: flex; flex-direction: column;
    }
    #iba-attendance-widget.light { --bg: #ffffff; --text: #1e293b; --border: #e2e8f0; }
    .iba-header { background: rgba(128, 128, 128, 0.1); padding: 20px; border-bottom: 1px solid var(--border, rgba(255,255,255,0.05)); cursor: grab; user-select: none; flex-shrink: 0; }
    .iba-header:active { cursor: grabbing; }
    .iba-body { padding: 0; overflow-y: auto; flex-grow: 1; display: flex; flex-direction: column; }
    #iba-loading-bar-container { width: 100%; height: 4px; background: rgba(128,128,128,0.1); }
    #iba-loading-bar { height: 100%; width: 0%; background: #10b981; transition: width 0.3s ease; box-shadow: 0 0 10px rgba(16, 185, 129, 0.5); }
    #iba-subject-list { padding: 15px; display: flex; flex-direction: column; gap: 10px; }
    .iba-subject-card { background: rgba(128, 128, 128, 0.05); border: 1px solid var(--border, rgba(255,255,255,0.05)); border-radius: 12px; padding: 15px; display: flex; flex-direction: column; gap: 8px; }
    .iba-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .iba-card-title { font-size: 13px; font-weight: 600; color: var(--text, #f8fafc) !important; line-height: 1.4; flex-grow: 1; }
    .iba-card-absences { font-size: 18px; font-weight: 800; }
    .iba-card-footer { display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 500; }
    .iba-bunk-calc { background: rgba(128, 128, 128, 0.1); padding: 4px 10px; border-radius: 20px; }
    .iba-body::-webkit-scrollbar { width: 6px; }
    .iba-body::-webkit-scrollbar-track { background: transparent; }
    .iba-body::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.3); border-radius: 10px; }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(widget);

  const header = widget.querySelector('.iba-header');
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  header.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    if (e.target.id === 'iba-share-btn') return;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    const rect = widget.getBoundingClientRect();
    widget.style.left = rect.left + 'px';
    widget.style.top = rect.top + 'px';
    widget.style.bottom = 'auto';
    widget.style.right = 'auto';
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }
  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    widget.style.top = (widget.offsetTop - pos2) + "px";
    widget.style.left = (widget.offsetLeft - pos1) + "px";
  }
  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }

  // THE SHARE API LOGIC
  const shareBtn = widget.querySelector('#iba-share-btn'); 
  if (shareBtn) {
      shareBtn.addEventListener('click', async (e) => {
          e.preventDefault(); 
          const storeUrl = 'https://chromewebstore.google.com/detail/iba-attendance-pro/PENDING';
          const shareData = { title: 'IBA Attendance Pro', text: 'Check out this tool to automatically calculate safe skips on the university CMS.', url: storeUrl };
          const originalText = shareBtn.innerText;
          shareBtn.innerText = '...';

          try {
              if (navigator.share && window.isSecureContext) {
                  await navigator.share(shareData);
                  shareBtn.innerText = 'Shared!';
              } else {
                  const tempInput = document.createElement('input');
                  tempInput.value = storeUrl;
                  document.body.appendChild(tempInput);
                  tempInput.select();
                  document.execCommand('copy'); 
                  document.body.removeChild(tempInput);
                  shareBtn.innerText = 'Copied!';
                  shareBtn.style.background = 'rgba(16, 185, 129, 0.4)';
              }
          } catch (err) {
              shareBtn.innerText = 'Copied!';
          }
          setTimeout(() => {
              shareBtn.innerText = originalText;
              shareBtn.style.background = 'rgba(16, 185, 129, 0.15)';
          }, 2000);
      });
  }
}

// --- 3. THE SILENT BACKGROUND HUNTER ---
async function silentHuntForCmsId(studentName) {
    const stored = await chrome.storage.local.get(['studentProfiles']);
    let profiles = stored.studentProfiles || {};

    if (profiles[studentName]) return profiles[studentName]; 

    let match = document.body.innerText.match(/\b\d{3}-\d{2}-\d{4}\b/);
    if (match) {
        profiles[studentName] = match[0];
        chrome.storage.local.set({ studentProfiles: profiles });
        return match[0];
    }

    const personalInfoTab = Array.from(document.querySelectorAll('a')).find(el => el.innerText.includes('Personal Information'));
    if (personalInfoTab && personalInfoTab.href) {
        try {
            const response = await fetch(personalInfoTab.href);
            const htmlText = await response.text();
            match = htmlText.match(/\b\d{3}-\d{2}-\d{4}\b/);
            if (match) {
                profiles[studentName] = match[0];
                chrome.storage.local.set({ studentProfiles: profiles });
                return match[0];
            }
        } catch (e) { console.log("Silent hunt failed."); }
    }
    return null;
}

// --- 4. BACKGROUND SCRAPING LOGIC ---
async function scrapeAllSubjects(select, submitBtn) {
  let currentStudentName = "Student";
  const nameElement = Array.from(document.querySelectorAll('span, div')).find(el => el.innerText.includes('Logout') && el.innerText.includes(','));
  if (nameElement) {
    // 1. Grab everything before the comma
    let rawText = nameElement.innerText.split(',')[0].trim();
    // 2. Split it by newlines and grab ONLY the very last line (your actual name)
    let textLines = rawText.split(/\r?\n/);
    currentStudentName = textLines[textLines.length - 1].trim();
    
    document.getElementById('iba-student-name').innerText = currentStudentName;
  }

  const semesterDropdown = document.querySelector('select[id*="Dpsemester" i], select[name*="Dpsemester" i]');
  let activeSemesterText = "Current Semester";
  
  if (semesterDropdown && semesterDropdown.selectedIndex >= 0) {
      activeSemesterText = semesterDropdown.options[semesterDropdown.selectedIndex].text.trim();
  }
  
  const semesterMatch = activeSemesterText.match(/(Spring|Fall)\s+(\d{4})/i);

  silentHuntForCmsId(currentStudentName).then(cmsId => {
      const metaText = document.getElementById('iba-student-meta');
      
      if (cmsId) {
          const CMS_PROGRAM_MAP = {
              "013": { degree: "BBA" }, "123": { degree: "BS A&F" },
              "173": { degree: "BS Media" }, "093": { degree: "MBA (CS)" },
              "023": { degree: "BS Computer Science" }, "053": { degree: "BS Software Eng" },
              "133": { degree: "BE Computer Systems" }, "033": { degree: "BE Electrical" }
          };
          
          const progCode = cmsId.split('-')[0];
          const batchCode = cmsId.split('-')[1];
          const batchYear = 2000 + parseInt(batchCode, 10);
          
          const progInfo = CMS_PROGRAM_MAP[progCode];
          const degreeName = progInfo ? progInfo.degree : "Student";
          
          let semesterMeta = "";
          
          if (semesterMatch) {
              const season = semesterMatch[1];
              const termYear = parseInt(semesterMatch[2], 10);
              let semNum = (termYear - batchYear) * 2 + (season.toLowerCase() === 'fall' ? 1 : 0);
              const suffix = ["th", "st", "nd", "rd"][((semNum % 100) >= 11 && (semNum % 100) <= 13) ? 0 : (semNum % 10) < 4 ? (semNum % 10) : 0];
              semesterMeta = ` • ${semNum}${suffix} Sem`;
          }
          
          metaText.innerText = `${degreeName}${semesterMeta} • ${cmsId}`;
          metaText.title = `${degreeName}${semesterMeta} • ${cmsId}`;
      } else {
          metaText.innerText = "Profile Data Hidden"; 
      }
  });

  const viewState = document.getElementById('__VIEWSTATE') ? document.getElementById('__VIEWSTATE').value : '';
  const viewStateGenerator = document.getElementById('__VIEWSTATEGENERATOR') ? document.getElementById('__VIEWSTATEGENERATOR').value : '';
  const eventValidation = document.getElementById('__EVENTVALIDATION') ? document.getElementById('__EVENTVALIDATION').value : '';

  const options = Array.from(select.options).filter(opt => 
    !opt.text.includes('Select') && !opt.text.includes('Spring') && !opt.text.includes('Fall') && opt.value
  );

  const totalSubjects = options.length;
  const listContainer = document.getElementById('iba-subject-list');
  const loadingBar = document.getElementById('iba-loading-bar');
  
  listContainer.innerHTML = ''; 

  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    loadingBar.style.width = `${((i) / totalSubjects) * 100}%`;
    document.getElementById('iba-subject-name').innerText = `Syncing: ${i+1} of ${totalSubjects}`;

    try {
      const formData = new URLSearchParams();
      formData.append('__VIEWSTATE', viewState);
      formData.append('__VIEWSTATEGENERATOR', viewStateGenerator);
      if(eventValidation) formData.append('__EVENTVALIDATION', eventValidation);
      formData.append(select.name, opt.value); 
      formData.append(submitBtn.name, submitBtn.value); 

      const response = await fetch(window.location.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      const htmlText = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      
      let totalAbsenceUnits = 0;
      const rows = doc.querySelectorAll('tr.rgRow, tr.rgAltRow');
      
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

      renderSubjectCard(opt.text.trim(), totalAbsenceUnits, listContainer);

    } catch (err) {
      renderSubjectCard(opt.text.trim(), "Error", listContainer);
    }
  }

  loadingBar.style.width = '100%';
  setTimeout(() => { document.getElementById('iba-loading-bar-container').style.display = 'none'; }, 500);
  
  document.getElementById('iba-subject-name').innerText = "Dashboard Synced";
  setTimeout(() => { 
      document.getElementById('iba-subject-name').innerText = `${activeSemesterText} Attendance`; 
  }, 1500);
}

// --- 5. RENDER DASHBOARD CARDS ---
function renderSubjectCard(subjectName, absences, container) {
  let color = '#94a3b8'; 
  let safeSkipsText = "Data Error";
  let textColor = '#e2e8f0';

  if (typeof absences === 'number') {
    let safeSkips = 12 - absences;
    if (safeSkips < 0) safeSkips = 0;
    safeSkipsText = `${safeSkips} safe skips left`;

    if (absences <= 6) { color = '#10b981'; textColor = '#10b981'; } 
    else if (absences <= 9) { color = '#fbbf24'; textColor = '#fbbf24'; } 
    else if (absences <= 12) { color = '#f97316'; textColor = '#f97316'; } 
    else { color = '#ef4444'; textColor = '#ef4444'; safeSkipsText = "Limit Exceeded!"; } 
  }

  const card = document.createElement('div');
  card.className = 'iba-subject-card';
  card.innerHTML = `
    <div class="iba-card-header">
      <div class="iba-card-title">${subjectName}</div>
      <div class="iba-card-absences" style="color: ${color}; text-shadow: 0 0 10px ${color}40;">
        ${absences}${typeof absences === 'number' ? '<span style="font-size: 12px; color: #64748b; font-weight: 500;">/12</span>' : ''}
      </div>
    </div>
    <div class="iba-card-footer">
      <div class="iba-bunk-calc" style="color: ${textColor}; border: 1px solid ${color}30;">
        ${safeSkipsText}
      </div>
    </div>
  `;
  container.appendChild(card);
}

// --- 6. THE PATIENT INITIALIZER ---
const initInterval = setInterval(() => {
  if (!window.location.href.toLowerCase().includes('attendance')) return; 

  const select = document.querySelector('select[id*="Dpcmscourses" i], select[name*="Dpcmscourses" i]');
  const submitBtn = document.querySelector('input[value*="ATTENDANCE" i], input[id*="Button1" i], input[type="submit"]');

  if (select && submitBtn) {
    clearInterval(initInterval); 
    injectUI(); 
    scrapeAllSubjects(select, submitBtn);
  }
}, 1000);
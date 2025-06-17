// popup.js: Display AWS Account ID in the popup

if (!chrome || !chrome.storage || !chrome.storage.local) {
  document.body.innerHTML = '<div style="color:red;">Error: chrome.storage.local is not available. Please make sure you are running this as a Chrome extension popup.</div>';
  throw new Error('chrome.storage.local is not available');
}

function getSeverityColor(severity) {
  switch (severity) {
    case 'danger': return '#e53935';
    case 'warn': return '#fbc02d';
    case 'info': return '#1976d2';
    case 'none':
    default: return '';
  }
}

function findAccountIdFromUrl(url) {
  // Extract the AWS Account ID from the subdomain (numbers before the first dash)
  const match = url.match(/^https:\/\/(\d+)-/);
  return match ? match[1] : null;
}

function findAccountId() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0].url;
      const accountId = findAccountIdFromUrl(url);
      resolve(accountId);
    });
  });
}

function parseMappings(text) {
  const lines = text.split('\n');
  const map = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [acc, name] = trimmed.split(',').map(s => s.trim());
    if (acc && name) map[acc] = name;
  }
  return map;
}

function renderMappingsTable(mappingsObj) {
  const containerId = 'mappingsTableContainer';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    // Move the table inside the settings section
    const settingsSection = document.getElementById('settingsSection');
    settingsSection.appendChild(container);
  }
  let html = '<table style="width:100%;font-size:12px;margin-top:10px;"><tr><th>Account #</th><th>Name</th><th>Severity</th></tr>';
  for (const acc in mappingsObj) {
    const sev = mappingsObj[acc].severity || 'none';
    const color = getSeverityColor (sev);
    html += `<tr><td>${acc}</td><td>${mappingsObj[acc].name}</td><td><span style="color:${color};font-size:1.2em;vertical-align:middle;">&bull;</span> ${sev}</td></tr>`;
  }
  html += '</table>';
  container.innerHTML = html;
}

function saveMappings() {
  const textarea = document.getElementById('accountMappings');
  const value = textarea.value;
  const lines = value.split('\n');
  const obj = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [acc, name, severityRaw] = trimmed.split(',').map(s => s.trim());
    if (acc && name) {
      let severity = (severityRaw || 'none').toLowerCase();
      if (!['none', 'info', 'warn', 'danger'].includes(severity)) severity = 'none';
      obj[acc] = {
        name: name,
        severity: severity
      };
    }
  }
  chrome.storage.local.set({ awsAccountMappingsObj: obj }, () => {
    document.getElementById('saveStatus').textContent = 'Saved!';
    setTimeout(() => document.getElementById('saveStatus').textContent = '', 1500);
    renderMappingsTable(obj);
    // Update account name in popup after saving
    findAccountId().then(accountId => {
      const accountNameElem = document.getElementById('accountName');
      const account = obj[accountId];
      accountNameElem.textContent = account ? account.name : 'Unknown';
    });
  });
}

function loadMappings(callback) {
  chrome.storage.local.get(['awsAccountMappingsObj'], (result) => {
    callback(result.awsAccountMappingsObj || {});
  });
}

function getAccountName(accountId, mappingsText) {
  const lines = mappingsText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [acc, name] = trimmed.split(',').map(s => s.trim());
    if (acc === accountId) return name || '';
  }
  return 'Unknown';
}

document.addEventListener('DOMContentLoaded', async () => {
  const accountNameElem = document.getElementById('accountName');
  const mappingsTextarea = document.getElementById('accountMappings');
  const saveBtn = document.getElementById('saveMappings');
  let settingsOpen = false;
  const toggleBtn = document.getElementById('toggleSettings');
  const settingsSection = document.getElementById('settingsSection');

  

  function updateAccountCount(mappingsObj) {
    const count = Object.keys(mappingsObj).length;
    let accountCountElem = document.getElementById('accountCount');
    accountCountElem.textContent = `${count} account${count === 1 ? '' : 's'} configured`;
  }

  // Load and render mappings in textarea and table
  loadMappings((mappingsObj) => {
    mappingsTextarea.value = Object.entries(mappingsObj)
      .map(([acc, v]) => `${acc}, ${v.name}, ${v.severity}`)
      .join('\n');
    renderMappingsTable(mappingsObj);
    updateAccountCount(mappingsObj);
  });

  saveBtn.onclick = () => {
    saveMappings();
    loadMappings(updateAccountCount);
  };

  function setSettingsIcon(open) {
    const icon = document.getElementById('settingsIcon');
    if (!icon) return;
    if (open) {
      icon.outerHTML = `<svg id="settingsIcon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="#232f3e" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="#232f3e" stroke-width="2" stroke-linecap="round"/></svg>`;
    } else {
      icon.outerHTML = `<svg id="settingsIcon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 45.973 45.973" fill="none"><g><g><path d="M43.454,18.443h-2.437c-0.453-1.766-1.16-3.42-2.082-4.933l1.752-1.756c0.473-0.473,0.733-1.104,0.733-1.774 c0-0.669-0.262-1.301-0.733-1.773l-2.92-2.917c-0.947-0.948-2.602-0.947-3.545-0.001l-1.826,1.815 C30.9,6.232,29.296,5.56,27.529,5.128V2.52c0-1.383-1.105-2.52-2.488-2.52h-4.128c-1.383,0-2.471,1.137-2.471,2.52v2.607 c-1.766,0.431-3.38,1.104-4.878,1.977l-1.825-1.815c-0.946-0.948-2.602-0.947-3.551-0.001L5.27,8.205 C4.802,8.672,4.535,9.318,4.535,9.978c0,0.669,0.259,1.299,0.733,1.772l1.752,1.76c-0.921,1.513-1.629,3.167-2.081,4.933H2.501 C1.117,18.443,0,19.555,0,20.935v4.125c0,1.384,1.117,2.471,2.501,2.471h2.438c0.452,1.766,1.159,3.43,2.079,4.943l-1.752,1.763 c-0.474,0.473-0.734,1.106-0.734,1.776s0.261,1.303,0.734,1.776l2.92,2.919c0.474,0.473,1.103,0.733,1.772,0.733 s1.299-0.261,1.773-0.733l1.833-1.816c1.498,0.873,3.112,1.545,4.878,1.978v2.604c0,1.383,1.088,2.498,2.471,2.498h4.128 c1.383,0,2.488-1.115,2.488-2.498v-2.605c1.767-0.432,3.371-1.104,4.869-1.977l1.817,1.812c0.474,0.475,1.104,0.735,1.775,0.735 c0.67,0,1.301-0.261,1.774-0.733l2.92-2.917c0.473-0.472,0.732-1.103,0.734-1.772c0-0.67-0.262-1.299-0.734-1.773l-1.75-1.77 c0.92-1.514,1.627-3.179,2.08-4.943h2.438c1.383,0,2.52-1.087,2.52-2.471v-4.125C45.973,19.555,44.837,18.443,43.454,18.443z M22.976,30.85c-4.378,0-7.928-3.517-7.928-7.852c0-4.338,3.55-7.85,7.928-7.85c4.379,0,7.931,3.512,7.931,7.85 C30.906,27.334,27.355,30.85,22.976,30.85z" fill="#232f3e"/></g></g></svg>`;
    }
  }

  toggleBtn.onclick = () => {
    settingsOpen = !settingsOpen;
    settingsSection.style.display = settingsOpen ? 'block' : 'none';
    setSettingsIcon(settingsOpen);
    loadMappings(updateAccountCount);
  };

  // Only set the account name after both accountId and mappings are loaded
  const accountId = await findAccountId();
  loadMappings((mappingsObj) => {
    const account = mappingsObj[accountId];
    if (account) {
      const color = getSeverityColor(account.severity || 'none');
      accountNameElem.innerHTML = `<span style="color:${color};font-size:1.2em;vertical-align:middle;">&bull;</span> ${account.name}`;
    } else {
      accountNameElem.textContent = 'Unknown';
    }
  });
});

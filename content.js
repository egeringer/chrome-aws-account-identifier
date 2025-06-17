// This script will run in the context of AWS Console pages
// It will try to extract the AWS Account ID and display it clearly on the page

console.log('AWS Account Identifier: content.js loaded');

(function() {
  function findAccountId() {
    // Extract the AWS Account ID from the subdomain (numbers before the first dash)
    const match = window.location.hostname.match(/^(\d+)-/);
    return match ? match[1] : null;
  }

  function getAccountNameAndSeverity(accountId, mappingsObj) {
    if (mappingsObj[accountId]) {
      return {
        name: mappingsObj[accountId].name,
        severity: mappingsObj[accountId].severity || 'none'
      };
    }
    return { name: 'Unknown', severity: 'none' };
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

  function setNavColorBySeverity(severity) {
    const navLink = document.getElementById('nav-home-link');
    const awsServicesButton = document.querySelector('[data-testid="aws-services-list-button"]');
    //if (severity === 'none') return;
    const color = getSeverityColor(severity);
    if (navLink){
      navLink.style.backgroundColor = color;
    }
    if (awsServicesButton) {
      awsServicesButton.style.backgroundColor = color;
    }
    console.log('AWS Account Identifier: Set nav to', severity, getSeverityColor(severity));
  }

  function updateWithMappings(mappingsObj) {
    const accountId = findAccountId();
    const account = getAccountNameAndSeverity(accountId, mappingsObj);
    setNavColorBySeverity(account.severity);
    console.log('AWS Account Identifier:', {accountId, account});
  }

  function runUpdate() {
    chrome.storage.local.get(['awsAccountMappingsObj'], (result) => {
      updateWithMappings(result.awsAccountMappingsObj || {});
    });
  }

  setInterval(runUpdate, 2000);
  runUpdate();
})();

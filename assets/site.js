const menu = document.querySelector('.menu');
const mobileNav = document.getElementById('mobile-nav');
if (menu && mobileNav) {
  menu.addEventListener('click', () => {
    const isOpen = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!isOpen));
    menu.textContent = isOpen ? 'Menu' : 'Close';
    mobileNav.hidden = isOpen;
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    mobileNav.hidden = true;
    menu.setAttribute('aria-expanded', 'false');
    menu.textContent = 'Menu';
  }));
}
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const dropdowns = Array.from(document.querySelectorAll('.nav-dropdown'));
dropdowns.forEach(dropdown => dropdown.addEventListener('toggle', () => {
  if (dropdown.open) dropdowns.forEach(other => { if (other !== dropdown) other.open = false; });
}));
document.addEventListener('click', event => {
  dropdowns.forEach(dropdown => { if (!dropdown.contains(event.target)) dropdown.open = false; });
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    const openDropdown = dropdowns.find(dropdown => dropdown.open);
    if (openDropdown) { openDropdown.open = false; openDropdown.querySelector('summary').focus(); }
    if (menu && mobileNav && !mobileNav.hidden) { mobileNav.hidden = true; menu.setAttribute('aria-expanded', 'false'); menu.textContent = 'Menu'; menu.focus(); }
  }
});
window.matchMedia('(min-width: 1001px)').addEventListener('change', event => {
  if (event.matches && menu && mobileNav) { mobileNav.hidden = true; menu.setAttribute('aria-expanded', 'false'); menu.textContent = 'Menu'; }
});

'use strict';
function connectBaseline(numbers) {
  if (!Number.isInteger(numbers) || numbers < 1 || numbers > 100) return null;
  return numbers * 2500;
}
function developerBudget(rate, hours, months) {
  if (!Number.isFinite(rate) || rate <= 0 || rate > 100000 || !Number.isInteger(hours) || hours < 1 || hours > 744 || !Number.isInteger(months) || months < 1 || months > 120) return null;
  return { monthly: Math.round(rate * hours * 100) / 100, total: Math.round(rate * hours * months * 100) / 100 };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { connectBaseline, developerBudget };
if (typeof document !== 'undefined') {
  const money = value => 'R' + new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 2 }).format(value);
  const cf = document.getElementById('connect-form');
  if (cf) {
    const update = () => {
      const count = Number(document.getElementById('numbers').value);
      const baseline = connectBaseline(count);
      document.getElementById('connect-result').textContent = baseline === null ? 'Enter a valid number' : 'From ' + money(baseline);
      document.getElementById('connect-error').textContent = baseline === null ? 'Enter a whole number from 1 to 100.' : '';
      document.getElementById('connect-quote').href = '/contact/?intent=pricing&product=connect' + (baseline === null ? '' : '&numbers=' + count);
    };
    cf.addEventListener('submit', event => { event.preventDefault(); update(); });
    cf.addEventListener('input', update);
  }
  const df = document.getElementById('developer-form');
  if (df) {
    const update = () => {
      const rate = Number(document.getElementById('rate').value), hours = Number(document.getElementById('hours').value), months = Number(document.getElementById('months').value);
      const budget = developerBudget(rate, hours, months);
      document.getElementById('developer-result').textContent = budget ? money(budget.total) : 'Enter valid planning values';
      document.getElementById('developer-breakdown').textContent = budget ? money(budget.monthly) + ' per month × ' + months + ' months. Based on your entered rate of ' + money(rate) + ' per hour and ' + hours + ' hours per month. Excl. VAT; this is a planning calculation, not a CWARE quote.' : 'Use a positive hourly rate, 1–744 whole hours and 1–120 whole months. The rate must come from your quote or your own assumption.';
    };
    df.addEventListener('submit', event => { event.preventDefault(); update(); });
    df.addEventListener('input', update);
  }
  const form = document.getElementById('brief-form');
  if (form) {
    const params = new URLSearchParams(location.search);
    for (const field of ['intent', 'product']) {
      const select = document.getElementById(field), value = params.get(field);
      if (value && Array.from(select.options).some(option => option.value === value)) select.value = value;
    }
    const numberCount = Number(params.get('numbers'));
    const numberLine = params.has('numbers') && connectBaseline(numberCount) !== null ? 'WhatsApp numbers: ' + numberCount : '';
    let currentBrief = '';
    const update = () => {
      const intent = document.getElementById('intent'), product = document.getElementById('product');
      const business = document.getElementById('business').value.trim(), goal = document.getElementById('goal').value.trim(), systems = document.getElementById('systems').value.trim(), timing = document.getElementById('timing').value;
      currentBrief = ['Hello CWARE,', '', 'Request: ' + intent.selectedOptions[0].text, 'Topic: ' + product.selectedOptions[0].text, business ? 'Company / team: ' + business : '', numberLine, goal ? 'Goal: ' + goal : '', systems ? 'Systems: ' + systems : '', 'Timing: ' + timing, '', 'Please contact me to agree the next step.'].filter((line, i, lines) => line || (i && lines[i - 1] && i !== lines.length - 1)).join('\n');
      document.getElementById('brief-summary').textContent = currentBrief;
      document.getElementById('email-brief').href = 'mailto:info@cware.co.za?subject=' + encodeURIComponent('CWARE enquiry: ' + product.selectedOptions[0].text) + '&body=' + encodeURIComponent(currentBrief);
      document.getElementById('whatsapp-brief').href = 'https://wa.me/27833569223?text=' + encodeURIComponent(currentBrief);
      document.getElementById('brief-status').textContent = '';
    };
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', event => event.preventDefault());
    document.getElementById('copy-brief').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(currentBrief); document.getElementById('brief-status').textContent = 'Brief copied.'; }
      catch { document.getElementById('brief-status').textContent = 'Copy is unavailable. Select the summary text to copy it, or open an email draft.'; }
    });
    update();
  }
  // Emits intent only. No analytics provider or external collection is installed.
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    const channel = href.startsWith('mailto:') ? 'email' : href.startsWith('tel:') ? 'phone' : href.startsWith('https://wa.me/') ? 'whatsapp' : null;
    if (!channel) return;
    window.dispatchEvent(new CustomEvent('cware:enquiry_intent', { detail: { channel, page: location.pathname } }));
  });
}

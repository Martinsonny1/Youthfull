// Shared behaviour: nav, WhatsApp links, brand text, and the application form.
(function () {
  'use strict';
  const C = window.AGENCY || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const wa = (text) => `https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent(text || 'Hello, I would like to know more about Meet GH Introductions.')}`;

  // Mobile menu
  const mb = $('.menu-btn'), nav = $('.nav');
  if (mb && nav) mb.addEventListener('click', () => {
    const o = nav.classList.toggle('open');
    mb.setAttribute('aria-expanded', o);
  });

  // Fill in brand + WhatsApp links + age numbers wherever they appear
  $$('[data-brand]').forEach((el) => (el.textContent = C.BRAND));
  $$('[data-wa]').forEach((el) => (el.href = wa(el.getAttribute('data-wa'))));
  $$('[data-woman-min]').forEach((el) => (el.textContent = C.WOMAN_MIN_AGE));
  $$('[data-man-min]').forEach((el) => (el.textContent = C.MAN_MIN_AGE));
  $$('[data-man-max]').forEach((el) => (el.textContent = C.MAN_MAX_AGE));
  $$('[data-email]').forEach((el) => {
    if (C.EMAIL) { el.href = 'mailto:' + C.EMAIL; el.textContent = C.EMAIL; } else el.remove();
  });
  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  // ---------- Application form ----------
  const form = $('#apply-form');
  if (!form) return;
  let role = 'woman';
  const errEl = $('#form-err');
  const showErr = (m) => { errEl.textContent = m; errEl.classList.add('show'); errEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  const hideErr = () => errEl && errEl.classList.remove('show');
  const tabs = $$('.tab');
  const setRole = (r) => {
    role = r;
    tabs.forEach((t) => t.setAttribute('aria-selected', t.dataset.role === r));
    $$('[data-only]').forEach((el) => {
      const on = el.dataset.only === r;
      el.style.display = on ? '' : 'none';
      $$('input,select,textarea', el).forEach((i) => (i.disabled = !on));
    });
    $('#dob-hint').textContent = `You must be ${C.WOMAN_MIN_AGE} or older.`;
    hideErr();
  };
  tabs.forEach((t) => t.addEventListener('click', () => setRole(t.dataset.role)));
  const q = new URLSearchParams(location.search).get('role');
  setRole('woman');

  const ageOf = (iso) => {
    const d = new Date(iso + 'T00:00:00'); if (isNaN(d)) return null;
    const n = new Date(); let a = n.getFullYear() - d.getFullYear();
    if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
    return a;
  };
  const normPhone = (p) => {
    let d = (p || '').replace(/[^\d+]/g, '');
    if (d.startsWith('+')) d = d.slice(1);
    else if (d.startsWith('0')) d = '233' + d.slice(1);
    return d;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); hideErr();
    const f = new FormData(form);
    if (f.get('website')) return; // honeypot
    const dob = f.get('dob'), age = ageOf(dob);
    if (age === null) return showErr('Please enter your date of birth.');
    if (role === 'woman' && age < C.WOMAN_MIN_AGE) return showErr(`Sorry, this service is for women aged ${C.WOMAN_MIN_AGE} and above.`);
    const phone = normPhone(f.get('phone'));
    if (phone.length < 11 || phone.length > 15) return showErr('Please enter a valid WhatsApp number, for example 024 123 4567.');
    if (!f.get('consent')) return showErr('Please tick the box to confirm and consent.');

    const rec = {
      role,
      full_name: String(f.get('full_name') || '').trim(),
      phone,
      email: String(f.get('email') || '').trim() || null,
      dob,
      city: String(f.get('city') || '').trim(),
      goal: f.get('goal') || null,
      partner_age_min: role === 'woman' ? Number(f.get('partner_age_min')) || null : null,
      partner_age_max: role === 'woman' ? Number(f.get('partner_age_max')) || null : null,
      occupation: role === 'man' ? String(f.get('occupation') || '').trim() || null : null,
      about: String(f.get('about') || '').trim(),
      heard_from: f.get('heard_from') || null,
      consent: true
    };
    const btn = $('button[type=submit]', form); btn.disabled = true; const old = btn.textContent; btn.textContent = 'Sending…';
    let saved = false;
    try {
      const r = await fetch(C.SUPABASE_URL + '/rest/v1/applications', {
        method: 'POST',
        headers: { apikey: C.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(rec)
      });
      saved = r.ok;
    } catch (_) { saved = false; }

    form.style.display = 'none';
    const done = $('#done'); done.classList.add('show');
    const first = rec.full_name.split(' ')[0] || 'there';
    const msg = `Hello, this is ${rec.full_name}. I just applied on Meet GH Introductions as a ${role === 'woman' ? 'woman' : 'man'} in ${rec.city}.`;
    $('#done-wa').href = wa(msg);
    if (saved) {
      $('#done-title').textContent = `Thank you, ${first}.`;
      $('#done-text').textContent = 'Your application has been received. A member of our team will message you on WhatsApp, usually within 48 hours, to say hello and talk about the kind of man you\'d like to meet.';
    } else {
      $('#done-title').textContent = 'One more step, please';
      $('#done-text').textContent = 'We could not send your form just now. Please tap the WhatsApp button below. Your details are filled in, so just press send.';
      $('#done-wa').href = wa(`${msg} My details: ${rec.full_name}, born ${rec.dob}, ${rec.city}. WhatsApp ${rec.phone}.`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    btn.disabled = false; btn.textContent = old;
  });
})();

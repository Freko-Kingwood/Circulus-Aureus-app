const state = {
  currentUser: null,
  isAdmin: false,
  data: { events: [], members: [], messages: [], documents: [] },
  currentView: 'dashboard',
};

const authShell = document.getElementById('auth-shell');
const appShell = document.getElementById('app-shell');
const identityStatus = document.getElementById('identity-status');
const pageTitle = document.getElementById('page-title');
const rolePill = document.getElementById('role-pill');
const adminTab = document.getElementById('admin-tab');
const toast = document.getElementById('toast');
const miniName = document.getElementById('mini-name');
const miniEmail = document.getElementById('mini-email');
const miniAvatar = document.getElementById('mini-avatar');
const viewEls = {
  dashboard: document.getElementById('view-dashboard'),
  events: document.getElementById('view-events'),
  documents: document.getElementById('view-documents'),
  members: document.getElementById('view-members'),
  messages: document.getElementById('view-messages'),
  profile: document.getElementById('view-profile'),
  admin: document.getElementById('view-admin'),
};

function userInitials(user) {
  const raw = user?.user_metadata?.full_name || user?.email || 'CA';
  return raw.split(/\s|@|\./).filter(Boolean).slice(0,2).map(v => v[0]?.toUpperCase() || '').join('') || 'CA';
}

function prettyDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString('da-DK', { day: '2-digit', month: 'short', year: 'numeric' });
}

function prettyDateTime(dateString) {
  const d = new Date(dateString);
  return d.toLocaleString('da-DK', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatMonthShort(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString('da-DK', { month: 'short' }).toUpperCase();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.add('hidden'), 2800);
}

function setUserUI(user) {
  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Medlem';
  const email = user?.email || 'Ikke logget ind';
  miniName.textContent = name;
  miniEmail.textContent = email;
  miniAvatar.textContent = userInitials(user);
}

function activateView(viewName) {
  state.currentView = viewName;
  Object.entries(viewEls).forEach(([name, el]) => el.classList.toggle('active-view', name === viewName));
  document.querySelectorAll('.nav-item').forEach((btn) => btn.classList.toggle('active', btn.dataset.view === viewName));
  const names = {
    dashboard: 'Hjem', events: 'Begivenheder', documents: 'Referater', members: 'Medlemmer', messages: 'Beskeder', profile: 'Profil', admin: 'Admin'
  };
  pageTitle.textContent = names[viewName] || 'Circulus Aureus';
}

async function api(path, options = {}) {
  const user = window.netlifyIdentity?.currentUser();
  const token = user ? await user.jwt() : null;
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`/api/${path}`, { ...options, headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Fejl ${response.status}`);
  }
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  return response.text();
}

function renderDashboard() {
  const upcoming = [...state.data.events].sort((a,b) => new Date(a.date) - new Date(b.date))[0];
  const unanswered = state.data.events.filter((event) => {
    const response = event.responses?.find((item) => item.email === state.currentUser?.email);
    return !response;
  }).length;
  const latestDoc = [...state.data.documents].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  const latestMessage = [...state.data.messages].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  viewEls.dashboard.innerHTML = `
    <div class="hero glass">
      <div>
        <p class="eyebrow">Næste samling</p>
        <h2>${upcoming ? upcoming.title : 'Ingen kommende begivenhed endnu'}</h2>
        <p>${upcoming ? `${prettyDateTime(upcoming.date)} · ${upcoming.location || 'Sted ikke angivet'}${upcoming.dresscode ? ` · Dresscode: ${upcoming.dresscode}` : ''}` : 'Opret den første begivenhed i admin-panelet.'}</p>
        <div class="hero-actions">
          <button class="btn btn-primary" data-goto="events">Se begivenheder</button>
          <button class="btn btn-secondary" data-goto="documents">Se referater</button>
        </div>
      </div>
      <img src="assets/crest.jpeg" alt="Våbenskjold" class="hero-crest" />
    </div>

    <div class="grid three" style="margin-top:20px">
      <article class="card glass kpi"><strong>${state.data.members.length}</strong><p>Medlemmer</p></article>
      <article class="card glass kpi"><strong>${state.data.events.length}</strong><p>Begivenheder</p></article>
      <article class="card glass kpi"><strong>${unanswered}</strong><p>Mangler dit svar</p></article>
    </div>

    <div class="grid two" style="margin-top:20px">
      <article class="card glass">
        <p class="eyebrow">Seneste besked</p>
        <h3>${latestMessage?.title || 'Ingen beskeder endnu'}</h3>
        <p>${latestMessage?.body || 'Når admins poster opslag, vises de her.'}</p>
      </article>
      <article class="card glass">
        <p class="eyebrow">Seneste referat</p>
        <h3>${latestDoc?.title || 'Intet referat uploadet endnu'}</h3>
        <p>${latestDoc ? `${latestDoc.description || 'Dokument tilknyttet logens arkiv.'}` : 'Upload første referat i admin-panelet.'}</p>
      </article>
    </div>
  `;
}

function responseCounts(event) {
  const counts = { yes: 0, maybe: 0, no: 0 };
  (event.responses || []).forEach((r) => { if (counts[r.status] !== undefined) counts[r.status] += 1; });
  return counts;
}

function myResponse(event) {
  return (event.responses || []).find((r) => r.email === state.currentUser?.email);
}

function eventResponseChip(status) {
  if (status === 'yes') return '<span class="status-chip status-yes">Deltager</span>';
  if (status === 'maybe') return '<span class="status-chip status-maybe">Måske</span>';
  if (status === 'no') return '<span class="status-chip status-no">Deltager ikke</span>';
  return '<span class="status-chip">Ikke besvaret</span>';
}

function renderEvents() {
  const sorted = [...state.data.events].sort((a,b) => new Date(a.date) - new Date(b.date));
  viewEls.events.innerHTML = `
    <div class="section-head">
      <h2>Kommende og tidligere begivenheder</h2>
      <div class="pill">Svar: Ja / Måske / Nej</div>
    </div>
    <div class="stack">
      ${sorted.length ? sorted.map((event) => {
        const counts = responseCounts(event);
        const mine = myResponse(event);
        return `
          <article class="card glass event">
            <div class="event-date"><strong>${new Date(event.date).getDate().toString().padStart(2,'0')}</strong><span>${formatMonthShort(event.date)}</span></div>
            <div style="flex:1">
              <p class="eyebrow">${prettyDateTime(event.date)}</p>
              <h3>${event.title}</h3>
              <p>${event.description || ''}</p>
              <div class="chip-row">
                <span class="chip">${event.location || 'Sted mangler'}</span>
                ${event.dresscode ? `<span class="chip">${event.dresscode}</span>` : ''}
                ${event.deadline ? `<span class="chip">Svar senest ${prettyDate(event.deadline)}</span>` : ''}
              </div>
              <div class="chip-row">
                <span class="status-chip status-yes">Ja: ${counts.yes}</span>
                <span class="status-chip status-maybe">Måske: ${counts.maybe}</span>
                <span class="status-chip status-no">Nej: ${counts.no}</span>
                ${eventResponseChip(mine?.status)}
              </div>
              <div class="response-group">
                <button class="btn btn-primary btn-small" data-rsvp="yes" data-id="${event.id}">Ja</button>
                <button class="btn btn-secondary btn-small" data-rsvp="maybe" data-id="${event.id}">Måske</button>
                <button class="btn btn-danger btn-small" data-rsvp="no" data-id="${event.id}">Nej</button>
              </div>
              ${(event.responses || []).length ? `<p class="file-meta" style="margin-top:12px">Svar fra: ${(event.responses || []).map(r => r.name || r.email).join(', ')}</p>` : ''}
            </div>
          </article>
        `;
      }).join('') : '<div class="empty">Der er ingen begivenheder endnu.</div>'}
    </div>
  `;
}

function renderDocuments() {
  const docs = [...state.data.documents].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  viewEls.documents.innerHTML = `
    <div class="section-head">
      <h2>Referater og vedhæftninger</h2>
      <div class="pill">Arkiv</div>
    </div>
    <div class="table-list">
      ${docs.length ? docs.map((doc) => `
        <article class="card glass doc-row">
          <div style="flex:1">
            <p class="eyebrow">${doc.category || 'Dokument'}</p>
            <h3>${doc.title}</h3>
            <p>${doc.description || ''}</p>
            <div class="file-meta">${prettyDateTime(doc.createdAt)} · ${doc.fileName || 'Fil'} ${doc.eventTitle ? `· Knyttet til: ${doc.eventTitle}` : ''}</div>
          </div>
          <div class="inline-actions">
            <a class="btn btn-secondary btn-small" href="/api/download-document?id=${encodeURIComponent(doc.id)}" target="_blank" rel="noopener">Åbn</a>
            ${state.isAdmin ? `<button class="btn btn-danger btn-small" data-delete-doc="${doc.id}">Slet</button>` : ''}
          </div>
        </article>
      `).join('') : '<div class="empty">Ingen dokumenter eller referater endnu.</div>'}
    </div>
  `;
}

function renderMembers() {
  const members = [...state.data.members].sort((a,b) => (a.name || '').localeCompare(b.name || ''));
  viewEls.members.innerHTML = `
    <div class="section-head">
      <h2>Medlemskreds</h2>
      <div class="pill">${members.filter(m => m.active !== false).length} aktive</div>
    </div>
    <div class="table-list">
      ${members.length ? members.map((member) => `
        <article class="card glass member-row">
          <div style="display:flex;gap:16px;align-items:center;flex:1">
            <div class="avatar">${(member.name || member.email || 'M').trim()[0]?.toUpperCase() || 'M'}</div>
            <div>
              <h3>${member.name || 'Uden navn'}</h3>
              <p>${member.email || ''}</p>
              <div class="file-meta">${member.phone || 'Ingen telefon'} ${member.memberSince ? `· Medlem siden ${member.memberSince}` : ''} ${member.active === false ? '· Inaktiv' : ''}</div>
            </div>
          </div>
          ${state.isAdmin ? `<button class="btn btn-danger btn-small" data-delete-member="${member.id}">Fjern</button>` : ''}
        </article>
      `).join('') : '<div class="empty">Ingen medlemmer endnu.</div>'}
    </div>
  `;
}

function renderMessages() {
  const messages = [...state.data.messages].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  viewEls.messages.innerHTML = `
    <div class="section-head">
      <h2>Interne opslag</h2>
      <div class="pill">Kun for medlemmer</div>
    </div>
    <div class="stack">
      ${messages.length ? messages.map((message) => `
        <article class="card glass message">
          <div>
            <p class="eyebrow">${message.pinned ? 'Vigtig besked' : 'Opslag'}</p>
            <h3>${message.title}</h3>
            <p>${message.body}</p>
            <div class="file-meta">${prettyDateTime(message.createdAt)} · ${message.authorName || message.authorEmail || 'Admin'}</div>
          </div>
          ${state.isAdmin ? `<button class="btn btn-danger btn-small" data-delete-message="${message.id}">Slet</button>` : ''}
        </article>
      `).join('') : '<div class="empty">Ingen beskeder endnu.</div>'}
    </div>
  `;
}

function renderProfile() {
  const me = state.data.members.find((member) => member.email === state.currentUser?.email);
  viewEls.profile.innerHTML = `
    <div class="grid two">
      <article class="card glass member-card">
        <p class="eyebrow">Digitalt medlemskort</p>
        <h3>${me?.name || state.currentUser?.user_metadata?.full_name || state.currentUser?.email || 'Medlem'}</h3>
        <p>${state.currentUser?.email || ''}</p>
        <div class="chip-row">
          <span class="chip">${state.isAdmin ? 'Admin' : 'Medlem'}</span>
          ${me?.memberSince ? `<span class="chip">Siden ${me.memberSince}</span>` : ''}
          ${me?.phone ? `<span class="chip">${me.phone}</span>` : ''}
        </div>
      </article>
      <article class="card glass">
        <p class="eyebrow">Din konto</p>
        <h3>Login via Netlify Identity</h3>
        <p>Din adgang styres af Netlify Identity. Hvis du ændrer admin-rolle i Netlify, træder ændringen først i kraft efter ny login eller token refresh.</p>
        <hr class="sep" />
        <div class="chip-row">
          <span class="chip">E-mail: ${state.currentUser?.email || ''}</span>
          <span class="chip">Svar afgivet: ${state.data.events.filter((event) => myResponse(event)).length}</span>
        </div>
      </article>
    </div>
  `;
}

function renderAdmin() {
  if (!state.isAdmin) {
    viewEls.admin.innerHTML = '<div class="empty">Kun admins har adgang til dette område.</div>';
    return;
  }
  const eventOptions = state.data.events.map((event) => `<option value="${event.id}">${event.title}</option>`).join('');
  viewEls.admin.innerHTML = `
    <div class="admin-grid">
      <div class="stack">
        <article class="card glass">
          <div class="section-head"><h3>Ny begivenhed</h3><span class="badge-admin">Admin</span></div>
          <form id="event-form" class="form-grid">
            <div class="full"><label>Titel</label><input name="title" required type="text" /></div>
            <div><label>Dato</label><input name="date" required type="date" /></div>
            <div><label>Tidspunkt</label><input name="time" required type="time" /></div>
            <div><label>Sted</label><input name="location" type="text" /></div>
            <div><label>Dresscode</label><input name="dresscode" type="text" /></div>
            <div class="full"><label>Svarfrist</label><input name="deadline" type="date" /></div>
            <div class="full"><label>Beskrivelse</label><textarea name="description"></textarea></div>
            <div class="full"><button class="btn btn-primary" type="submit">Gem begivenhed</button></div>
          </form>
        </article>

        <article class="card glass">
          <div class="section-head"><h3>Upload referat / vedhæftning</h3><span class="badge-admin">Admin</span></div>
          <form id="document-form" class="form-grid">
            <div class="full"><label>Titel</label><input name="title" required type="text" /></div>
            <div><label>Kategori</label><select name="category"><option>Referat</option><option>Bilag</option><option>Vedtægter</option><option>Dokument</option></select></div>
            <div><label>Knyt til begivenhed</label><select name="eventId"><option value="">Ingen</option>${eventOptions}</select></div>
            <div class="full"><label>Beskrivelse</label><textarea name="description"></textarea></div>
            <div class="full"><label>Fil</label><input name="file" required type="file" /></div>
            <div class="full"><button class="btn btn-primary" type="submit">Upload fil</button></div>
          </form>
        </article>
      </div>

      <div class="stack">
        <article class="card glass">
          <div class="section-head"><h3>Tilføj medlem</h3><span class="badge-admin">Admin</span></div>
          <form id="member-form" class="form-grid">
            <div class="full"><label>Navn</label><input name="name" required type="text" /></div>
            <div><label>E-mail</label><input name="email" required type="email" /></div>
            <div><label>Telefon</label><input name="phone" type="text" /></div>
            <div class="full"><label>Medlem siden</label><input name="memberSince" type="text" placeholder="fx 2026" /></div>
            <div class="full"><button class="btn btn-primary" type="submit">Tilføj medlem</button></div>
          </form>
          <p class="file-meta" style="margin-top:12px">Dette opretter medlemmet i appens medlemsliste. Selve login-invitationen sendes fortsat fra Netlify Identity-panelet.</p>
        </article>

        <article class="card glass">
          <div class="section-head"><h3>Nyt opslag</h3><span class="badge-admin">Admin</span></div>
          <form id="message-form" class="form-grid">
            <div class="full"><label>Titel</label><input name="title" required type="text" /></div>
            <div class="full"><label>Besked</label><textarea name="body" required></textarea></div>
            <div class="full"><label><input name="pinned" type="checkbox" /> Fastgør som vigtig besked</label></div>
            <div class="full"><button class="btn btn-primary" type="submit">Udgiv opslag</button></div>
          </form>
        </article>
      </div>
    </div>
  `;
}

function renderAll() {
  renderDashboard();
  renderEvents();
  renderDocuments();
  renderMembers();
  renderMessages();
  renderProfile();
  renderAdmin();
  bindViewActions();
}

function bindViewActions() {
  document.querySelectorAll('[data-goto]').forEach((btn) => btn.onclick = () => activateView(btn.dataset.goto));
  document.querySelectorAll('[data-rsvp]').forEach((btn) => {
    btn.onclick = async () => {
      try {
        await api('rsvp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId: btn.dataset.id, status: btn.dataset.rsvp })
        });
        showToast('Dit svar er gemt');
        await loadData();
        activateView('events');
      } catch (error) { showToast(error.message); }
    };
  });

  document.querySelectorAll('[data-delete-doc]').forEach((btn) => btn.onclick = async () => {
    if (!confirm('Slette dokumentet?')) return;
    try {
      await api('admin-delete-document', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: btn.dataset.deleteDoc })
      });
      showToast('Dokument slettet');
      await loadData();
      activateView('documents');
    } catch (error) { showToast(error.message); }
  });

  document.querySelectorAll('[data-delete-member]').forEach((btn) => btn.onclick = async () => {
    if (!confirm('Fjerne medlemmet fra medlemslisten?')) return;
    try {
      await api('admin-delete-member', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: btn.dataset.deleteMember })
      });
      showToast('Medlem fjernet');
      await loadData();
      activateView('members');
    } catch (error) { showToast(error.message); }
  });

  document.querySelectorAll('[data-delete-message]').forEach((btn) => btn.onclick = async () => {
    if (!confirm('Slette opslaget?')) return;
    try {
      await api('admin-delete-message', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: btn.dataset.deleteMessage })
      });
      showToast('Opslag slettet');
      await loadData();
      activateView('messages');
    } catch (error) { showToast(error.message); }
  });

  document.getElementById('event-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await api('admin-save-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.get('title'),
          location: form.get('location'),
          dresscode: form.get('dresscode'),
          description: form.get('description'),
          deadline: form.get('deadline') || null,
          date: `${form.get('date')}T${form.get('time')}:00`,
        })
      });
      e.currentTarget.reset();
      showToast('Begivenhed oprettet');
      await loadData();
      activateView('events');
    } catch (error) { showToast(error.message); }
  });

  document.getElementById('document-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await api('upload-document', { method: 'POST', body: form });
      e.currentTarget.reset();
      showToast('Fil uploadet');
      await loadData();
      activateView('documents');
    } catch (error) { showToast(error.message); }
  });

  document.getElementById('member-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await api('admin-save-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          phone: form.get('phone'),
          memberSince: form.get('memberSince'),
        })
      });
      e.currentTarget.reset();
      showToast('Medlem tilføjet');
      await loadData();
      activateView('members');
    } catch (error) { showToast(error.message); }
  });

  document.getElementById('message-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      await api('admin-save-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.get('title'), body: form.get('body'), pinned: form.get('pinned') === 'on' })
      });
      e.currentTarget.reset();
      showToast('Opslag publiceret');
      await loadData();
      activateView('messages');
    } catch (error) { showToast(error.message); }
  });
}

async function loadData() {
  const payload = await api('list-data');
  state.data = payload.data;
  state.isAdmin = payload.currentUser.isAdmin;
  state.currentUser = window.netlifyIdentity.currentUser();
  adminTab.classList.toggle('hidden', !state.isAdmin);
  rolePill.textContent = state.isAdmin ? 'Admin' : 'Medlem';
  renderAll();
}

function showAuthenticated(user) {
  state.currentUser = user;
  setUserUI(user);
  authShell.classList.add('hidden');
  appShell.classList.remove('hidden');
  identityStatus.textContent = 'Godkendt adgang';
}

function showLoggedOut() {
  state.currentUser = null;
  authShell.classList.remove('hidden');
  appShell.classList.add('hidden');
  identityStatus.textContent = 'Afventer login';
  setUserUI(null);
}

document.querySelectorAll('.nav-item[data-view]').forEach((btn) => btn.addEventListener('click', () => activateView(btn.dataset.view)));
document.getElementById('open-login').addEventListener('click', () => window.netlifyIdentity?.open('login'));
document.getElementById('open-signup').addEventListener('click', () => window.netlifyIdentity?.open('signup'));
document.getElementById('logout-btn').addEventListener('click', () => window.netlifyIdentity?.logout());
document.getElementById('refresh-btn').addEventListener('click', async () => {
  try { await loadData(); showToast('Data opdateret'); } catch (error) { showToast(error.message); }
});

if (window.netlifyIdentity) {
  window.netlifyIdentity.on('init', async (user) => {
    if (!user) return showLoggedOut();
    showAuthenticated(user);
    try {
      await loadData();
      activateView('dashboard');
    } catch (error) {
      showToast(error.message);
    }
  });
  window.netlifyIdentity.on('login', async (user) => {
    showAuthenticated(user);
    window.netlifyIdentity.close();
    try {
      await loadData();
      activateView('dashboard');
    } catch (error) { showToast(error.message); }
  });
  window.netlifyIdentity.on('signup', () => {
    identityStatus.textContent = 'Tjek din e-mail for bekræftelse';
    window.netlifyIdentity.close();
  });
  window.netlifyIdentity.on('logout', () => showLoggedOut());
  window.netlifyIdentity.on('error', (error) => showToast(error.message || 'Identity-fejl'));
  window.netlifyIdentity.on('init', (user) => {
  if (user) {
    showAuthenticated(user);
    loadData();
    activateView('dashboard');
  } else {
    showLoggedOut();
  }
});
  window.netlifyIdentity.init();
}

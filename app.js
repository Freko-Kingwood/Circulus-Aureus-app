const state = {
  currentUser: null,
  isAdmin: false,
  data: { events: [], members: [], messages: [], documents: [], approvals: [] },
  currentView: 'dashboard'
};

const authShell = document.getElementById('auth-shell');
const appShell = document.getElementById('app-shell');
const identityStatus = document.getElementById('identity-status');
const pageTitle = document.getElementById('page-title');
const rolePill = document.getElementById('role-pill');
const adminTab = document.getElementById('admin-tab');
const adminMobileTab = document.getElementById('admin-mobile-tab');
const toast = document.getElementById('toast');
const miniName = document.getElementById('mini-name');
const miniEmail = document.getElementById('mini-email');
const miniAvatar = document.getElementById('mini-avatar');
const profileName = document.getElementById('profile-name');
const profileEmail = document.getElementById('profile-email');
const profileRole = document.getElementById('profile-role');
const requestBox = document.getElementById('request-box');

const viewEls = {
  dashboard: document.getElementById('view-dashboard'),
  events: document.getElementById('view-events'),
  documents: document.getElementById('view-documents'),
  members: document.getElementById('view-members'),
  messages: document.getElementById('view-messages'),
  profile: document.getElementById('view-profile'),
  admin: document.getElementById('view-admin')
};

const navButtons = [...document.querySelectorAll('.nav-item[data-view]')];
const adminEmails = ['frekopetersen1998@gmail.com'];

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3200);
}

function getInitials(text) {
  return (text || 'CA')
    .split(/\s|@|\./)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

async function fetchJSON(url, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (state.currentUser?.token?.access_token) {
    headers.Authorization = `Bearer ${state.currentUser.token.access_token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let msg = 'Ukendt fejl';
    try {
      const data = await res.json();
      msg = data.error || data.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

async function loadData() {
  const payload = await fetchJSON('/.netlify/functions/list-data');
  state.data = payload;
  renderAll();
}

function renderAll() {
  document.getElementById('stat-events').textContent = state.data.events.length;
  document.getElementById('stat-docs').textContent = state.data.documents.length;
  document.getElementById('stat-members').textContent = state.data.members.length;

  const eventsList = document.getElementById('events-list');
  eventsList.innerHTML = '';
  if (!state.data.events.length) {
    eventsList.innerHTML = '<article class="card glass"><p>Ingen begivenheder endnu.</p></article>';
  } else {
    state.data.events.forEach((event) => {
      const el = document.createElement('article');
      el.className = 'card glass';
      el.innerHTML = `
        <p class="eyebrow">${event.datetime || ''}</p>
        <h3>${event.title}</h3>
        <p>${event.location || ''}</p>
        <p>${event.description || ''}</p>
        <div class="event-actions">
          <button class="btn btn-primary" data-rsvp="${event.id}" data-answer="Ja" type="button">Ja</button>
          <button class="btn btn-secondary" data-rsvp="${event.id}" data-answer="Måske" type="button">Måske</button>
          <button class="btn btn-secondary" data-rsvp="${event.id}" data-answer="Nej" type="button">Nej</button>
          ${state.isAdmin ? `<button class="btn btn-secondary" data-delete-type="event" data-delete-id="${event.id}" type="button">Slet</button>` : ''}
        </div>
      `;
      eventsList.appendChild(el);
    });
  }

  const docsList = document.getElementById('documents-list');
  docsList.innerHTML = '';
  if (!state.data.documents.length) {
    docsList.innerHTML = '<article class="card glass"><p>Ingen dokumenter endnu.</p></article>';
  } else {
    state.data.documents.forEach((doc) => {
      const el = document.createElement('article');
      el.className = 'card glass';
      el.innerHTML = `
        <p class="eyebrow">${doc.createdAt || ''}</p>
        <h3>${doc.title}</h3>
        <p>${doc.note || ''}</p>
        <div class="event-actions">
          <button class="btn btn-secondary" data-download="${doc.id}" type="button">Download</button>
          ${state.isAdmin ? `<button class="btn btn-secondary" data-delete-type="document" data-delete-id="${doc.id}" type="button">Slet</button>` : ''}
        </div>
      `;
      docsList.appendChild(el);
    });
  }

  const membersList = document.getElementById('members-list');
  membersList.innerHTML = '';
  if (!state.data.members.length) {
    membersList.innerHTML = '<article class="card glass"><p>Ingen medlemmer endnu.</p></article>';
  } else {
    state.data.members.forEach((member) => {
      const el = document.createElement('article');
      el.className = 'card glass member';
      el.innerHTML = `
        <div class="avatar">${getInitials(member.name)}</div>
        <h3>${member.name}</h3>
        <p>${member.email || ''}</p>
        <p>${member.since ? 'Medlem siden ' + member.since : ''}</p>
        ${state.isAdmin ? `<button class="btn btn-secondary" data-delete-type="member" data-delete-id="${member.id}" type="button">Slet</button>` : ''}
      `;
      membersList.appendChild(el);
    });
  }

  const messagesList = document.getElementById('messages-list');
  messagesList.innerHTML = '';
  if (!state.data.messages.length) {
    messagesList.innerHTML = '<article class="card glass"><p>Ingen beskeder endnu.</p></article>';
  } else {
    state.data.messages.forEach((message) => {
      const el = document.createElement('article');
      el.className = 'card glass';
      el.innerHTML = `
        <p class="eyebrow">${message.createdAt || ''}</p>
        <h3>${message.title}</h3>
        <p>${message.body || ''}</p>
        ${state.isAdmin ? `<button class="btn btn-secondary" data-delete-type="message" data-delete-id="${message.id}" type="button">Slet</button>` : ''}
      `;
      messagesList.appendChild(el);
    });
  }

  const approvalsHost = document.getElementById('approval-list');
  if (approvalsHost) {
    approvalsHost.innerHTML = '';
    const pending = (state.data.approvals || []).filter((item) => item.status !== 'invited');

    if (!pending.length) {
      approvalsHost.innerHTML = '<article class="card glass"><p>Ingen afventende godkendelser.</p></article>';
    } else {
      pending.forEach((item) => {
        const el = document.createElement('article');
        el.className = 'card glass';
        el.innerHTML = `
          <p class="eyebrow">Afventende godkendelse</p>
          <h3>${item.name || 'Ukendt navn'}</h3>
          <p>${item.email}</p>
          <p>${item.note || ''}</p>
          <div class="event-actions">
            <button class="btn btn-primary" data-approve-email="${item.email}" type="button">Markér som inviteret</button>
            <button class="btn btn-secondary" data-copy-email="${item.email}" type="button">Kopiér e-mail</button>
            <button class="btn btn-secondary" data-reject-email="${item.email}" type="button">Afvis</button>
          </div>
        `;
        approvalsHost.appendChild(el);
      });
    }
  }
}

function activateView(viewName) {
  state.currentView = viewName;

  Object.entries(viewEls).forEach(([name, el]) => {
    if (el) el.classList.toggle('active-view', name === viewName);
  });

  navButtons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  const titles = {
    dashboard: 'Dashboard',
    events: 'Begivenheder',
    documents: 'Referater',
    members: 'Medlemmer',
    messages: 'Beskeder',
    profile: 'Profil',
    admin: 'Adminpanel'
  };

  pageTitle.textContent = titles[viewName] || 'Circulus Aureus';
}

function showAuthenticated(user) {
  state.currentUser = user;

  const email = user?.email || '';
  state.isAdmin = adminEmails.includes(email.toLowerCase());

  authShell.classList.add('hidden');
  appShell.classList.remove('hidden');
  identityStatus.textContent = 'Godkendt adgang';

  miniName.textContent = email.split('@')[0] || 'Medlem';
  miniEmail.textContent = email;
  miniAvatar.textContent = getInitials(email);

  profileName.textContent = email.split('@')[0] || 'Medlem';
  profileEmail.textContent = email;
  profileRole.textContent = state.isAdmin ? 'Admin' : 'Medlem';

  rolePill.textContent = state.isAdmin ? 'Admin' : 'Medlem';

  adminTab.classList.toggle('hidden', !state.isAdmin);
  if (adminMobileTab) adminMobileTab.classList.toggle('hidden', !state.isAdmin);

  activateView('dashboard');
}

function showLoggedOut() {
  state.currentUser = null;
  state.isAdmin = false;

  authShell.classList.remove('hidden');
  appShell.classList.add('hidden');
  identityStatus.textContent = 'Afventer login';
  rolePill.textContent = 'Medlem';

  adminTab.classList.add('hidden');
  if (adminMobileTab) adminMobileTab.classList.add('hidden');
}

document.getElementById('open-login').addEventListener('click', () => {
  if (window.netlifyIdentity) {
    window.netlifyIdentity.open('login');
  }
});

document.getElementById('open-request').addEventListener('click', () => {
  if (requestBox) requestBox.classList.toggle('hidden');
});

document.getElementById('logout-btn').addEventListener('click', () => {
  if (window.netlifyIdentity) window.netlifyIdentity.logout();
});

const profileLogoutBtn = document.getElementById('profile-logout-btn');
if (profileLogoutBtn) {
  profileLogoutBtn.addEventListener('click', () => {
    if (window.netlifyIdentity) window.netlifyIdentity.logout();
  });
}

navButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.view;
    if (target === 'admin' && !state.isAdmin) return;
    activateView(target);
  });
});

document.querySelectorAll('.nav-jump').forEach((btn) => {
  btn.addEventListener('click', () => activateView(btn.dataset.view));
});

document.getElementById('event-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);

  try {
    await fetchJSON('/.netlify/functions/admin-save-event', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(form))
    });
    e.target.reset();
    await loadData();
    showToast('Begivenhed gemt');
  } catch (error) {
    showToast(error.message);
  }
});

document.getElementById('member-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);

  try {
    await fetchJSON('/.netlify/functions/admin-save-member', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(form))
    });
    e.target.reset();
    await loadData();
    showToast('Medlem gemt');
  } catch (error) {
    showToast(error.message);
  }
});

document.getElementById('message-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);

  try {
    await fetchJSON('/.netlify/functions/admin-save-message', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(form))
    });
    e.target.reset();
    await loadData();
    showToast('Besked gemt');
  } catch (error) {
    showToast(error.message);
  }
});

document.getElementById('document-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const fileInput = e.target.querySelector('input[type="file"]');
  const file = fileInput.files[0];

  if (!file) {
    showToast('Vælg en fil først');
    return;
  }

  const title = e.target.querySelector('input[name="title"]').value;
  const note = e.target.querySelector('input[name="note"]').value;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const chars = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  const content = btoa(chars);

  try {
    await fetchJSON('/.netlify/functions/upload-document', {
      method: 'POST',
      body: JSON.stringify({
        title,
        note,
        filename: file.name,
        mime: file.type,
        content
      })
    });
    e.target.reset();
    await loadData();
    showToast('Dokument uploadet');
  } catch (error) {
    showToast(error.message);
  }
});

const requestAccessForm = document.getElementById('request-access-form');
if (requestAccessForm) {
  requestAccessForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);

    try {
      await fetchJSON('/.netlify/functions/request-access', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(form))
      });

      e.target.reset();
      if (requestBox) requestBox.classList.add('hidden');
      showToast('Din anmodning er sendt. Du får adgang, når du bliver inviteret.');
    } catch (error) {
      showToast(error.message);
    }
  });
}

document.addEventListener('click', async (e) => {
  const rsvpBtn = e.target.closest('[data-rsvp]');
  if (rsvpBtn) {
    showToast(`Du har svaret: ${rsvpBtn.dataset.answer}`);
  }

  const downloadBtn = e.target.closest('[data-download]');
  if (downloadBtn) {
    window.open(`/.netlify/functions/download-document?id=${encodeURIComponent(downloadBtn.dataset.download)}`, '_blank');
  }

  const deleteBtn = e.target.closest('[data-delete-type]');
  if (deleteBtn) {
    const type = deleteBtn.dataset.deleteType;
    const id = deleteBtn.dataset.deleteId;
    const map = {
      event: '/.netlify/functions/admin-delete-event',
      member: '/.netlify/functions/admin-delete-member',
      message: '/.netlify/functions/admin-delete-message',
      document: '/.netlify/functions/admin-delete-document'
    };

    try {
      await fetchJSON(map[type], {
        method: 'POST',
        body: JSON.stringify({ id })
      });
      await loadData();
      showToast('Slettet');
    } catch (error) {
      showToast(error.message);
    }
  }

  const approveBtn = e.target.closest('[data-approve-email]');
  if (approveBtn) {
    try {
      await fetchJSON('/.netlify/functions/admin-approve-user', {
        method: 'POST',
        body: JSON.stringify({ email: approveBtn.dataset.approveEmail })
      });
      await loadData();
      showToast('Markeret som inviteret');
    } catch (error) {
      showToast(error.message);
    }
  }

  const rejectBtn = e.target.closest('[data-reject-email]');
  if (rejectBtn) {
    try {
      await fetchJSON('/.netlify/functions/admin-reject-user', {
        method: 'POST',
        body: JSON.stringify({ email: rejectBtn.dataset.rejectEmail })
      });
      await loadData();
      showToast('Bruger afvist');
    } catch (error) {
      showToast(error.message);
    }
  }

  const copyBtn = e.target.closest('[data-copy-email]');
  if (copyBtn) {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.copyEmail);
      showToast('E-mail kopieret');
    } catch {
      showToast('Kunne ikke kopiere e-mail');
    }
  }
});

function maybeOpenIdentityFromInviteLink() {
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  const full = `${hash} ${search}`;

  if (
    full.includes('invite_token') ||
    full.includes('confirmation_token') ||
    full.includes('recovery_token') ||
    full.includes('email_change_token')
  ) {
    setTimeout(() => {
      if (window.netlifyIdentity) {
        window.netlifyIdentity.open();
      }
    }, 300);
  }
}

if (window.netlifyIdentity) {
  window.netlifyIdentity.on('init', async (user) => {
    maybeOpenIdentityFromInviteLink();

    if (user) {
      showAuthenticated(user);
      try {
        await loadData();
      } catch (error) {
        showToast(error.message);
      }
    } else {
      showLoggedOut();
    }
  });

  window.netlifyIdentity.on('open', () => {});
  window.netlifyIdentity.on('close', () => {});

  window.netlifyIdentity.on('login', async (user) => {
    showAuthenticated(user);
    window.netlifyIdentity.close();

    try {
      await loadData();
    } catch (error) {
      showToast(error.message);
    }
  });

  window.netlifyIdentity.on('logout', () => {
    showLoggedOut();
  });

  window.netlifyIdentity.on('error', (error) => {
    showToast(error?.message || 'Identity-fejl');
  });

  window.netlifyIdentity.init();
} else {
  showToast('Netlify Identity blev ikke indlæst');
}
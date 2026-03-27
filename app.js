import { getUser, handleAuthCallback, login, logout } from '@netlify/identity'

const state = {
  currentUser: null,
  isAdmin: false,
  data: { events: [], members: [], messages: [], documents: [], approvals: [] },
  currentView: 'dashboard'
}

const authShell = document.getElementById('auth-shell')
const appShell = document.getElementById('app-shell')
const identityStatus = document.getElementById('identity-status')
const pageTitle = document.getElementById('page-title')
const rolePill = document.getElementById('role-pill')
const profileName = document.getElementById('profile-name')
const profileEmail = document.getElementById('profile-email')
const profileRole = document.getElementById('profile-role')
const requestBox = document.getElementById('request-box')
const loginBox = document.getElementById('login-box')
const toast = (() => {
  const el = document.createElement('div')
  el.style.position = 'fixed'
  el.style.right = '16px'
  el.style.bottom = '16px'
  el.style.zIndex = '9999'
  el.style.padding = '12px 16px'
  el.style.borderRadius = '12px'
  el.style.background = 'rgba(37,9,17,.95)'
  el.style.border = '1px solid rgba(214,178,106,.22)'
  el.style.color = '#fff'
  el.style.display = 'none'
  document.body.appendChild(el)
  return el
})()

const miniName = document.getElementById('mini-name')
const miniEmail = document.getElementById('mini-email')
const miniAvatar = document.getElementById('mini-avatar')
const adminNav = document.getElementById('admin-nav')

const loginForm = document.getElementById('login-form')
const requestAccessForm = document.getElementById('request-access-form')

const views = {
  dashboard: document.getElementById('view-dashboard'),
  events: document.getElementById('view-events'),
  documents: document.getElementById('view-documents'),
  members: document.getElementById('view-members'),
  messages: document.getElementById('view-messages'),
  profile: document.getElementById('view-profile'),
  admin: document.getElementById('view-admin')
}

const adminEmails = ['frekopetersen1998@gmail.com']

function showToast(message) {
  toast.textContent = message
  toast.style.display = 'block'
  clearTimeout(showToast._timer)
  showToast._timer = setTimeout(() => {
    toast.style.display = 'none'
  }, 3200)
}

function getInitials(text) {
  return (text || 'CA')
    .split(/\s|@|\./)
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0].toUpperCase())
    .join('')
}

function setUserUI(user) {
  const email = user?.email || ''
  const shortName = email.split('@')[0] || 'Medlem'
  state.isAdmin = adminEmails.includes(email.toLowerCase())

  identityStatus.textContent = 'Godkendt adgang'
  miniName.textContent = shortName
  miniEmail.textContent = email
  miniAvatar.textContent = getInitials(email)
  profileName.textContent = shortName
  profileEmail.textContent = email
  profileRole.textContent = state.isAdmin ? 'Admin' : 'Medlem'
  rolePill.textContent = state.isAdmin ? 'Admin' : 'Medlem'
  adminNav.classList.toggle('hidden', !state.isAdmin)
}

function showAuthenticated(user) {
  state.currentUser = user
  setUserUI(user)
  authShell.classList.add('hidden')
  appShell.classList.remove('hidden')
  activateView('dashboard')
}

function showLoggedOut() {
  state.currentUser = null
  state.isAdmin = false
  identityStatus.textContent = 'Afventer login'
  authShell.classList.remove('hidden')
  appShell.classList.add('hidden')
  loginBox.classList.add('hidden')
  requestBox.classList.add('hidden')
}

function activateView(name) {
  state.currentView = name
  Object.entries(views).forEach(([key, el]) => {
    el.classList.toggle('active', key === name)
  })
  const map = {
    dashboard: 'DASHBOARD',
    events: 'BEGIVENHEDER',
    documents: 'REFERATER',
    members: 'MEDLEMMER',
    messages: 'BESKEDER',
    profile: 'PROFIL',
    admin: 'ADMINPANEL'
  }
  pageTitle.textContent = map[name] || 'DASHBOARD'
}

async function fetchJSON(url, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  })

  if (!res.ok) {
    let msg = 'Ukendt fejl'
    try {
      const data = await res.json()
      msg = data.error || data.message || msg
    } catch {}
    throw new Error(msg)
  }

  return res.json()
}

function renderList(hostId, items, renderFn, emptyText) {
  const host = document.getElementById(hostId)
  host.innerHTML = ''
  if (!items?.length) {
    host.innerHTML = `<article class="panel card"><p>${emptyText}</p></article>`
    return
  }
  items.forEach((item) => {
    const wrap = document.createElement('article')
    wrap.className = 'panel card'
    wrap.innerHTML = renderFn(item)
    host.appendChild(wrap)
  })
}

function renderAll() {
  document.getElementById('stat-events').textContent = state.data.events?.length || 0
  document.getElementById('stat-docs').textContent = state.data.documents?.length || 0
  document.getElementById('stat-members').textContent = state.data.members?.length || 0

  renderList(
    'events-list',
    state.data.events,
    (event) => `
      <p class="eyebrow">${event.datetime || ''}</p>
      <h3>${event.title || 'Uden titel'}</h3>
      <p>${event.location || ''}</p>
      <p>${event.description || ''}</p>
    `,
    'Ingen begivenheder endnu.'
  )

  renderList(
    'documents-list',
    state.data.documents,
    (doc) => `
      <p class="eyebrow">${doc.createdAt || ''}</p>
      <h3>${doc.title || 'Uden titel'}</h3>
      <p>${doc.note || ''}</p>
      <button class="nav-btn" data-download="${doc.id}" type="button">Download</button>
    `,
    'Ingen dokumenter endnu.'
  )

  renderList(
    'members-list',
    state.data.members,
    (member) => `
      <p class="eyebrow">Medlem</p>
      <h3>${member.name || 'Ukendt navn'}</h3>
      <p>${member.email || ''}</p>
      <p>${member.since ? `Medlem siden ${member.since}` : ''}</p>
    `,
    'Ingen medlemmer endnu.'
  )

  renderList(
    'messages-list',
    state.data.messages,
    (message) => `
      <p class="eyebrow">${message.createdAt || ''}</p>
      <h3>${message.title || 'Uden titel'}</h3>
      <p>${message.body || ''}</p>
    `,
    'Ingen beskeder endnu.'
  )

  const pending = (state.data.approvals || []).filter((item) => item.status !== 'invited')
  renderList(
    'approval-list',
    pending,
    (item) => `
      <p class="eyebrow">Afventende godkendelse</p>
      <h3>${item.name || 'Ukendt navn'}</h3>
      <p>${item.email || ''}</p>
      <p>${item.note || ''}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
        <button class="nav-btn" data-approve-email="${item.email}" type="button">Markér som inviteret</button>
        <button class="nav-btn" data-copy-email="${item.email}" type="button">Kopiér e-mail</button>
        <button class="nav-btn" data-reject-email="${item.email}" type="button">Afvis</button>
      </div>
    `,
    'Ingen afventende godkendelser.'
  )
}

async function loadData() {
  try {
    const data = await fetchJSON('/.netlify/functions/list-data')
    state.data = data
    renderAll()
  } catch (error) {
    showToast(error.message)
  }
}

document.getElementById('open-login').addEventListener('click', () => {
  loginBox.classList.toggle('hidden')
  requestBox.classList.add('hidden')
})

document.getElementById('open-request').addEventListener('click', () => {
  requestBox.classList.toggle('hidden')
  loginBox.classList.add('hidden')
})

document.getElementById('logout-btn').addEventListener('click', async () => {
  await logout()
  showLoggedOut()
})

document.getElementById('profile-logout-btn').addEventListener('click', async () => {
  await logout()
  showLoggedOut()
})

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const fd = new FormData(e.target)
  const email = String(fd.get('email') || '').trim()
  const password = String(fd.get('password') || '')

  try {
    const user = await login(email, password)
    showAuthenticated(user)
    loginBox.classList.add('hidden')
    await loadData()
  } catch (error) {
    showToast(error?.message || 'Login fejlede')
  }
})

requestAccessForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const form = new FormData(e.target)

  try {
    await fetchJSON('/.netlify/functions/request-access', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(form))
    })
    e.target.reset()
    requestBox.classList.add('hidden')
    showToast('Din anmodning er sendt.')
  } catch (error) {
    showToast(error.message)
  }
})

document.querySelectorAll('[data-view]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view
    if (view === 'admin' && !state.isAdmin) return
    activateView(view)
  })
})

document.addEventListener('click', async (e) => {
  const dl = e.target.closest('[data-download]')
  if (dl) {
    window.open(`/.netlify/functions/download-document?id=${encodeURIComponent(dl.dataset.download)}`, '_blank')
  }

  const approveBtn = e.target.closest('[data-approve-email]')
  if (approveBtn) {
    try {
      await fetchJSON('/.netlify/functions/admin-approve-user', {
        method: 'POST',
        body: JSON.stringify({ email: approveBtn.dataset.approveEmail })
      })
      await loadData()
      showToast('Markeret som inviteret')
    } catch (error) {
      showToast(error.message)
    }
  }

  const rejectBtn = e.target.closest('[data-reject-email]')
  if (rejectBtn) {
    try {
      await fetchJSON('/.netlify/functions/admin-reject-user', {
        method: 'POST',
        body: JSON.stringify({ email: rejectBtn.dataset.rejectEmail })
      })
      await loadData()
      showToast('Bruger afvist')
    } catch (error) {
      showToast(error.message)
    }
  }

  const copyBtn = e.target.closest('[data-copy-email]')
  if (copyBtn) {
    try {
      await navigator.clipboard.writeText(copyBtn.dataset.copyEmail)
      showToast('E-mail kopieret')
    } catch {
      showToast('Kunne ikke kopiere e-mail')
    }
  }
})

async function boot() {
  try {
    const result = await handleAuthCallback()
    const user = result?.user || await getUser()

    if (user) {
      showAuthenticated(user)
      await loadData()
    } else {
      showLoggedOut()
    }
  } catch (error) {
    showLoggedOut()
    showToast(error?.message || 'Identity-fejl')
  }
}

boot()
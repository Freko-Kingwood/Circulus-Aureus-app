import { getUser, handleAuthCallback, login, logout, acceptInvite } from '@netlify/identity'

const authShell = document.getElementById('auth-shell')
const appShell = document.getElementById('app-shell')
const identityStatus = document.getElementById('identity-status')

const loginBox = document.getElementById('login-box')
const requestBox = document.getElementById('request-box')
const inviteBox = document.getElementById('invite-box')

const loginForm = document.getElementById('login-form')
const requestAccessForm = document.getElementById('request-access-form')
const inviteForm = document.getElementById('invite-form')

const pageTitle = document.getElementById('page-title')
const rolePill = document.getElementById('role-pill')
const profileName = document.getElementById('profile-name')
const profileEmail = document.getElementById('profile-email')
const profileRole = document.getElementById('profile-role')

const statEvents = document.getElementById('stat-events')
const statMembers = document.getElementById('stat-members')
const statMessages = document.getElementById('stat-messages')

const eventList = document.getElementById('event-list')
const memberList = document.getElementById('member-list')
const messageList = document.getElementById('message-list')
const approvalList = document.getElementById('approval-list')

const profileAdminLinkWrap = document.getElementById('profile-admin-link-wrap')
const openAdminFromProfile = document.getElementById('open-admin-from-profile')

const adminEmails = ['frekopetersen1998@gmail.com']

let currentUser = null
let currentData = {
  events: [],
  members: [],
  messages: [],
  approvals: []
}

function showToast(message) {
  const toast = document.createElement('div')
  toast.textContent = message
  toast.style.position = 'fixed'
  toast.style.right = '16px'
  toast.style.bottom = '96px'
  toast.style.zIndex = '9999'
  toast.style.maxWidth = '320px'
  toast.style.padding = '12px 16px'
  toast.style.borderRadius = '14px'
  toast.style.background = 'rgba(37, 9, 17, 0.96)'
  toast.style.border = '1px solid rgba(215, 180, 106, 0.22)'
  toast.style.color = '#fff'
  toast.style.boxShadow = '0 14px 30px rgba(0,0,0,.28)'
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3200)
}

function isAdminEmail(email) {
  return adminEmails.includes((email || '').toLowerCase())
}

function getInviteToken() {
  const hash = window.location.hash || ''
  return new URLSearchParams(hash.replace(/^#/, '')).get('invite_token')
}

async function fetchJSON(url, options = {}) {
  const headers = { ...(options.headers || {}) }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  const rawText = await response.text()

  let data = null
  try {
    data = rawText ? JSON.parse(rawText) : {}
  } catch {
    data = { error: rawText || 'Ukendt fejl' }
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || `HTTP ${response.status}`)
  }

  return data
}

function showAuthenticated(user) {
  currentUser = user

  const email = user?.email || ''
  const shortName = email.split('@')[0] || 'Medlem'
  const admin = isAdminEmail(email)

  authShell.classList.add('hidden')
  appShell.classList.remove('hidden')

  identityStatus.textContent = 'Godkendt adgang'
  rolePill.textContent = admin ? 'Admin' : 'Medlem'
  profileRole.textContent = admin ? 'Admin' : 'Medlem'
  profileName.textContent = shortName
  profileEmail.textContent = email

  profileAdminLinkWrap.classList.toggle('hidden', !admin)
}

function showLoggedOut(status = 'Afventer login') {
  authShell.classList.remove('hidden')
  appShell.classList.add('hidden')
  identityStatus.textContent = status

  if (loginBox) loginBox.classList.add('hidden')
  if (requestBox) requestBox.classList.add('hidden')
}

function activateView(viewName) {
  const titles = {
    dashboard: 'Dashboard',
    events: 'Begivenheder',
    members: 'Medlemmer',
    messages: 'Beskeder',
    profile: 'Profil',
    admin: 'Adminpanel'
  }

  document.querySelectorAll('.view').forEach((view) => {
    view.classList.remove('active')
  })

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.remove('active')
  })

  const viewEl = document.getElementById(`view-${viewName}`)
  const btnEl = document.querySelector(`.nav-item[data-view="${viewName}"]`)

  if (viewEl) viewEl.classList.add('active')
  if (btnEl) btnEl.classList.add('active')

  pageTitle.textContent = titles[viewName] || 'Dashboard'
}

function renderStats() {
  statEvents.textContent = currentData.events.length
  statMembers.textContent = currentData.members.length
  statMessages.textContent = currentData.messages.length
}

function renderEvents() {
  if (!currentData.events.length) {
    eventList.innerHTML = '<div class="item"><p class="muted">Ingen begivenheder endnu.</p></div>'
    return
  }

  eventList.innerHTML = currentData.events
    .map((event) => {
      return `
        <article class="item">
          <p class="eyebrow">${event.datetime || event.date || ''}</p>
          <h3>${event.title || 'Uden titel'}</h3>
          <p class="muted">${event.location || ''}</p>
          <p class="muted">${event.description || ''}</p>
        </article>
      `
    })
    .join('')
}

function renderMembers() {
  if (!currentData.members.length) {
    memberList.innerHTML = '<div class="item"><p class="muted">Ingen medlemmer endnu.</p></div>'
    return
  }

  memberList.innerHTML = currentData.members
    .map((member) => {
      return `
        <article class="item">
          <h3>${member.name || 'Ukendt medlem'}</h3>
          <p class="muted">${member.email || ''}</p>
          <p class="muted">${member.since ? `Medlem siden ${member.since}` : ''}</p>
        </article>
      `
    })
    .join('')
}

function renderMessages() {
  if (!currentData.messages.length) {
    messageList.innerHTML = '<div class="item"><p class="muted">Ingen beskeder endnu.</p></div>'
    return
  }

  messageList.innerHTML = currentData.messages
    .map((message) => {
      return `
        <article class="item">
          <p class="eyebrow">${message.createdAt || ''}</p>
          <h3>${message.title || 'Besked'}</h3>
          <p class="muted">${message.text || message.body || ''}</p>
        </article>
      `
    })
    .join('')
}

function renderApprovals() {
  const pending = (currentData.approvals || []).filter((item) => item.status !== 'invited')

  if (!pending.length) {
    approvalList.innerHTML = '<div class="item"><p class="muted">Ingen afventende godkendelser.</p></div>'
    return
  }

  approvalList.innerHTML = pending
    .map((item) => {
      return `
        <article class="item">
          <p class="eyebrow">Afventende godkendelse</p>
          <h3>${item.name || 'Ukendt navn'}</h3>
          <p class="muted">${item.email || ''}</p>
          <p class="muted">${item.note || ''}</p>
          <div class="item-actions">
            <button type="button" data-approve-email="${item.email}">Markér som inviteret</button>
            <button type="button" data-copy-email="${item.email}">Kopiér e-mail</button>
            <button class="btn-danger" type="button" data-reject-email="${item.email}">Afvis</button>
          </div>
        </article>
      `
    })
    .join('')
}

function renderAll() {
  renderStats()
  renderEvents()
  renderMembers()
  renderMessages()
  renderApprovals()
}

async function loadData() {
  try {
    currentData = await fetchJSON('/.netlify/functions/list-data')
    renderAll()
  } catch (error) {
    console.error('list-data fejl:', error)
    showToast(error.message || 'Kunne ikke hente data')
  }
}

document.getElementById('open-login')?.addEventListener('click', () => {
  loginBox.classList.toggle('hidden')
  requestBox.classList.add('hidden')
  inviteBox.classList.add('hidden')
})

document.getElementById('open-request')?.addEventListener('click', () => {
  requestBox.classList.toggle('hidden')
  loginBox.classList.add('hidden')
  inviteBox.classList.add('hidden')
})

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  try {
    await logout()
  } catch {}
  currentUser = null
  showLoggedOut()
})

openAdminFromProfile?.addEventListener('click', () => {
  if (isAdminEmail(currentUser?.email || '')) {
    activateView('admin')
  }
})

document.querySelectorAll('.nav-item[data-view]').forEach((btn) => {
  btn.addEventListener('click', () => {
    activateView(btn.dataset.view)
  })
})

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault()

  const fd = new FormData(e.target)
  const email = String(fd.get('email') || '').trim()
  const password = String(fd.get('password') || '')

  try {
    const user = await login(email, password)
    showAuthenticated(user)
    loginBox.classList.add('hidden')
    activateView('dashboard')
    await loadData()
  } catch (error) {
    console.error('login fejl:', error)
    showToast(error?.message || 'Login fejlede')
    identityStatus.textContent = `Login-fejl: ${error?.message || 'ukendt fejl'}`
  }
})

requestAccessForm?.addEventListener('submit', async (e) => {
  e.preventDefault()

  const form = new FormData(e.target)
  const payload = Object.fromEntries(form)

  try {
    await fetchJSON('/.netlify/functions/request-access', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    e.target.reset()
    requestBox.classList.add('hidden')
    showToast('Din anmodning er sendt')
  } catch (error) {
    console.error('request-access fejl:', error)
    showToast(error?.message || 'Kunne ikke sende anmodning')
  }
})

inviteForm?.addEventListener('submit', async (e) => {
  e.preventDefault()

  const fd = new FormData(e.target)
  const password = String(fd.get('password') || '')
  const password2 = String(fd.get('password2') || '')
  const token = getInviteToken()

  if (!token) {
    showToast('Intet invite-token fundet')
    identityStatus.textContent = 'Invite-fejl: Intet invite-token fundet'
    return
  }

  if (password.length < 8) {
    showToast('Adgangskoden skal være mindst 8 tegn')
    return
  }

  if (password !== password2) {
    showToast('Adgangskoderne matcher ikke')
    return
  }

  try {
    const user = await acceptInvite(token, password)
    showAuthenticated(user)

    if (window.location.hash) {
      history.replaceState({}, document.title, window.location.pathname)
    }

    showToast('Konto aktiveret')
    activateView('dashboard')
    await loadData()
  } catch (error) {
    console.error('acceptInvite fejl:', error)
    showToast(error?.message || 'Kunne ikke aktivere konto')
    identityStatus.textContent = `Invite-fejl: ${error?.message || 'ukendt fejl'}`
  }
})

document.addEventListener('click', async (e) => {
  const approveBtn = e.target.closest('[data-approve-email]')
  if (approveBtn) {
    try {
      await fetchJSON('/.netlify/functions/admin-approve-user', {
        method: 'POST',
        body: JSON.stringify({ email: approveBtn.dataset.approveEmail })
      })
      showToast('Markeret som inviteret')
      await loadData()
    } catch (error) {
      console.error('approve fejl:', error)
      showToast(error?.message || 'Kunne ikke godkende')
    }
    return
  }

  const rejectBtn = e.target.closest('[data-reject-email]')
  if (rejectBtn) {
    try {
      await fetchJSON('/.netlify/functions/admin-reject-user', {
        method: 'POST',
        body: JSON.stringify({ email: rejectBtn.dataset.rejectEmail })
      })
      showToast('Bruger afvist')
      await loadData()
    } catch (error) {
      console.error('reject fejl:', error)
      showToast(error?.message || 'Kunne ikke afvise')
    }
    return
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
  const hash = window.location.hash || ''

  try {
    if (hash.includes('invite_token')) {
      showLoggedOut('Invitation fundet — vælg adgangskode')
      inviteBox.classList.remove('hidden')
      loginBox.classList.add('hidden')
      requestBox.classList.add('hidden')
      return
    }

    let callbackResult = null

    try {
      callbackResult = await handleAuthCallback()
    } catch (error) {
      console.error('handleAuthCallback fejl:', error)
    }

    const user = callbackResult?.user || await getUser()

    if (user) {
      showAuthenticated(user)

      if (window.location.hash) {
        history.replaceState({}, document.title, window.location.pathname)
      }

      activateView('dashboard')
      await loadData()
      return
    }

    showLoggedOut('Afventer login')
  } catch (error) {
    console.error('boot fejl:', error)
    showLoggedOut(`Identity-fejl: ${error?.message || 'ukendt fejl'}`)
    showToast(error?.message || 'Identity-fejl')
  }
}

window.addEventListener('load', boot)
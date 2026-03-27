import { getUser, handleAuthCallback, login, logout, acceptInvite } from '@netlify/identity'

const authShell = document.getElementById('auth-shell')
const appShell = document.getElementById('app-shell')
const identityStatus = document.getElementById('identity-status')
const rolePill = document.getElementById('role-pill')
const profileName = document.getElementById('profile-name')
const profileEmail = document.getElementById('profile-email')
const pageTitle = document.getElementById('page-title')

const loginBox = document.getElementById('login-box')
const requestBox = document.getElementById('request-box')
const inviteBox = document.getElementById('invite-box')

const loginForm = document.getElementById('login-form')
const requestAccessForm = document.getElementById('request-access-form')
const inviteForm = document.getElementById('invite-form')

const eventForm = document.getElementById('event-form')
const memberForm = document.getElementById('member-form')
const messageForm = document.getElementById('message-form')

const eventList = document.getElementById('event-list')
const memberList = document.getElementById('member-list')
const messageList = document.getElementById('message-list')

const statEvents = document.getElementById('stat-events')
const statMembers = document.getElementById('stat-members')
const statMessages = document.getElementById('stat-messages')

const adminTabBtn = document.getElementById('admin-tab-btn')

const adminEmails = ['frekopetersen1998@gmail.com']
let currentUser = null

let events = JSON.parse(localStorage.getItem('ca_events') || '[]')
let members = JSON.parse(localStorage.getItem('ca_members') || '[]')
let messages = JSON.parse(localStorage.getItem('ca_messages') || '[]')

function saveAll() {
  localStorage.setItem('ca_events', JSON.stringify(events))
  localStorage.setItem('ca_members', JSON.stringify(members))
  localStorage.setItem('ca_messages', JSON.stringify(messages))
}

function showToast(message) {
  const toast = document.createElement('div')
  toast.textContent = message
  toast.style.position = 'fixed'
  toast.style.right = '16px'
  toast.style.bottom = '16px'
  toast.style.zIndex = '9999'
  toast.style.padding = '12px 16px'
  toast.style.borderRadius = '12px'
  toast.style.background = 'rgba(37,9,17,.95)'
  toast.style.border = '1px solid rgba(214,178,106,.22)'
  toast.style.color = '#fff'
  toast.style.maxWidth = '320px'
  toast.style.fontFamily = 'Inter, system-ui, sans-serif'
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3200)
}

function showAuthenticated(user) {
  currentUser = user

  const email = user?.email || ''
  const shortName = email.split('@')[0] || 'Medlem'
  const isAdmin = adminEmails.includes(email.toLowerCase())

  authShell.classList.add('hidden')
  appShell.classList.remove('hidden')

  identityStatus.textContent = 'Godkendt adgang'
  rolePill.textContent = isAdmin ? 'Admin' : 'Medlem'
  profileName.textContent = shortName
  profileEmail.textContent = email

  if (adminTabBtn) {
    adminTabBtn.classList.toggle('hidden', !isAdmin)
  }

  if (email && !members.some((m) => m.email.toLowerCase() === email.toLowerCase())) {
    members.unshift({
      name: shortName,
      email
    })
    saveAll()
  }

  renderAll()
}

function showLoggedOut(status = 'Afventer login') {
  authShell.classList.remove('hidden')
  appShell.classList.add('hidden')
  identityStatus.textContent = status

  if (loginBox) loginBox.classList.add('hidden')
  if (requestBox) requestBox.classList.add('hidden')
}

function getInviteToken() {
  const hash = window.location.hash || ''
  return new URLSearchParams(hash.replace(/^#/, '')).get('invite_token')
}

function renderEvents() {
  if (!eventList) return

  if (!events.length) {
    eventList.innerHTML = '<div class="muted">Ingen events endnu.</div>'
    return
  }

  eventList.innerHTML = events
    .map(
      (event, index) => `
        <article class="card">
          <p class="eyebrow">${event.date || ''}</p>
          <h3 class="item-title">${event.title}</h3>
          <p class="muted">${event.description || ''}</p>
          <div class="actions-row">
            <button type="button" data-delete-event="${index}">Slet</button>
          </div>
        </article>
      `
    )
    .join('')
}

function renderMembers() {
  if (!memberList) return

  if (!members.length) {
    memberList.innerHTML = '<div class="muted">Ingen medlemmer endnu.</div>'
    return
  }

  memberList.innerHTML = members
    .map(
      (member, index) => `
        <article class="card">
          <h3 class="item-title">${member.name}</h3>
          <p class="muted">${member.email}</p>
          <div class="actions-row">
            <button type="button" data-delete-member="${index}">Slet</button>
          </div>
        </article>
      `
    )
    .join('')
}

function renderMessages() {
  if (!messageList) return

  if (!messages.length) {
    messageList.innerHTML = '<div class="muted">Ingen beskeder endnu.</div>'
    return
  }

  messageList.innerHTML = messages
    .map(
      (message, index) => `
        <article class="card">
          <p class="eyebrow">${message.createdAt || ''}</p>
          <h3 class="item-title">${message.title}</h3>
          <p class="muted">${message.text}</p>
          <div class="actions-row">
            <button type="button" data-delete-message="${index}">Slet</button>
          </div>
        </article>
      `
    )
    .join('')
}

function renderStats() {
  if (statEvents) statEvents.textContent = events.length
  if (statMembers) statMembers.textContent = members.length
  if (statMessages) statMessages.textContent = messages.length
}

function renderAll() {
  renderEvents()
  renderMembers()
  renderMessages()
  renderStats()
}

function activateTab(tabName) {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.remove('active')
  })

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.remove('active')
  })

  const targetTab = document.getElementById(`tab-${tabName}`)
  const targetBtn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`)

  if (targetTab) targetTab.classList.add('active')
  if (targetBtn) targetBtn.classList.add('active')

  const titles = {
    dashboard: 'Dashboard',
    events: 'Events',
    members: 'Medlemmer',
    messages: 'Beskeder',
    admin: 'Admin'
  }

  if (pageTitle) pageTitle.textContent = titles[tabName] || 'Dashboard'
}

document.getElementById('open-login')?.addEventListener('click', () => {
  if (loginBox) loginBox.classList.toggle('hidden')
  if (requestBox) requestBox.classList.add('hidden')
  if (inviteBox) inviteBox.classList.add('hidden')
})

document.getElementById('open-request')?.addEventListener('click', () => {
  if (requestBox) requestBox.classList.toggle('hidden')
  if (loginBox) loginBox.classList.add('hidden')
  if (inviteBox) inviteBox.classList.add('hidden')
})

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  try {
    await logout()
  } catch {}
  currentUser = null
  showLoggedOut()
})

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault()

  const fd = new FormData(e.target)
  const email = String(fd.get('email') || '').trim()
  const password = String(fd.get('password') || '')

  try {
    const user = await login(email, password)
    showAuthenticated(user)
    if (loginBox) loginBox.classList.add('hidden')
    activateTab('dashboard')
  } catch (error) {
    showToast(error?.message || 'Login fejlede')
    identityStatus.textContent = `Login-fejl: ${error?.message || 'ukendt fejl'}`
  }
})

requestAccessForm?.addEventListener('submit', async (e) => {
  e.preventDefault()

  const form = new FormData(e.target)
  const payload = Object.fromEntries(form)

  try {
    const res = await fetch('/.netlify/functions/request-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      let msg = 'Kunne ikke sende anmodning'
      try {
        const data = await res.json()
        msg = data.error || data.message || msg
      } catch {}
      throw new Error(msg)
    }

    e.target.reset()
    requestBox.classList.add('hidden')
    showToast('Din anmodning er sendt')
  } catch (error) {
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
    activateTab('dashboard')
  } catch (error) {
    console.error('acceptInvite fejl:', error)
    showToast(error?.message || 'Kunne ikke aktivere konto')
    identityStatus.textContent = `Invite-fejl: ${error?.message || 'ukendt fejl'}`
  }
})

eventForm?.addEventListener('submit', (e) => {
  e.preventDefault()
  const fd = new FormData(e.target)

  events.unshift({
    title: String(fd.get('title') || '').trim(),
    date: String(fd.get('date') || '').trim(),
    description: String(fd.get('description') || '').trim()
  })

  saveAll()
  renderEvents()
  renderStats()
  e.target.reset()
  showToast('Event gemt')
})

memberForm?.addEventListener('submit', (e) => {
  e.preventDefault()
  const fd = new FormData(e.target)

  members.unshift({
    name: String(fd.get('name') || '').trim(),
    email: String(fd.get('email') || '').trim()
  })

  saveAll()
  renderMembers()
  renderStats()
  e.target.reset()
  showToast('Medlem gemt')
})

messageForm?.addEventListener('submit', (e) => {
  e.preventDefault()
  const fd = new FormData(e.target)

  messages.unshift({
    title: String(fd.get('title') || '').trim(),
    text: String(fd.get('text') || '').trim(),
    createdAt: new Date().toLocaleString('da-DK')
  })

  saveAll()
  renderMessages()
  renderStats()
  e.target.reset()
  showToast('Besked gemt')
})

document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('.nav-btn[data-tab]')
  if (tabBtn) {
    activateTab(tabBtn.dataset.tab)
    return
  }

  const deleteEventBtn = e.target.closest('[data-delete-event]')
  if (deleteEventBtn) {
    const index = Number(deleteEventBtn.dataset.deleteEvent)
    events.splice(index, 1)
    saveAll()
    renderEvents()
    renderStats()
    showToast('Event slettet')
    return
  }

  const deleteMemberBtn = e.target.closest('[data-delete-member]')
  if (deleteMemberBtn) {
    const index = Number(deleteMemberBtn.dataset.deleteMember)
    members.splice(index, 1)
    saveAll()
    renderMembers()
    renderStats()
    showToast('Medlem slettet')
    return
  }

  const deleteMessageBtn = e.target.closest('[data-delete-message]')
  if (deleteMessageBtn) {
    const index = Number(deleteMessageBtn.dataset.deleteMessage)
    messages.splice(index, 1)
    saveAll()
    renderMessages()
    renderStats()
    showToast('Besked slettet')
  }
})

async function boot() {
  const hash = window.location.hash || ''

  try {
    if (hash.includes('invite_token')) {
      showLoggedOut('Invitation fundet — vælg adgangskode')

      if (inviteBox) inviteBox.classList.remove('hidden')
      if (loginBox) loginBox.classList.add('hidden')
      if (requestBox) requestBox.classList.add('hidden')

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

      activateTab('dashboard')
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
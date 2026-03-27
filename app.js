import { getUser, handleAuthCallback, login, logout, acceptInvite } from '@netlify/identity'

const authShell = document.getElementById('auth-shell')
const appShell = document.getElementById('app-shell')
const identityStatus = document.getElementById('identity-status')
const rolePill = document.getElementById('role-pill')
const profileName = document.getElementById('profile-name')
const profileEmail = document.getElementById('profile-email')

const loginBox = document.getElementById('login-box')
const requestBox = document.getElementById('request-box')
const inviteBox = document.getElementById('invite-box')

const loginForm = document.getElementById('login-form')
const requestAccessForm = document.getElementById('request-access-form')
const inviteForm = document.getElementById('invite-form')

const adminEmails = ['frekopetersen1998@gmail.com']

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
  const email = user?.email || ''
  const shortName = email.split('@')[0] || 'Medlem'
  const isAdmin = adminEmails.includes(email.toLowerCase())

  authShell.classList.add('hidden')
  appShell.classList.remove('hidden')

  identityStatus.textContent = 'Godkendt adgang'
  rolePill.textContent = isAdmin ? 'Admin' : 'Medlem'
  profileName.textContent = shortName
  profileEmail.textContent = email
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
  showLoggedOut()
})

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const fd = new FormData(e.target)
    const email = String(fd.get('email') || '').trim()
    const password = String(fd.get('password') || '')

    try {
      const user = await login(email, password)
      showAuthenticated(user)
      if (loginBox) loginBox.classList.add('hidden')
    } catch (error) {
      showToast(error?.message || 'Login fejlede')
      identityStatus.textContent = `Login-fejl: ${error?.message || 'ukendt fejl'}`
    }
  })
}

if (requestAccessForm) {
  requestAccessForm.addEventListener('submit', async (e) => {
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
}

if (inviteForm) {
  inviteForm.addEventListener('submit', async (e) => {
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
    } catch (error) {
      console.error('acceptInvite fejl:', error)
      showToast(error?.message || 'Kunne ikke aktivere konto')
      identityStatus.textContent = `Invite-fejl: ${error?.message || 'ukendt fejl'}`
    }
  })
}

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
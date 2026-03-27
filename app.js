import { getUser, handleAuthCallback, login, logout } from '@netlify/identity'

const authShell = document.getElementById('auth-shell')
const appShell = document.getElementById('app-shell')
const identityStatus = document.getElementById('identity-status')
const rolePill = document.getElementById('role-pill')
const profileName = document.getElementById('profile-name')
const profileEmail = document.getElementById('profile-email')

const loginBox = document.getElementById('login-box')
const requestBox = document.getElementById('request-box')
const loginForm = document.getElementById('login-form')
const requestAccessForm = document.getElementById('request-access-form')

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

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  const fd = new FormData(e.target)
  const email = String(fd.get('email') || '').trim()
  const password = String(fd.get('password') || '')

  try {
    const user = await login(email, password)
    showAuthenticated(user)
    loginBox.classList.add('hidden')
  } catch (error) {
    showToast(error?.message || 'Login fejlede')
    identityStatus.textContent = `Login-fejl: ${error?.message || 'ukendt fejl'}`
  }
})

requestAccessForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  showToast('Anmodning sendt')
  requestBox.classList.add('hidden')
})

async function boot() {
  const hash = window.location.hash || ''

  try {
    if (hash) {
      identityStatus.textContent = `Hash fundet`
    } else {
      identityStatus.textContent = 'Ingen hash fundet'
    }

    let callbackResult = null

    try {
      callbackResult = await handleAuthCallback()
    } catch (error) {
      console.error('handleAuthCallback fejl:', error)
      identityStatus.textContent = `Callback-fejl: ${error?.message || 'ukendt fejl'}`
    }

    const user = callbackResult?.user || await getUser()

    if (user) {
      showAuthenticated(user)

      if (window.location.hash) {
        history.replaceState({}, document.title, window.location.pathname)
      }

      return
    }

    showLoggedOut(hash ? 'Invitation fundet, men login blev ikke fuldført' : 'Afventer login')
  } catch (error) {
    console.error('boot fejl:', error)
    showLoggedOut(`Identity-fejl: ${error?.message || 'ukendt fejl'}`)
    showToast(error?.message || 'Identity-fejl')
  }
}

window.addEventListener('load', boot)
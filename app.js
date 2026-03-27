import netlifyIdentity from '@netlify/identity'

netlifyIdentity.init()

const authShell = document.getElementById('auth-shell')
const appShell = document.getElementById('app-shell')
const identityStatus = document.getElementById('identity-status')

const loginBox = document.getElementById('login-box')
const requestBox = document.getElementById('request-box')

function showApp(user) {
  authShell.classList.add('hidden')
  appShell.classList.remove('hidden')
  identityStatus.textContent = "Logget ind som " + user.email
}

function showLogin() {
  authShell.classList.remove('hidden')
  appShell.classList.add('hidden')
  identityStatus.textContent = "Ikke logget ind"
}

// 🔥 INVITE FIX (DET VIGTIGSTE)
async function handleInvite() {
  if (window.location.hash.includes("invite_token")) {
    try {
      await netlifyIdentity.completeUser()
    } catch (e) {
      console.log("Invite fejl:", e.message)
    }
  }
}

handleInvite()

// LOGIN BUTTON
document.getElementById('open-login').onclick = () => {
  loginBox.classList.toggle('hidden')
}

// REQUEST BUTTON
document.getElementById('open-request').onclick = () => {
  requestBox.classList.toggle('hidden')
}

// LOGIN FORM
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault()

  const form = new FormData(e.target)
  const email = form.get('email')
  const password = form.get('password')

  try {
    await netlifyIdentity.login(email, password)
  } catch (e) {
    alert("Login fejl")
  }
})

// LOGOUT
document.getElementById('logout-btn').onclick = () => {
  netlifyIdentity.logout()
}

// EVENTS
netlifyIdentity.on('login', user => {
  showApp(user)
  netlifyIdentity.close()
})

netlifyIdentity.on('logout', () => {
  showLogin()
})

netlifyIdentity.on('init', user => {
  if (user) {
    showApp(user)
  } else {
    showLogin()
  }
})
window.addEventListener('DOMContentLoaded', () => {
  const netlifyIdentity = window.netlifyIdentity

  const authShell = document.getElementById('auth-shell')
  const appShell = document.getElementById('app-shell')
  const identityStatus = document.getElementById('identity-status')

  const requestBox = document.getElementById('request-box')
  const inviteBox = document.getElementById('invite-box')

  const requestAccessForm = document.getElementById('request-access-form')
  const inviteForm = document.getElementById('invite-form')

  const pageTitle = document.getElementById('page-title')
  const rolePill = document.getElementById('role-pill')
  const profileName = document.getElementById('profile-name')
  const profileEmail = document.getElementById('profile-email')
  const profileRole = document.getElementById('profile-role')
  const profileRoleChip = document.getElementById('profile-role-chip')

  const openAdminFromProfile = document.getElementById('open-admin-from-profile')
  const profileAdminLinkWrap = document.getElementById('profile-admin-link-wrap')

  let currentUser = null

  function showToast(message) {
    const toast = document.createElement('div')
    toast.textContent = message
    toast.style.position = 'fixed'
    toast.style.right = '16px'
    toast.style.bottom = '104px'
    toast.style.zIndex = '2000'
    toast.style.maxWidth = '340px'
    toast.style.padding = '12px 16px'
    toast.style.borderRadius = '16px'
    toast.style.background = 'rgba(37, 9, 17, 0.96)'
    toast.style.border = '1px solid rgba(215, 180, 106, 0.2)'
    toast.style.color = '#fff'
    toast.style.boxShadow = '0 14px 30px rgba(0, 0, 0, 0.28)'
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3200)
  }

  function prettyRole(email) {
    return email && email.toLowerCase() === 'frekopetersen1998@gmail.com'
      ? 'Bestyrelse'
      : 'Broder'
  }

  function isAdmin(email) {
    return email && email.toLowerCase() === 'frekopetersen1998@gmail.com'
  }

  function activateView(viewName) {
    const titles = {
      dashboard: 'DASHBOARD',
      events: 'BEGIVENHEDER',
      members: 'MEDLEMMER',
      messages: 'BESKEDER',
      profile: 'PROFIL',
      admin: 'ADMINPANEL'
    }

    document.querySelectorAll('.view').forEach((view) => {
      view.classList.remove('active')
    })

    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.remove('active')
    })

    const viewEl = document.getElementById(`view-${viewName}`)
    const navBtn = document.querySelector(`.nav-item[data-view="${viewName}"]`)

    if (viewEl) viewEl.classList.add('active')
    if (navBtn) navBtn.classList.add('active')
    if (pageTitle && titles[viewName]) pageTitle.textContent = titles[viewName]
  }

  function showLoggedOut(status = 'Afventer login') {
    authShell?.classList.remove('hidden')
    appShell?.classList.add('hidden')
    if (identityStatus) identityStatus.textContent = status
    requestBox?.classList.add('hidden')
    inviteBox?.classList.add('hidden')
    currentUser = null
  }

  function showAuthenticated(user) {
    currentUser = user

    const email = user?.email || ''
    const name = email ? email.split('@')[0] : 'Broder'
    const role = prettyRole(email)

    authShell?.classList.add('hidden')
    appShell?.classList.remove('hidden')

    if (identityStatus) identityStatus.textContent = 'Godkendt adgang'
    if (rolePill) rolePill.textContent = role
    if (profileName) profileName.textContent = name.toUpperCase()
    if (profileEmail) profileEmail.textContent = email
    if (profileRole) profileRole.textContent = role
    if (profileRoleChip) profileRoleChip.textContent = role

    if (profileAdminLinkWrap) {
      profileAdminLinkWrap.classList.toggle('hidden', !isAdmin(email))
    }
  }

  function getInviteToken() {
    const url = new URL(window.location.href)

    const queryToken =
      url.searchParams.get('invite_token') ||
      url.searchParams.get('confirmation_token') ||
      url.searchParams.get('token')

    if (queryToken) return queryToken

    const hash = window.location.hash || ''
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''))

    return (
      hashParams.get('invite_token') ||
      hashParams.get('confirmation_token') ||
      hashParams.get('token')
    )
  }

  function clearInviteTokenFromUrl() {
    const url = new URL(window.location.href)
    url.hash = ''
    url.searchParams.delete('invite_token')
    url.searchParams.delete('confirmation_token')
    url.searchParams.delete('token')
    window.history.replaceState({}, document.title, url.pathname + url.search)
  }

  document.getElementById('open-login')?.addEventListener('click', () => {
    if (!netlifyIdentity) {
      showToast('Netlify Identity blev ikke loadet')
      return
    }

    netlifyIdentity.open('login')
  })

  document.getElementById('open-request')?.addEventListener('click', () => {
    requestBox?.classList.toggle('hidden')
    inviteBox?.classList.add('hidden')
  })

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try {
      await netlifyIdentity?.logout()
    } catch {}
    showLoggedOut()
  })

  openAdminFromProfile?.addEventListener('click', () => {
    if (isAdmin(currentUser?.email)) {
      activateView('admin')
    }
  })

  document.querySelectorAll('.nav-item[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activateView(btn.dataset.view)
    })
  })

  requestAccessForm?.addEventListener('submit', async (e) => {
    e.preventDefault()
    showToast('Anmodningsflow kobler vi på i næste step')
    e.target.reset()
    requestBox?.classList.add('hidden')
  })

  inviteForm?.addEventListener('submit', async (e) => {
    e.preventDefault()

    const fd = new FormData(e.target)
    const password = String(fd.get('password') || '')
    const password2 = String(fd.get('password2') || '')
    const token = getInviteToken()

    if (!token) {
      showToast('Intet invite-token fundet')
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
      const res = await fetch('/.netlify/identity/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          type: 'signup'
        })
      })

      const raw = await res.text()
      let data = {}
      try {
        data = raw ? JSON.parse(raw) : {}
      } catch {
        data = { error: raw || 'Ukendt fejl' }
      }

      if (!res.ok) {
        throw new Error(data.msg || data.error || 'Kunne ikke aktivere konto')
      }

      clearInviteTokenFromUrl()
      showToast('Konto aktiveret. Log ind nu.')
      showLoggedOut('Konto aktiveret — log ind')
    } catch (error) {
      showToast(error.message || 'Kunne ikke aktivere konto')
    }
  })

  if (netlifyIdentity) {
    netlifyIdentity.init()

    netlifyIdentity.on('init', (user) => {
      const inviteToken = getInviteToken()

      if (inviteToken) {
        showLoggedOut('Invitation fundet — vælg adgangskode')
        inviteBox?.classList.remove('hidden')
        requestBox?.classList.add('hidden')
        return
      }

      if (user) {
        showAuthenticated(user)
        activateView('dashboard')
      } else {
        showLoggedOut('Afventer login')
      }
    })

    netlifyIdentity.on('login', (user) => {
      netlifyIdentity.close()
      showAuthenticated(user)
      activateView('dashboard')
    })

    netlifyIdentity.on('logout', () => {
      showLoggedOut()
    })

    netlifyIdentity.on('error', (err) => {
      console.error('Identity-fejl:', err)
      showToast(err?.message || 'Identity-fejl')
    })
  }

  const existingUser = netlifyIdentity?.currentUser?.()
  if (existingUser) {
    showAuthenticated(existingUser)
    activateView('dashboard')
  } else if (!getInviteToken()) {
    showLoggedOut('Afventer login')
  }
})
window.addEventListener('DOMContentLoaded', () => {
  const netlifyIdentity = window.netlifyIdentity
  const supabaseGlobal = window.supabase

  const SUPABASE_URL = 'https://ejzlncnxtlbboqpetuce.supabase.co'
  const SUPABASE_ANON_KEY = 'sb_publishable_FEcIPwzSv4Dgan2N3Ngrwg_QNDj9IaO'

  if (!netlifyIdentity) {
    console.error('Netlify Identity widget blev ikke loadet')
  } else {
    netlifyIdentity.init()
  }

  if (!supabaseGlobal) {
    console.error('Supabase script blev ikke loadet')
  }

  const supabase = supabaseGlobal?.createClient
    ? supabaseGlobal.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null

  const authShell = document.getElementById('auth-shell')
  const appShell = document.getElementById('app-shell')
  const identityStatus = document.getElementById('identity-status')

  const loginBox = document.getElementById('login-box')
  const requestBox = document.getElementById('request-box')
  const inviteBox = document.getElementById('invite-box')

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

  const profileEditorModal = document.getElementById('profile-editor-modal')
  const profileEditorForm = document.getElementById('profile-editor-form')
  const closeProfileEditorBtn = document.getElementById('close-profile-editor')
  const cancelProfileEditorBtn = document.getElementById('cancel-profile-editor')

  const editorEmail = document.getElementById('editor-email')
  const editorFullName = document.getElementById('editor-full-name')
  const editorRole = document.getElementById('editor-role')
  const editorStatus = document.getElementById('editor-status')

  let currentUser = null
  let currentProfile = null
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
    toast.style.maxWidth = '360px'
    toast.style.padding = '12px 16px'
    toast.style.borderRadius = '14px'
    toast.style.background = 'rgba(37, 9, 17, 0.96)'
    toast.style.border = '1px solid rgba(215, 180, 106, 0.22)'
    toast.style.color = '#fff'
    toast.style.boxShadow = '0 14px 30px rgba(0,0,0,.28)'
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3800)
  }

  function prettyRole(role) {
    return role === 'admin' ? 'Bestyrelse' : 'Broder'
  }

  function prettyStatus(status) {
    if (status === 'pending') return 'Afventer'
    if (status === 'rejected') return 'Afvist'
    return 'Aktiv'
  }

  function getInviteToken() {
    const url = new URL(window.location.href)
    const fromQuery =
      url.searchParams.get('invite_token') ||
      url.searchParams.get('confirmation_token') ||
      url.searchParams.get('token')

    if (fromQuery) return fromQuery

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
    history.replaceState({}, document.title, url.pathname + url.search)
  }

  async function fetchJSON(url, options = {}) {
    const headers = { ...(options.headers || {}) }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    if (currentUser && currentUser.email) {
      headers['x-user-email'] = currentUser.email
    }

    const response = await fetch(url, {
      ...options,
      headers
    })

    const rawText = await response.text()

    let data = {}
    try {
      data = rawText ? JSON.parse(rawText) : {}
    } catch {
      throw new Error(rawText || `HTTP ${response.status}`)
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP ${response.status}`)
    }

    return data
  }

  async function syncProfile() {
    try {
      const result = await fetchJSON('/.netlify/functions/sync-profile', {
        method: 'POST',
        body: JSON.stringify({})
      })

      currentProfile = result.profile || null
      return currentProfile
    } catch (error) {
      console.error('syncProfile fejl:', error)
      return null
    }
  }

  function showLoggedOut(status = 'Afventer login') {
    if (authShell) authShell.classList.remove('hidden')
    if (appShell) appShell.classList.add('hidden')
    if (identityStatus) identityStatus.textContent = status

    if (loginBox) loginBox.classList.add('hidden')
    if (requestBox) requestBox.classList.add('hidden')
    if (inviteBox) inviteBox.classList.add('hidden')

    currentUser = null
    currentProfile = null
  }

  function showAuthenticated(user) {
    currentUser = user

    const email = user?.email || ''
    const fallbackName = email.split('@')[0] || 'Broder'
    const role = currentProfile?.role || 'member'
    const fullName = currentProfile?.full_name || fallbackName

    if (authShell) authShell.classList.add('hidden')
    if (appShell) appShell.classList.remove('hidden')

    if (identityStatus) identityStatus.textContent = 'Godkendt adgang'
    if (rolePill) rolePill.textContent = prettyRole(role)
    if (profileRole) profileRole.textContent = prettyRole(role)
    if (profileName) profileName.textContent = fullName
    if (profileEmail) profileEmail.textContent = email

    if (profileAdminLinkWrap) {
      profileAdminLinkWrap.classList.toggle('hidden', role !== 'admin')
    }
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
    if (pageTitle) pageTitle.textContent = titles[viewName] || 'Dashboard'
  }

  function renderStats() {
    if (statEvents) statEvents.textContent = String(currentData.events.length)
    if (statMembers) statMembers.textContent = String(currentData.members.length)
    if (statMessages) statMessages.textContent = String(currentData.messages.length)
  }

  function renderEvents() {
    if (!eventList) return

    if (!currentData.events.length) {
      eventList.innerHTML = '<div class="item"><p class="muted">Ingen begivenheder endnu.</p></div>'
      return
    }

    eventList.innerHTML = currentData.events.map((event) => `
      <article class="item">
        <p class="eyebrow">${event.starts_at || ''}</p>
        <h3>${event.title || 'Uden titel'}</h3>
        <p class="muted">${event.location || ''}</p>
        <p class="muted">${event.description || ''}</p>
      </article>
    `).join('')
  }

  function renderMembers() {
    if (!memberList) return

    const isAdmin = currentProfile?.role === 'admin'

    if (!currentData.members.length) {
      memberList.innerHTML = '<div class="item"><p class="muted">Ingen medlemmer endnu.</p></div>'
      return
    }

    memberList.innerHTML = currentData.members.map((member) => `
      <article class="item">
        <h3>${member.full_name || member.email || 'Ukendt medlem'}</h3>
        <p class="muted">${member.email || ''}</p>
        <p class="muted">Rolle: ${prettyRole(member.role || 'member')}</p>
        <p class="muted">Status: ${prettyStatus(member.status || 'active')}</p>
        ${
          isAdmin
            ? `
              <div class="item-actions">
                <button
                  type="button"
                  data-edit-profile-email="${member.email}"
                  data-edit-profile-name="${member.full_name || ''}"
                  data-edit-profile-role="${member.role || 'member'}"
                  data-edit-profile-status="${member.status || 'active'}"
                >
                  Redigér profil
                </button>
              </div>
            `
            : ''
        }
      </article>
    `).join('')
  }

  function renderMessages() {
    if (!messageList) return

    if (!currentData.messages.length) {
      messageList.innerHTML = '<div class="item"><p class="muted">Ingen beskeder endnu.</p></div>'
      return
    }

    messageList.innerHTML = currentData.messages.map((message) => `
      <article class="item">
        <p class="eyebrow">${message.created_at || ''}</p>
        <h3>${message.title || 'Besked'}</h3>
        <p class="muted">${message.body || ''}</p>
      </article>
    `).join('')
  }

  function renderApprovals() {
    if (!approvalList) return

    const role = currentProfile?.role || 'member'
    if (role !== 'admin') {
      approvalList.innerHTML = '<div class="item"><p class="muted">Kun admin kan se godkendelser.</p></div>'
      return
    }

    const pending = currentData.approvals.filter((item) => item.status === 'pending')

    if (!pending.length) {
      approvalList.innerHTML = '<div class="item"><p class="muted">Ingen afventende godkendelser.</p></div>'
      return
    }

    approvalList.innerHTML = pending.map((item) => `
      <article class="item">
        <p class="eyebrow">Afventende godkendelse</p>
        <h3>${item.name || 'Ukendt navn'}</h3>
        <p class="muted">${item.email || ''}</p>
        <p class="muted">${item.note || ''}</p>
        <div class="item-actions">
          <button type="button" data-approve-email="${item.email}">Markér som inviteret</button>
          <button type="button" data-copy-email="${item.email}">Kopiér e-mail</button>
          <button type="button" data-reject-email="${item.email}">Afvis</button>
        </div>
      </article>
    `).join('')
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
      const data = await fetchJSON('/.netlify/functions/list-data')

      currentData = {
        events: data.events || [],
        members: data.members || [],
        messages: data.messages || [],
        approvals: data.approvals || []
      }

      if (data.me) {
        currentProfile = data.me
      }

      renderAll()
    } catch (error) {
      console.error('loadData fejl:', error)
      showToast(error.message || 'Kunne ikke hente data')
    }
  }

  function openProfileEditorModal(member) {
    if (!profileEditorModal) return

    if (editorEmail) editorEmail.value = member.email || ''
    if (editorFullName) editorFullName.value = member.full_name || ''
    if (editorRole) editorRole.value = member.role || 'member'
    if (editorStatus) editorStatus.value = member.status || 'active'

    profileEditorModal.classList.remove('hidden')
    profileEditorModal.setAttribute('aria-hidden', 'false')
  }

  function closeProfileEditorModal() {
    if (!profileEditorModal) return
    profileEditorModal.classList.add('hidden')
    profileEditorModal.setAttribute('aria-hidden', 'true')
  }

  async function openProfileEditor({ email, fullName, role, status }) {
    openProfileEditorModal({
      email,
      full_name: fullName,
      role,
      status
    })
  }

  async function testDB() {
    if (!supabase) return
    const { data, error } = await supabase.from('profiles').select('*')
    console.log('TEST:', data, error)
  }

  const openLoginBtn = document.getElementById('open-login')
  if (openLoginBtn) {
    openLoginBtn.addEventListener('click', () => {
      if (!netlifyIdentity) {
        showToast('Netlify Identity widget blev ikke loadet')
        return
      }
      netlifyIdentity.open('login')
    })
  }

  const openRequestBtn = document.getElementById('open-request')
  if (openRequestBtn) {
    openRequestBtn.addEventListener('click', () => {
      if (requestBox) requestBox.classList.toggle('hidden')
      if (loginBox) loginBox.classList.add('hidden')
      if (inviteBox) inviteBox.classList.add('hidden')
    })
  }

  const logoutBtn = document.getElementById('logout-btn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await netlifyIdentity.logout()
      } catch {}
      showLoggedOut()
    })
  }

  if (openAdminFromProfile) {
    openAdminFromProfile.addEventListener('click', () => {
      if (currentProfile?.role === 'admin') {
        activateView('admin')
      }
    })
  }

  document.querySelectorAll('.nav-item[data-view]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view
      if (view === 'admin' && currentProfile?.role !== 'admin') {
        showToast('Kun admin har adgang')
        return
      }
      activateView(view)
    })
  })

  if (requestAccessForm) {
    requestAccessForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      try {
        const form = new FormData(e.target)
        const payload = {
          name: String(form.get('name') || '').trim(),
          email: String(form.get('email') || '').trim(),
          note: String(form.get('note') || '').trim()
        }

        const result = await fetchJSON('/.netlify/functions/request-access', {
          method: 'POST',
          body: JSON.stringify(payload)
        })

        e.target.reset()
        if (requestBox) requestBox.classList.add('hidden')
        showToast(result?.message || 'Din anmodning er sendt')
      } catch (error) {
        console.error('request-access fejl:', error)
        showToast(error.message || 'Kunne ikke sende anmodning')
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
        if (identityStatus) {
          identityStatus.textContent = 'Invite-fejl: Intet invite-token fundet'
        }
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

      if (!netlifyIdentity?.gotrue) {
        showToast('Identity-klienten er ikke klar')
        return
      }

      try {
        await netlifyIdentity.gotrue.acceptInvite(token, password)
        clearInviteTokenFromUrl()

        const user = netlifyIdentity.currentUser()

        if (user) {
          currentUser = user
          await syncProfile()
          showAuthenticated(user)
          activateView('dashboard')
          await loadData()
          showToast('Konto aktiveret')
          return
        }

        showLoggedOut('Konto aktiveret — log ind')
        showToast('Konto aktiveret — log ind nu')
      } catch (error) {
        console.error('acceptInvite fejl:', error)
        showToast(error.message || 'Kunne ikke aktivere konto')
        if (identityStatus) {
          identityStatus.textContent = `Invite-fejl: ${error.message || 'ukendt fejl'}`
        }
      }
    })
  }

  if (profileEditorForm) {
    profileEditorForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      try {
        await fetchJSON('/.netlify/functions/admin-update-profile', {
          method: 'POST',
          body: JSON.stringify({
            email: editorEmail?.value || '',
            full_name: editorFullName?.value?.trim() || '',
            role: editorRole?.value || 'member',
            status: editorStatus?.value || 'active'
          })
        })

        closeProfileEditorModal()
        showToast('Profil opdateret')
        await loadData()
      } catch (error) {
        console.error('admin-update-profile fejl:', error)
        showToast(error.message || 'Kunne ikke opdatere profil')
      }
    })
  }

  if (closeProfileEditorBtn) {
    closeProfileEditorBtn.addEventListener('click', closeProfileEditorModal)
  }

  if (cancelProfileEditorBtn) {
    cancelProfileEditorBtn.addEventListener('click', closeProfileEditorModal)
  }

  document.addEventListener('click', async (e) => {
    if (e.target.closest('[data-close-profile-editor="true"]')) {
      closeProfileEditorModal()
      return
    }

    const editProfileBtn = e.target.closest('[data-edit-profile-email]')
    if (editProfileBtn) {
      await openProfileEditor({
        email: editProfileBtn.dataset.editProfileEmail,
        fullName: editProfileBtn.dataset.editProfileName,
        role: editProfileBtn.dataset.editProfileRole,
        status: editProfileBtn.dataset.editProfileStatus
      })
      return
    }

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
        showToast(error.message || 'Kunne ikke godkende')
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
        showToast(error.message || 'Kunne ikke afvise')
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

  if (netlifyIdentity) {
    netlifyIdentity.on('init', async (user) => {
      const inviteToken = getInviteToken()

      if (inviteToken) {
        showLoggedOut('Invitation fundet — vælg adgangskode')
        if (inviteBox) inviteBox.classList.remove('hidden')
        if (loginBox) loginBox.classList.add('hidden')
        if (requestBox) requestBox.classList.add('hidden')
        return
      }

      if (user) {
        currentUser = user
        await syncProfile()
        showAuthenticated(user)
        activateView('dashboard')
        await loadData()
      } else {
        showLoggedOut('Afventer login')
      }
    })

    netlifyIdentity.on('login', async (user) => {
      netlifyIdentity.close()
      currentUser = user
      await syncProfile()
      showAuthenticated(user)
      activateView('dashboard')
      await loadData()
    })

    netlifyIdentity.on('logout', () => {
      showLoggedOut()
    })

    netlifyIdentity.on('error', (err) => {
      console.error('Identity-fejl:', err)
      showToast(err?.message || 'Identity-fejl')
    })
  }

  async function boot() {
    try {
      testDB()

      const inviteToken = getInviteToken()

      if (inviteToken) {
        showLoggedOut('Invitation fundet — vælg adgangskode')
        if (inviteBox) inviteBox.classList.remove('hidden')
        if (loginBox) loginBox.classList.add('hidden')
        if (requestBox) requestBox.classList.add('hidden')
        return
      }

      const user = netlifyIdentity?.currentUser?.()

      if (user) {
        currentUser = user
        await syncProfile()
        showAuthenticated(user)
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

  boot()
})
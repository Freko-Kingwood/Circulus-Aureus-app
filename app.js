import { login, logout, getUser, handleAuthCallback, acceptInvite } from '@netlify/identity'

const authShell = document.getElementById('auth-shell')
const appShell = document.getElementById('app-shell')

const identityStatus = document.getElementById('identity-status')

const loginForm = document.getElementById('login-form')
const requestForm = document.getElementById('request-access-form')
const inviteForm = document.getElementById('invite-form')

const inviteBox = document.getElementById('invite-box')

const views = {
  dashboard: document.getElementById('view-dashboard'),
  events: document.getElementById('view-events'),
  members: document.getElementById('view-members'),
  messages: document.getElementById('view-messages'),
  admin: document.getElementById('view-admin')
}

const adminEmail = 'frekopetersen1998@gmail.com'

function showAuth() {
  authShell.classList.remove('hidden')
  appShell.classList.add('hidden')
}

function showApp(user) {
  authShell.classList.add('hidden')
  appShell.classList.remove('hidden')

  if (user.email !== adminEmail) {
    document.querySelector('[data-view="admin"]').style.display = 'none'
  }

  loadData()
}

async function loadData() {
  const res = await fetch('/.netlify/functions/list-data')
  const data = await res.json()
  console.log(data)
}

document.querySelectorAll('[data-view]').forEach(btn=>{
  btn.onclick = () => {
    Object.values(views).forEach(v=>v.classList.add('hidden'))
    views[btn.dataset.view].classList.remove('hidden')
  }
})

loginForm.onsubmit = async e=>{
  e.preventDefault()
  const fd = new FormData(loginForm)
  const user = await login(fd.get('email'), fd.get('password'))
  showApp(user)
}

requestForm.onsubmit = async e=>{
  e.preventDefault()
  const fd = new FormData(requestForm)

  await fetch('/.netlify/functions/request-access',{
    method:'POST',
    body:JSON.stringify(Object.fromEntries(fd))
  })
}

inviteForm.onsubmit = async e=>{
  e.preventDefault()
  const fd = new FormData(inviteForm)

  const token = new URLSearchParams(location.hash.replace('#','')).get('invite_token')

  const user = await acceptInvite(token, fd.get('password'))
  showApp(user)
}

async function boot(){
  const hash = location.hash

  if(hash.includes('invite_token')){
    inviteBox.classList.remove('hidden')
    showAuth()
    return
  }

  try{
    const cb = await handleAuthCallback()
    const user = cb?.user || await getUser()

    if(user) showApp(user)
    else showAuth()
  }catch{
    showAuth()
  }
}

boot()
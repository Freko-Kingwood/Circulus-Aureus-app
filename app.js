import netlifyIdentity from '@netlify/identity';

netlifyIdentity.init();

const authShell = document.getElementById('auth-shell');
const appShell = document.getElementById('app-shell');
const identityStatus = document.getElementById('identity-status');

function showApp(user) {
  authShell.classList.add('hidden');
  appShell.classList.remove('hidden');
  identityStatus.textContent = `Logget ind som ${user.email}`;
}

function showLogin() {
  authShell.classList.remove('hidden');
  appShell.classList.add('hidden');
  identityStatus.textContent = 'Afventer login';
}

// 🔥 DET HER FIXER INVITE FLOW
async function handleInvite() {
  if (window.location.hash.includes('invite_token')) {
    try {
      await netlifyIdentity.completeUser();
    } catch (e) {
      console.log('Invite error:', e.message);
    }
  }
}

handleInvite();

// Login
document.getElementById('open-login').addEventListener('click', () => {
  netlifyIdentity.open();
});

// Logout
document.getElementById('logout-btn')?.addEventListener('click', () => {
  netlifyIdentity.logout();
});

// Events
netlifyIdentity.on('login', user => {
  showApp(user);
  netlifyIdentity.close();
});

netlifyIdentity.on('logout', () => {
  showLogin();
});

netlifyIdentity.on('init', user => {
  if (user) {
    showApp(user);
  } else {
    showLogin();
  }
});
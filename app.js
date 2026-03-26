let user = null;

function login() {
  user = document.getElementById('username').value;
  if (!user) return alert("Indtast navn");

  document.getElementById('login').style.display = 'none';
  document.getElementById('content').style.display = 'block';
}

async function loadMessages() {
  const res = await fetch('/.netlify/functions/list-data');
  const data = await res.json();

  const list = document.getElementById('messages');
  list.innerHTML = '';

  (data.messages || []).forEach(m => {
    const li = document.createElement('li');
    li.textContent = m.title;
    list.appendChild(li);
  });
}
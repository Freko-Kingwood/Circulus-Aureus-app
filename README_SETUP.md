<!DOCTYPE html>
<html lang="da">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Circulus Aureus</title>
  <meta name="theme-color" content="#2b0f16" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="ambient ambient-a"></div>
  <div class="ambient ambient-b"></div>

  <div id="auth-shell" class="auth-shell">
    <div class="login-panel glass">
      <div class="crest-wrap">
        <img src="assets/crest.jpeg" alt="Circulus Aureus våbenskjold" class="crest" />
      </div>
      <p class="eyebrow">Circulus Aureus</p>
      <h1>Det digitale logerum</h1>
      <p class="login-copy">Privat medlemsplatform til begivenheder, referater, medlemmer og interne beskeder.</p>

      <div class="login-actions">
        <button id="open-login" class="btn btn-primary" type="button">Log ind</button>
        <button id="open-signup" class="btn btn-secondary" type="button">Anmod om adgang</button>
      </div>

      <div class="status-card">
        <span class="status-dot"></span>
        <span id="identity-status">Afventer login</span>
      </div>

      <p class="login-note">
        Login kører via Netlify Identity. Admin låses op for e-mails i miljøvariablen
        ADMIN_EMAILS.
      </p>
    </div>
  </div>

  <div id="app-shell" class="app-shell hidden">
    <aside class="sidebar glass">
      <div class="brand">
        <img src="assets/crest.jpeg" alt="Circulus Aureus våbenskjold" class="brand-crest" />
        <div>
          <p class="eyebrow">Circulus Aureus</p>
          <h2>Det digitale logerum</h2>
        </div>
      </div>

      <nav class="nav-list">
        <button class="nav-item active" data-view="dashboard">Dashboard</button>
        <button class="nav-item" data-view="events">Begivenheder</button>
        <button class="nav-item" data-view="documents">Referater</button>
        <button class="nav-item" data-view="members">Medlemmer</button>
        <button class="nav-item" data-view="messages">Beskeder</button>
        <button class="nav-item" data-view="profile">Profil</button>
        <button id="admin-tab" class="nav-item hidden" data-view="admin">Admin</button>
      </nav>

      <div class="sidebar-footer">
        <div class="mini-user">
          <div class="mini-avatar" id="mini-avatar">CA</div>
          <div>
            <strong id="mini-name">Medlem</strong>
            <p id="mini-email">Ikke logget ind</p>
          </div>
        </div>
        <button id="logout-btn" class="btn btn-secondary btn-full" type="button">Log ud</button>
      </div>
    </aside>

    <main class="main-panel">
      <header class="topbar glass">
        <div>
          <p class="eyebrow">Privat område</p>
          <h1 id="page-title">Dashboard</h1>
        </div>
        <div class="top-actions">
          <div id="role-pill" class="pill">Medlem</div>
        </div>
      </header>

      <section id="view-dashboard" class="view active-view">
        <div class="hero glass">
          <div>
            <p class="eyebrow">Velkommen</p>
            <h2>Det indre rum er åbent</h2>
            <p>Her finder du kommende begivenheder, referater, medlemmer og interne beskeder samlet ét sted.</p>
            <div class="hero-actions">
              <button class="btn btn-primary nav-jump" data-view="events" type="button">Se begivenheder</button>
              <button class="btn btn-secondary nav-jump" data-view="documents" type="button">Se referater</button>
            </div>
          </div>
          <img src="assets/crest.jpeg" alt="Circulus Aureus våbenskjold" class="hero-crest" />
        </div>

        <div class="grid three">
          <article class="card glass stat">
            <span id="stat-events">0</span>
            <p>Begivenheder</p>
          </article>
          <article class="card glass stat">
            <span id="stat-docs">0</span>
            <p>Referater</p>
          </article>
          <article class="card glass stat">
            <span id="stat-members">0</span>
            <p>Medlemmer</p>
          </article>
        </div>
      </section>

      <section id="view-events" class="view">
        <div class="section-head"><h2>Begivenheder</h2></div>
        <div id="events-list" class="stack"></div>
      </section>

      <section id="view-documents" class="view">
        <div class="section-head"><h2>Referater og dokumenter</h2></div>
        <div id="documents-list" class="stack"></div>
      </section>

      <section id="view-members" class="view">
        <div class="section-head"><h2>Medlemmer</h2></div>
        <div id="members-list" class="grid three"></div>
      </section>

      <section id="view-messages" class="view">
        <div class="section-head"><h2>Beskeder</h2></div>
        <div id="messages-list" class="stack"></div>
      </section>

      <section id="view-profile" class="view">
        <div class="grid two">
          <article class="card glass member-card">
            <p class="eyebrow">Digitalt medlemskort</p>
            <h3 id="profile-name">Medlem</h3>
            <p id="profile-email">Ikke logget ind</p>
            <div class="member-card-chip" id="profile-role">Medlem</div>
          </article>
          <article class="card glass">
            <p class="eyebrow">Status</p>
            <h3>Aktiv adgang</h3>
            <p>Din adgang styres via Netlify Identity. Adminbrugere bestemmes af e-mails i ADMIN_EMAILS.</p>
          </article>
        </div>
      </section>

      <section id="view-admin" class="view">
        <div class="section-head"><h2>Adminpanel</h2></div>

        <div class="grid two">
          <article class="card glass">
            <p class="eyebrow">Ny begivenhed</p>
            <form id="event-form" class="form-stack">
              <input name="title" placeholder="Titel" required />
              <input name="datetime" placeholder="Dato og tidspunkt" required />
              <input name="location" placeholder="Sted" required />
              <textarea name="description" placeholder="Beskrivelse"></textarea>
              <button class="btn btn-primary" type="submit">Gem begivenhed</button>
            </form>
          </article>

          <article class="card glass">
            <p class="eyebrow">Nyt medlem</p>
            <form id="member-form" class="form-stack">
              <input name="name" placeholder="Navn" required />
              <input name="email" placeholder="E-mail" required />
              <input name="since" placeholder="Medlem siden" />
              <button class="btn btn-primary" type="submit">Gem medlem</button>
            </form>
          </article>

          <article class="card glass">
            <p class="eyebrow">Ny besked</p>
            <form id="message-form" class="form-stack">
              <input name="title" placeholder="Overskrift" required />
              <textarea name="body" placeholder="Besked" required></textarea>
              <button class="btn btn-primary" type="submit">Gem besked</button>
            </form>
          </article>

          <article class="card glass">
            <p class="eyebrow">Upload referat</p>
            <form id="document-form" class="form-stack">
              <input name="title" placeholder="Titel" required />
              <input name="note" placeholder="Beskrivelse" />
              <input name="file" type="file" required />
              <button class="btn btn-primary" type="submit">Upload fil</button>
            </form>
          </article>
        </div>
      </section>
    </main>

    <nav class="mobile-nav glass">
      <button class="nav-item active" data-view="dashboard">Hjem</button>
      <button class="nav-item" data-view="events">Events</button>
      <button class="nav-item" data-view="documents">Referat</button>
      <button class="nav-item" data-view="members">Medl.</button>
      <button class="nav-item" data-view="profile">Profil</button>
    </nav>
  </div>

  <div id="toast" class="toast hidden"></div>

  <script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
  <script type="module" src="app.js"></script>
</body>
</html>

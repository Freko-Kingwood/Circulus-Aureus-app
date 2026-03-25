# Circulus Aureus V4

Denne version er en **Netlify-baseret medlemsapp** med:
- login via Netlify Identity
- begivenheder med Ja / Måske / Nej
- upload af referater og vedhæftninger
- medlemsliste med tilføj/fjern
- opslagstavle
- adminpanel
- vedvarende data via Netlify Blobs

## Vigtigt om deployment
For denne version bør du **ikke** bruge ren drag-and-drop af zip i Netlify Drop, fordi appen bruger **Functions + Identity + Blobs**.
Brug i stedet enten:
1. **Git-import i Netlify** (anbefalet)
2. **Netlify CLI**

## A. Nemmeste måde: Git-import
1. Pak projektet ud lokalt.
2. Opret et GitHub-repo og upload filerne.
3. I Netlify: vælg **Add new project** → importer repoet.
4. Netlify installerer dependencies og deployer functions automatisk.

## B. CLI-måde
1. Installer Node.js lokalt.
2. Kør:
   ```bash
   npm install
   npm install -g netlify-cli
   netlify login
   netlify init
   netlify deploy --build
   netlify deploy --prod --build
   ```

## Login opsætning
1. Gå til **Project configuration → Identity**.
2. Klik **Enable Identity**.
3. Vælg helst **Invite only**.
4. Inviter medlemmer via **Identity → Users**.
5. Sæt miljøvariablen `ADMIN_EMAILS` til din e-mail i:
   **Project configuration → Environment variables**
   Eksempel:
   ```
   ADMIN_EMAILS=dinmail@eksempel.dk,andreadmin@eksempel.dk
   ```
6. Redeploy sitet efter du har sat miljøvariablen.

## Sådan virker admin
- Alle nye brugere får rollen `member` automatisk via `identity-signup` funktionen.
- Appen giver admin-adgang, hvis brugerens e-mail står i `ADMIN_EMAILS` eller hvis brugeren har rollen `admin` i Netlify Identity.
- Hvis du ændrer roller i Netlify, skal brugeren logge ind igen for at få nyt token.

## Det som er med nu
- Hjem-dashboard
- Begivenheder med RSVP
- Referater/dokumenter med filupload
- Medlemsoversigt
- Beskeder/opslag
- Profil
- Adminpanel til at oprette event, upload dokument, tilføje medlem og poste opslag

## Begrænsninger i denne version
- “Tilføj medlem” opretter medlemmet i appens medlemsliste, men sender ikke automatisk Netlify Identity-invitation. Invitation til login sker stadig fra Netlify UI.
- Der er ikke e-mailnotifikationer endnu.
- Der er ikke ægte kalender-sync endnu.

## Gode næste trin
- automatisk e-mailnotifikation ved nyt opslag eller nyt referat
- søgning og filtrering
- redigering af events og dokumenter
- kommentarer på begivenheder og referater


## Rettelser i denne version
- Fikset Netlify Identity-login efter invitationslink.
- Fikset usynligt klik-lag fra Identity-widget.
- Fjernet dobbelt initialisering i frontend.

# 8C Klassentreffen

Terminabstimmungs-Tool für das Klassentreffen. Läuft auf GitHub Pages (Frontend) + Google Apps Script (Backend) + Google Sheets (Datenbank).

---

## Dateistruktur

```
/
├── index.html          # Haupt-App
├── css/
│   └── style.css       # Alle Styles
├── js/
│   ├── api.js          # Google Sheets Kommunikation
│   ├── app.js          # Abstimmen & Ergebnisse
│   └── admin.js        # Admin-Panel
├── Code.gs             # Google Apps Script Backend
└── README.md
```

---

## Setup: Schritt für Schritt

### 1. Google Sheets + Apps Script einrichten

1. Gehe zu [Google Sheets](https://sheets.google.com) und erstelle eine neue, leere Tabelle.
2. Klicke oben auf **Erweiterungen → Apps Script**.
3. Lösche den vorhandenen Code und füge den gesamten Inhalt von `Code.gs` ein.
4. Klicke auf **Speichern** (Disketten-Symbol).
5. Klicke auf **Deployen → Neue Bereitstellung**.
6. Wähle als Typ: **Web-App**.
7. Einstellungen:
   - Beschreibung: `Klassentreffen API`
   - Ausführen als: **Ich** (dein Google-Account)
   - Zugriff: **Jeder** (anonym)
8. Klicke auf **Bereitstellen** und bestätige die Berechtigungen.
9. Kopiere die angezeigte **Web-App-URL** (endet auf `/exec`).

### 2. URL in api.js eintragen

Öffne `js/api.js` und ersetze:

```js
const SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
```

durch die kopierte URL:

```js
const SCRIPT_URL = 'https://script.google.com/macros/s/DEINE_ID/exec';
```

### 3. GitHub Pages einrichten

1. Erstelle ein neues GitHub Repository (z.B. `klassentreffen`).
2. Lade alle Dateien hoch (**außer** `Code.gs` — die bleibt in Google).
3. Gehe zu **Settings → Pages**.
4. Wähle unter **Source**: `main` Branch, `/` (root).
5. Klicke auf **Save**.
6. Nach 1–2 Minuten ist die App unter `https://DEIN-USERNAME.github.io/klassentreffen` erreichbar.

---

## Admin-Zugang

- Standard-Passwort: **`admin1234`**
- **Bitte sofort nach dem ersten Login ändern** (Admin-Tab → Passwort ändern).

---

## Nutzung

### Teilnehmer
1. Namen eingeben und **Laden** drücken.
2. Tage antippen → Standard-Orte werden automatisch gewählt.
3. Einzelne Orte manuell anpassen.
4. **Speichern** drücken.
5. Zum erneuten Bearbeiten: einfach wieder denselben Namen eingeben.

### Admin
1. Auf **🔒 Admin** klicken und Passwort eingeben.
2. Monat auswählen → alle Samstage & Sonntage werden automatisch hinzugefügt.
3. Einzelne Tage über **×** entfernen.

---

## Hinweise

- Die Daten liegen in deiner Google Sheets Tabelle — du kannst sie jederzeit direkt einsehen.
- Bei Änderungen am Apps Script: erneut deployen und neue URL in `api.js` eintragen.
- Das Tool ist für kleine Gruppen (~30 Personen) ausgelegt.

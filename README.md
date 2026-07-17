# Grundstückswebsite Mittelsteg 46B

Statische, responsive Onepager-Website für den privaten Grundstücksverkauf.

## Vor dem Livegang zwingend anpassen

1. Kontaktdaten in `impressum.html`
2. Datenschutzerklärung rechtlich prüfen und an Hosting/Formulardienst anpassen
3. Entfernungsangaben nochmals mit einem Routendienst verifizieren
4. Aussage „Blick ins Grüne“ bzw. „unverbaubar“ nur verwenden, wenn belegbar
5. Erschließungsangaben final prüfen
6. Optional Kaufpreis ergänzen

## Schnellster Livegang mit Netlify

1. Ordner als ZIP hochladen oder Repository verbinden
2. Publish directory: Projektwurzel
3. Das Formular wird über Netlify Forms verarbeitet (`data-netlify="true"`)
4. Nach Deployment unter **Forms** Benachrichtigungsadresse konfigurieren

## Vercel / GitHub Pages

Die Seite läuft dort ebenfalls statisch. Das Kontaktformular benötigt dann jedoch einen externen Endpoint, z. B. Formspree, Basin oder eine eigene Serverless Function.

## Lokale Vorschau

```bash
python3 -m http.server 8080
```

Dann `http://localhost:8080` öffnen.

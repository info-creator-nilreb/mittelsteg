# Grundstückswebsite Mittelsteg 46B

Statische, responsive Onepager-Website für den privaten Grundstücksverkauf.

## Vor dem Livegang zwingend anpassen

1. Kontaktdaten in `impressum.html`
2. Datenschutzerklärung rechtlich prüfen und an Hosting/Formulardienst anpassen
3. Entfernungsangaben nochmals mit einem Routendienst verifizieren
4. Aussage „Blick ins Grüne“ bzw. „unverbaubar“ nur verwenden, wenn belegbar
5. Erschließungsangaben final prüfen
6. Optional Kaufpreis ergänzen

## Kontaktformular / E-Mail

Das Formular sendet Anfragen über [FormSubmit](https://formsubmit.co) an `berlin.alexander@icloud.com`.

**Wichtig beim ersten Test:** FormSubmit sendet eine Aktivierungs-Mail an diese Adresse.
Den Bestätigungslink einmal anklicken – erst danach werden Anfragen zugestellt.

## Schnellster Livegang mit Netlify

1. Ordner als ZIP hochladen oder Repository verbinden
2. Publish directory: Projektwurzel
3. Formular funktioniert host-unabhängig über FormSubmit

## Vercel / GitHub Pages

Die Seite läuft dort ebenfalls statisch. Das Kontaktformular ist bereits über FormSubmit angebunden.

## Lokale Vorschau

```bash
python3 -m http.server 8080
```

Dann `http://localhost:8080` öffnen.

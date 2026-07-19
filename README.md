# Grundstückswebsite Mittelsteg 46B

Statische, responsive Onepager-Website für den privaten Grundstücksverkauf.

## Vor dem Livegang zwingend anpassen

1. Kontaktdaten in `impressum.html`
2. Datenschutzerklärung rechtlich prüfen und an Hosting/Formulardienst anpassen
3. Entfernungsangaben nochmals mit einem Routendienst verifizieren
4. Aussage „Blick ins Grüne“ bzw. „unverbaubar“ nur verwenden, wenn belegbar
5. Erschließungsangaben final prüfen
6. Optional Kaufpreis ergänzen

## Suchmaschinen & KI-Crawler

Live-Domain: [https://mittelsteg46b.de/](https://mittelsteg46b.de/)

- Meta-Description, Canonical, Open Graph, Twitter Cards (absolute URLs)
- strukturierte Daten (Schema.org: RealEstateListing, Place, Product)
- `robots.txt` mit erlaubten KI-Crawlern und Sitemap-Verweis
- `sitemap.xml`
- `llms.txt` für KI-Assistenten (Zusammenfassung der Angebotsdaten)

## Kontaktformular / E-Mail

Das Formular sendet Anfragen über [FormSubmit](https://formsubmit.co) an `berlin.alexander@icloud.com`.

**Wichtig beim ersten Test:** FormSubmit sendet eine Aktivierungs-Mail an diese Adresse.
Den Bestätigungslink einmal anklicken – erst danach werden Anfragen zugestellt.

## Deploy mit Vercel

1. Repository auf GitHub mit Vercel verbinden (Framework Preset: Other / keine Build-Command)
2. Output/Root: Projektwurzel (`.`)
3. Domain `mittelsteg46b.de` in Vercel unter Domains hinzufügen und DNS umstellen
4. Formular funktioniert host-unabhängig über FormSubmit

Security-Header und Content-Types sind in `vercel.json` hinterlegt.

## Lokale Vorschau

```bash
python3 -m http.server 8080
```

Dann `http://localhost:8080` öffnen.

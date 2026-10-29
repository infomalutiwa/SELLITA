# SELLITA – Heizung & Sanitär

Vite + React + TypeScript, Tailwind, `lenis` (weiches Scrollen), `lucide-react` (Icons), Schrift Archivo (selbst gehostet über `@fontsource-variable`).
Gestaltet nach dem taste-skill (https://github.com/leonxlnx/taste-skill), Richtung „One motif“.

```bash
npm install
npm run dev      # Entwicklung
npm run build    # tsc + Produktionsbuild nach dist/
```

- Seite: `src/App.tsx` (Einstieg, Leistungen, Video-Band, Ablauf, Einsatzgebiet, Kontakt). Texte der Leistungen in `src/data.ts`.
- Das eine Motiv: die schräge Kante der Visitenkarte (anthrazit, blaue Linie). Sie schneidet Bilder und Videos zu (`.slant`),
  formt die Knöpfe (`.cut`) und das Band beim Einsatzgebiet. Farben und Schriftgrößen als Tokens in `src/index.css`.
- Abschnitte: Einstieg mit Video, Leistungsliste, Videoauswahl, Ablauf als aufklappbare Flächen, Einsatzgebiet mit PLZ-Prüfung,
  Anfrage als Coupon (`src/ui/Contact.tsx`), Fußzeile mit Schriftzug aus Blöcken.
- Foto Heizkörper: „Radiator-250558 1280“ von ri, CC0, Wikimedia Commons (`video-src/credits/credits.json`).
- Videos: kurze Schleifen je Leistung in `public/clips` (aus den Flow-Clips in `video-src/flow/`, 960 px, H.264), laufen nur, solange sie sichtbar sind.
  Der Werbefilm mit Texten entsteht mit `python3 video-src/build_film.py`.
- Kontakt ohne Backend: Telefon (`tel:`), WhatsApp (`wa.me` mit vorausgefülltem Text), E-Mail (`mailto:` mit vorausgefülltem Text), „Text kopieren“ als Rückfall.
- Impressum: Steuernummer, Inhaber und Kammer sind Platzhalter und vor dem Livegang zu ergänzen.
- Hosting: Firebase (`firebase.json`, Seite `sellita` → https://sellita.web.app).

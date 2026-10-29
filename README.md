# SELLITA – Sanitär • Leckortung • Sanierung

Vite + React + TypeScript, Tailwind, `lenis` (weiches Scrollen), `lucide-react` (Icons).

```bash
npm install
npm run dev      # Entwicklung
npm run build    # tsc + Produktionsbuild nach dist/
```

- Seite: `src/App.tsx` (Einstieg, 7 Leistungen, Ablauf, Einsatzgebiet, Kontakt), Texte der Leistungen in `src/data.ts`.
- Hintergrundfilm: `src/ui/BgFilm.tsx` spielt `public/video/frames` scroll-gesteuert ab. Jeder Abschnitt mit
  `data-film="<mark>"` zeigt seinen Teil des Films (`marks` in `public/video/manifest.json`).
- Film neu erzeugen (aus den Flow-Clips in `video-src/flow/`): `python3 video-src/build_web.py`.
  Der Werbefilm mit Texten entsteht mit `python3 video-src/build_film.py`.
- Kontakt ohne Backend: Telefon (`tel:`), WhatsApp (`wa.me` mit vorausgefülltem Text), E-Mail (`mailto:` mit
  vorausgefülltem Text) und „Text kopieren“ als Rückfall.
- Impressum: Steuernummer, Inhaber und Kammer sind Platzhalter und vor dem Livegang zu ergänzen.
- Die alte statische Seite liegt unter `legacy/index.html`.

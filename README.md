# SELLITA – Heizung & Sanitär

Vite + React + TypeScript, Tailwind, `lenis` (weiches Scrollen), `gsap` + ScrollTrigger (Scroll-Animationen),
`@react-three/fiber` + `drei` (3D), `lucide-react` (Icons), Schrift Archivo (selbst gehostet über `@fontsource-variable`).

```bash
npm install
npm run dev      # Entwicklung
npm run build    # tsc + Produktionsbuild nach dist/
```

- Seite: `src/App.tsx` (Einstieg, Leistungen, Video-Band, Ablauf, Einsatzgebiet, Kontakt). Texte der Leistungen in `src/data.ts`.
- Farben und Schräge nach der Visitenkarte: Anthrazit, Weiß, Blau (Sanitär), Rot (Heizung); Tokens in `src/index.css`.
- 3D im Einstieg: `src/ui/Tools3D.tsx` (wird nachgeladen). Werkzeug-Modelle von Poly Haven (CC0) in `public/models`,
  mit `npx @gltf-transform/cli optimize <in>.gltf <out>.glb --texture-compress webp --texture-size 1024 --compress meshopt` verkleinert.
  Licht kommt aus Softboxen (`Lightformer`), ohne HDR-Datei. Auf schwachen Geräten sinkt die Auflösung, notfalls wird nur noch beim Scrollen gezeichnet.
- Videos: kurze Schleifen je Leistung in `public/clips` (aus den Flow-Clips in `video-src/flow/`, 960 px, H.264), laufen nur, solange sie sichtbar sind.
  Der Werbefilm mit Texten entsteht mit `python3 video-src/build_film.py`.
- Kontakt ohne Backend: Telefon (`tel:`), WhatsApp (`wa.me` mit vorausgefülltem Text), E-Mail (`mailto:` mit vorausgefülltem Text), „Text kopieren“ als Rückfall.
- Impressum: Steuernummer, Inhaber und Kammer sind Platzhalter und vor dem Livegang zu ergänzen.
- Hosting: Firebase (`firebase.json`, Seite `sellita` → https://sellita.web.app).

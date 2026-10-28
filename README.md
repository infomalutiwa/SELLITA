# SELLITA – Sanitär • Leckortung • Sanierung · 3D-Scrollytelling

Vite + React + TypeScript, `three` / `@react-three/fiber` / `drei` / `postprocessing`, `gsap` (ScrollTrigger) + `lenis`, Tailwind, framer-motion.

```bash
npm install
npm run dev      # Entwicklung
npm run build    # tsc + Produktionsbuild nach dist/
npm run assets   # optional: lädt CC0-.glb (Khronos) nach public/models + manifest.json
```

- `src/scene/` – `HouseScene`, `PipeNetwork` (+ `FlowPipe`-Shader), `BathroomCutaway`, `LeakScanner`, `ServiceRadiusMap`, `CameraRig` (Keyframes), `ExternalModelLoader` (GLTF + ErrorBoundary + Suspense, Fallback auf prozedurale Meshes).
- `src/ui/` – Overlay-Karten, HUD-Navigation, Anfrage-Konfigurator, Impressum/Datenschutz.
- Der Anfrage-Konfigurator hat kein Backend: „Per E-Mail senden“ öffnet `mailto:selita.service@web.de`, alternativ WhatsApp/Anruf.
- Impressum: Steuernummer, Inhaber und Kammer sind Platzhalter und vor dem Livegang zu ergänzen.
- Die alte statische Seite liegt unter `legacy/index.html`.

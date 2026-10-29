import { useEffect } from 'react'
import { X } from 'lucide-react'
import { FIRMA } from '../data'

export type LegalKind = 'impressum' | 'datenschutz' | null

export function LegalModal({ kind, onClose }: { kind: LegalKind; onClose: () => void }) {
  useEffect(() => {
    if (!kind) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', esc)
    return () => removeEventListener('keydown', esc)
  }, [kind, onClose])
  return (
    <>
      {kind && (
        <div className="modal-in fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={onClose}>
          <div
            data-lenis-prevent
            role="dialog" aria-modal="true"
            className="max-h-[85vh] w-full max-w-xl overflow-y-auto bg-white p-6 text-sm leading-relaxed text-ink shadow-2xl" /* taste-skill-ignore: Dialog darf einen Schatten haben */
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{kind === 'impressum' ? 'Impressum' : 'Datenschutzerklärung'}</h2>
              <button onClick={onClose} aria-label="Schließen" className="p-1 hover:bg-tile"><X size={20} /></button>
            </div>
            {kind === 'impressum' ? (
              <div className="space-y-3">
                <p className="text-xs text-muted">Angaben gemäß § 5 DDG</p>
                <p><b>{FIRMA.name} – {FIRMA.sub}</b><br />{FIRMA.street}<br />{FIRMA.city}</p>
                <p><b>Kontakt</b><br />Telefon: <a className="text-water" href={FIRMA.tel}>{FIRMA.phone}</a><br />E-Mail: <a className="text-water" href={`mailto:${FIRMA.mail}`}>{FIRMA.mail}</a></p>
                <p><b>Steuerliche Angaben</b><br />{FIRMA.tax}</p>
                <p><b>Inhaber / Vertretungsberechtigte Person</b><br />[wird nachgereicht]</p>
                <p><b>Berufsbezeichnung / Kammer</b><br />Handwerk (Sanitär, Leckortung, Renovierung) – [Handwerkskammer / Eintragung: wird nachgereicht]</p>
                <p className="text-xs text-muted">Hinweis: Platzhalter in eckigen Klammern sind vor Veröffentlichung zu ergänzen.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p><b>Verantwortlicher</b><br />{FIRMA.name} – {FIRMA.sub}, {FIRMA.street}, {FIRMA.city}, E-Mail: {FIRMA.mail}</p>
                <p><b>Hosting / Server-Logfiles</b><br />Beim Aufruf der Seite verarbeitet der Hosting-Anbieter technisch notwendige Daten (IP-Adresse, Zeitpunkt, Browser) zur sicheren Auslieferung. [Hosting-Anbieter: wird nachgereicht]</p>
                <p><b>Anfrageformular</b><br />Ihre Eingaben werden nicht auf einem Server dieser Seite gespeichert. Erst wenn Sie „Per E-Mail senden“ oder „WhatsApp“ wählen, öffnet sich Ihr Mail- bzw. Messenger-Programm; die Übermittlung erfolgt dann über Ihren Anbieter. Verarbeitung zur Bearbeitung Ihrer Anfrage (Art. 6 Abs. 1 lit. b DSGVO).</p>
                <p><b>Externe Dienste</b><br />Es werden keine Tracking- oder Analyse-Dienste und keine externen Schriftarten (die Schrift liegt auf dieser Seite) geladen.</p>
                <p><b>Ihre Rechte</b><br />Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch und Beschwerde bei der zuständigen Aufsichtsbehörde (LfDI Baden-Württemberg).</p>
                <p className="text-xs text-muted">Muster-Datenschutzhinweis – bitte rechtlich prüfen lassen.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

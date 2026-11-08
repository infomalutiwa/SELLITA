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
                <p><b>{FIRMA.name}</b><br />{FIRMA.street}<br />{FIRMA.city}</p>
                <p><b>Kontakt</b><br />Telefon: <a className="text-water" href={FIRMA.tel}>{FIRMA.phone}</a><br />E-Mail: <a className="text-water" href={`mailto:${FIRMA.mail}`}>{FIRMA.mail}</a></p>
                <p><b>Steuerliche Angaben</b><br />{FIRMA.tax}</p>
                <p><b>Inhaber / Vertretungsberechtigte Person</b><br />[wird nachgereicht]</p>
                <p><b>Berufsbezeichnung / Kammer</b><br />Handwerk (Sanitär, Leckageortung, Renovierung) – [Handwerkskammer / Eintragung: wird nachgereicht]</p>
                <p className="text-xs text-muted">Hinweis: Platzhalter in eckigen Klammern sind vor Veröffentlichung zu ergänzen.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p><b>Verantwortlicher</b><br />{FIRMA.name}, {FIRMA.street}, {FIRMA.city}, E-Mail: {FIRMA.mail}</p>
                <p><b>Hosting / Server-Logfiles</b><br />Die Seite wird bei ALL-INKL.COM – Neue Medien Münnich, Hauptstraße 68, 02742 Friedersdorf (Deutschland) gehostet; mit dem Anbieter besteht ein Vertrag zur Auftragsverarbeitung. Beim Aufruf verarbeitet der Server technisch notwendige Daten (IP-Adresse, Datum und Uhrzeit, aufgerufene Datei, Browser) zur sicheren Auslieferung der Seite und zur Abwehr von Angriffen (Art. 6 Abs. 1 lit. f DSGVO). Die Logfiles werden nach kurzer Zeit automatisch gelöscht.</p>
                <p><b>Anfrageformular</b><br />Wenn Sie „Anfrage senden“ wählen, übermitteln wir Ihre Angaben (Name, Telefonnummer oder E-Mail-Adresse, Ort, Beschreibung, gewählte Leistung) über den Server dieser Seite per E-Mail an uns. Name und Kontaktmöglichkeit sind erforderlich, damit wir antworten können, alle anderen Angaben sind freiwillig. Wir verwenden die Daten nur, um Ihre Anfrage zu bearbeiten und mit Ihnen Kontakt aufzunehmen (Art. 6 Abs. 1 lit. b DSGVO, bei allgemeinen Anfragen Art. 6 Abs. 1 lit. f DSGVO). Auf dem Server der Seite werden die Angaben nicht gespeichert. Zum Schutz vor Missbrauch wird für kurze Zeit ein anonymer Hashwert Ihrer IP-Adresse in einer temporären Datei abgelegt, damit nicht in kurzer Zeit viele Anfragen abgeschickt werden können. Die Anfrage landet in unserem E-Mail-Postfach (WEB.DE, 1&amp;1 Mail &amp; Media GmbH, Montabaur). Wir löschen sie, sobald Ihr Anliegen erledigt ist und keine gesetzlichen Aufbewahrungspflichten entgegenstehen. E-Mails sind auf dem Transportweg nicht in jedem Fall verschlüsselt; senden Sie uns bitte keine sensiblen Daten.</p>
                <p><b>Telefon, E-Mail, WhatsApp</b><br />Wenn Sie uns anrufen, per E-Mail oder über WhatsApp schreiben, verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage (Art. 6 Abs. 1 lit. b DSGVO). Bei WhatsApp erfolgt die Übermittlung über WhatsApp (Meta), dabei können Daten in Drittländer gelangen; es gilt deren Datenschutzerklärung. Die Nutzung ist freiwillig, Sie können uns auch anrufen oder das Formular nutzen.</p>
                <p><b>Cookies, Tracking, externe Dienste</b><br />Die Seite setzt keine Cookies, nutzt keine Tracking- oder Analyse-Dienste und lädt keine externen Schriftarten oder Inhalte (Schrift und Bilder liegen auf dieser Seite).</p>
                <p><b>Ihre Rechte</b><br />Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Beschwerden richten Sie an die zuständige Aufsichtsbehörde: Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg (LfDI), Lautenschlagerstraße 20, 70173 Stuttgart.</p>
                <p className="text-xs text-muted">Stand: November 2026</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

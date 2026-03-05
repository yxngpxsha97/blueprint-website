import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacybeleid — Blueprint",
  description:
    "Privacybeleid van Blueprint. Lees hoe wij omgaan met uw persoonsgegevens conform de AVG/GDPR.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header bar */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            Terug naar homepage
          </Link>
        </div>
      </div>

      {/* Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Privacybeleid
        </h1>
        <p className="text-gray-500 mb-12">
          Laatst bijgewerkt: 5 maart 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-0 mb-3">
              1. Wie zijn wij
            </h2>
            <p>
              Blueprint is een AI-automatiseringsplatform voor het Nederlandse MKB,
              opgericht door Lorenzo Ruisi. Wij bieden webshops, WhatsApp-bots en
              offertegeneratoren aan als dienstverlening.
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>
                <strong>Bedrijfsnaam:</strong> Blueprint
              </li>
              <li>
                <strong>Contactpersoon:</strong> Lorenzo Ruisi
              </li>
              <li>
                <strong>E-mail:</strong> info@blueprint.nl
              </li>
              <li>
                <strong>Land:</strong> Nederland
              </li>
            </ul>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              2. Welke gegevens wij verzamelen
            </h2>
            <p>
              Wij verzamelen persoonsgegevens uitsluitend wanneer u deze
              vrijwillig aan ons verstrekt, bijvoorbeeld via het contactformulier
              of bij het gebruik van onze diensten.
            </p>
            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">
              2.1 Contactformulier
            </h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Bedrijfsnaam</li>
              <li>Naam contactpersoon</li>
              <li>Telefoonnummer</li>
              <li>E-mailadres</li>
              <li>Sector / branche</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">
              2.2 WhatsApp-communicatie
            </h3>
            <p>
              Indien u via onze WhatsApp-bot communiceert, verwerken wij het
              telefoonnummer, de inhoud van berichten en eventuele bijlagen. Deze
              gegevens worden opgeslagen om de dienstverlening mogelijk te maken
              (offertes, boekingen, klantvragen).
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">
              2.3 Gebruiksgegevens
            </h3>
            <p>
              Bij een bezoek aan onze website kunnen automatisch technische
              gegevens worden verzameld, zoals IP-adres, browsertype, besturingssysteem
              en bezochte pagina&apos;s. Dit gebeurt via analytics-tools om de
              website te verbeteren.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              3. Doeleinden van verwerking
            </h2>
            <p>Wij verwerken uw gegevens voor de volgende doeleinden:</p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>Contact opnemen naar aanleiding van uw aanvraag</li>
              <li>Het leveren en verbeteren van onze diensten</li>
              <li>Het verzenden van offertes en afspraakbevestigingen</li>
              <li>Statistisch onderzoek en websiteverbetering</li>
              <li>
                Naleving van wettelijke verplichtingen (boekhouding, belasting)
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              4. Rechtsgrondslag
            </h2>
            <p>De verwerking is gebaseerd op:</p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>
                <strong>Toestemming:</strong> wanneer u vrijwillig gegevens
                invult via het contactformulier.
              </li>
              <li>
                <strong>Uitvoering van de overeenkomst:</strong> wanneer
                verwerking noodzakelijk is voor de dienstverlening.
              </li>
              <li>
                <strong>Gerechtvaardigd belang:</strong> voor
                websitestatistieken en fraudepreventie.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              5. Cookies
            </h2>
            <p>
              Onze website maakt gebruik van functionele cookies die noodzakelijk
              zijn voor de werking van de site. Daarnaast kunnen analytische
              cookies worden geplaatst om bezoekersstatistieken te verzamelen.
            </p>
            <p className="mt-2">
              U kunt cookies beheren of uitschakelen via de instellingen van uw
              browser. Het uitschakelen van functionele cookies kan de werking
              van de website beperken.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              6. Bewaartermijnen
            </h2>
            <p>
              Wij bewaren persoonsgegevens niet langer dan noodzakelijk voor de
              doeleinden waarvoor zij zijn verzameld. Contactgegevens worden
              maximaal 2 jaar na het laatste contact bewaard, tenzij een
              langere termijn wettelijk vereist is (bijvoorbeeld voor
              boekhoudkundige verplichtingen: 7 jaar).
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              7. Delen met derden
            </h2>
            <p>
              Wij delen uw persoonsgegevens niet met derden, tenzij dit
              noodzakelijk is voor de uitvoering van onze diensten of wij
              hiertoe wettelijk verplicht zijn. Wij kunnen gebruikmaken van
              de volgende verwerkers:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>
                <strong>Hostingprovider</strong> (Vercel / Hetzner) — voor het
                hosten van de website en applicatie
              </li>
              <li>
                <strong>WhatsApp Business API</strong> (360dialog / Meta) —
                voor chatbot-communicatie
              </li>
              <li>
                <strong>AI-dienstverleners</strong> (Anthropic / Google) — voor
                het verwerken van chatberichten en het genereren van offertes
              </li>
              <li>
                <strong>Betalingsprovider</strong> (Mollie) — voor de
                verwerking van betalingen
              </li>
            </ul>
            <p className="mt-3">
              Met alle verwerkers zijn verwerkersovereenkomsten gesloten conform
              de AVG.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              8. Beveiliging
            </h2>
            <p>
              Wij nemen passende technische en organisatorische maatregelen om
              uw persoonsgegevens te beschermen tegen ongeoorloofde toegang,
              verlies of vernietiging. Dit omvat versleutelde verbindingen
              (TLS/SSL), toegangsbeheer en regelmatige beveiligingscontroles.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              9. Uw rechten (AVG/GDPR)
            </h2>
            <p>
              Op grond van de Algemene Verordening Gegevensbescherming (AVG)
              heeft u de volgende rechten:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>
                <strong>Recht op inzage</strong> — u kunt opvragen welke
                gegevens wij van u verwerken
              </li>
              <li>
                <strong>Recht op rectificatie</strong> — u kunt onjuiste
                gegevens laten corrigeren
              </li>
              <li>
                <strong>Recht op verwijdering</strong> — u kunt verzoeken om
                verwijdering van uw gegevens
              </li>
              <li>
                <strong>Recht op beperking</strong> — u kunt de verwerking
                laten beperken
              </li>
              <li>
                <strong>Recht op overdraagbaarheid</strong> — u kunt uw
                gegevens in een gangbaar formaat ontvangen
              </li>
              <li>
                <strong>Recht van bezwaar</strong> — u kunt bezwaar maken
                tegen de verwerking van uw gegevens
              </li>
            </ul>
            <p className="mt-3">
              U kunt uw rechten uitoefenen door een e-mail te sturen naar{" "}
              <a
                href="mailto:info@blueprint.nl"
                className="text-blue-600 hover:underline"
              >
                info@blueprint.nl
              </a>
              . Wij reageren binnen 30 dagen op uw verzoek.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              10. Klachten
            </h2>
            <p>
              Indien u een klacht heeft over de verwerking van uw
              persoonsgegevens, kunt u contact met ons opnemen. Daarnaast heeft u
              het recht om een klacht in te dienen bij de{" "}
              <a
                href="https://autoriteitpersoonsgegevens.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Autoriteit Persoonsgegevens
              </a>
              .
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              11. Wijzigingen
            </h2>
            <p>
              Wij behouden ons het recht voor om dit privacybeleid te wijzigen.
              Wijzigingen worden op deze pagina gepubliceerd met een
              bijgewerkte datum. Bij wezenlijke wijzigingen informeren wij u
              per e-mail of via een melding op de website.
            </p>
          </section>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Blueprint. Alle rechten
          voorbehouden.
        </div>
      </footer>
    </div>
  );
}

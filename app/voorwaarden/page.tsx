import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Algemene Voorwaarden — Blueprint",
  description:
    "Algemene Voorwaarden van Blueprint. Lees de voorwaarden voor het gebruik van onze AI-automatiseringsdiensten.",
};

export default function VoorwaardenPage() {
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
          Algemene Voorwaarden
        </h1>
        <p className="text-gray-500 mb-12">
          Laatst bijgewerkt: 5 maart 2026
        </p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-0 mb-3">
              1. Definities
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Blueprint</strong> (hierna: &quot;wij&quot;, &quot;ons&quot;,
                &quot;onze&quot;): het AI-automatiseringsplatform opgericht door
                Lorenzo Ruisi, gevestigd in Nederland.
              </li>
              <li>
                <strong>Klant</strong> (hierna: &quot;u&quot;, &quot;uw&quot;): de
                natuurlijke persoon of rechtspersoon die een overeenkomst met
                Blueprint aangaat.
              </li>
              <li>
                <strong>Diensten</strong>: alle door Blueprint geleverde
                producten en diensten, waaronder AI-webshops, WhatsApp-bots,
                offertegeneratoren, agenda-integraties en dashboards.
              </li>
              <li>
                <strong>Abonnement</strong>: de maandelijkse overeenkomst voor
                het gebruik van de Diensten.
              </li>
            </ul>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              2. Toepasselijkheid
            </h2>
            <p>
              Deze Algemene Voorwaarden zijn van toepassing op alle aanbiedingen,
              overeenkomsten en leveringen van Blueprint. Door gebruik te maken
              van onze Diensten accepteert u deze voorwaarden. Afwijkende
              voorwaarden van de Klant worden uitdrukkelijk van de hand gewezen,
              tenzij schriftelijk anders overeengekomen.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              3. Diensten
            </h2>
            <p>Blueprint biedt de volgende diensten aan:</p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>
                <strong>AI Webshop</strong> — een op maat gemaakte,
                professionele website geoptimaliseerd voor mobiel, SEO en
                conversie.
              </li>
              <li>
                <strong>WhatsApp Bot</strong> — een AI-gestuurde chatbot die
                24/7 klantvragen beantwoordt, afspraken maakt en offertes
                verstuurt.
              </li>
              <li>
                <strong>Offerte Generator</strong> — automatische generatie van
                professionele offertes op basis van klantgegevens en
                branchespecifieke prijzen.
              </li>
              <li>
                <strong>Agenda &amp; Boekingen</strong> — online
                boekingssysteem met automatische bevestigingen en
                herinneringen.
              </li>
              <li>
                <strong>Dashboard &amp; Analytics</strong> — realtime inzicht
                in klanten, offertes, afspraken en omzet.
              </li>
            </ul>
            <p className="mt-3">
              De exacte invulling van de Diensten hangt af van het gekozen
              abonnement en eventuele maatwerkafspraken.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              4. Abonnementen &amp; Prijzen
            </h2>
            <p>Blueprint hanteert de volgende abonnementen:</p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-3 pr-4 font-bold text-gray-900">
                      Plan
                    </th>
                    <th className="text-left py-3 pr-4 font-bold text-gray-900">
                      Prijs
                    </th>
                    <th className="text-left py-3 font-bold text-gray-900">
                      Kenmerken
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 pr-4 font-semibold">Starter</td>
                    <td className="py-3 pr-4">&euro;199/maand</td>
                    <td className="py-3">
                      Professionele webshop, basis WhatsApp bot, tot 100
                      gesprekken/maand, standaard templates, email support
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 pr-4 font-semibold">Professional</td>
                    <td className="py-3 pr-4">&euro;349/maand</td>
                    <td className="py-3">
                      Alles van Starter + offerte generator, agenda &amp;
                      boekingen, tot 500 gesprekken/maand, eigen branding,
                      prioriteit support
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 pr-4 font-semibold">Enterprise</td>
                    <td className="py-3 pr-4">&euro;549/maand</td>
                    <td className="py-3">
                      Alles van Professional + onbeperkt gesprekken, custom
                      integraties, dedicated account manager, API toegang, SLA
                      garantie
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4">
              Alle prijzen zijn exclusief BTW (21%). Prijzen kunnen jaarlijks
              worden aangepast. Wijzigingen worden minimaal 30 dagen van
              tevoren aangekondigd.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              5. Gratis proefperiode
            </h2>
            <p>
              Nieuwe klanten ontvangen een gratis proefperiode van 14 dagen.
              Gedurende deze periode kunt u de volledige functionaliteit van het
              gekozen abonnement gebruiken. Na afloop van de proefperiode wordt
              het abonnement automatisch omgezet naar een betaald abonnement,
              tenzij u voor het einde van de proefperiode opzegt. Tijdens de
              proefperiode is geen creditcard vereist.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              6. Betaling
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Facturatie vindt maandelijks vooraf plaats op de eerste dag van
                de factureringsperiode.
              </li>
              <li>
                Betaling geschiedt via automatische incasso of bankoverschrijving
                via Mollie.
              </li>
              <li>
                De betalingstermijn bedraagt 14 dagen na factuurdatum.
              </li>
              <li>
                Bij niet-tijdige betaling behouden wij ons het recht voor de
                toegang tot de Diensten op te schorten na een herinneringsmail
                met een termijn van 7 dagen.
              </li>
              <li>
                Bij langdurige niet-betaling (meer dan 30 dagen) kan de
                overeenkomst eenzijdig worden ontbonden.
              </li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              7. Opzegging &amp; annulering
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Het abonnement is maandelijks opzegbaar. Opzegging dient
                uiterlijk 7 dagen voor het einde van de lopende maand te
                geschieden.
              </li>
              <li>
                Opzegging kan per e-mail aan{" "}
                <a
                  href="mailto:info@blueprint.nl"
                  className="text-blue-600 hover:underline"
                >
                  info@blueprint.nl
                </a>{" "}
                of via het dashboard.
              </li>
              <li>
                Na opzegging blijft de Dienst actief tot het einde van de
                betaalde periode. Daarna wordt de toegang beëindigd.
              </li>
              <li>
                Reeds betaalde abonnementskosten worden niet gerestitueerd,
                tenzij sprake is van een aantoonbaar gebrek in de dienstverlening.
              </li>
              <li>
                Na beëindiging kunt u gedurende 30 dagen uw data exporteren.
                Daarna worden uw gegevens definitief verwijderd.
              </li>
            </ul>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              8. Service Level Agreement (SLA)
            </h2>
            <p>
              Voor Enterprise-klanten geldt de volgende SLA:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>
                <strong>Uptime-garantie:</strong> 99,5% beschikbaarheid van de
                Diensten op maandbasis (exclusief gepland onderhoud).
              </li>
              <li>
                <strong>Reactietijd support:</strong> binnen 4 uur op
                werkdagen (ma-vr, 09:00-17:00 CET).
              </li>
              <li>
                <strong>Gepland onderhoud:</strong> minimaal 48 uur van
                tevoren aangekondigd, bij voorkeur buiten kantooruren.
              </li>
              <li>
                <strong>Compensatie:</strong> bij niet-nakoming van de
                uptime-garantie ontvangt u een credit ter hoogte van 5% van de
                maandelijkse kosten per heel uur boven de toegestane downtime,
                tot een maximum van 50% van de maandelijkse kosten.
              </li>
            </ul>
            <p className="mt-3">
              Voor Starter- en Professional-klanten streven wij naar dezelfde
              uptime maar geldt geen formele SLA met compensatieregeling.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              9. Intellectueel eigendom
            </h2>
            <p>
              Alle intellectuele eigendomsrechten op de Diensten, software,
              ontwerpen, templates en documentatie berusten bij Blueprint. De
              Klant verkrijgt een niet-exclusief, niet-overdraagbaar
              gebruiksrecht voor de duur van het abonnement.
            </p>
            <p className="mt-2">
              Content die door de Klant wordt aangeleverd (teksten, afbeeldingen,
              logo&apos;s) blijft eigendom van de Klant. De Klant garandeert dat
              deze content geen inbreuk maakt op rechten van derden.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              10. Aansprakelijkheid
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                De aansprakelijkheid van Blueprint is beperkt tot het bedrag dat
                in de 3 maanden voorafgaand aan het schadeveroorzakende
                gebeurtenis aan de Klant is gefactureerd.
              </li>
              <li>
                Blueprint is niet aansprakelijk voor indirecte schade, gevolgschade,
                gederfde winst of gemiste besparingen.
              </li>
              <li>
                Blueprint is niet aansprakelijk voor schade die het gevolg is
                van onjuiste of onvolledige informatie verstrekt door de Klant.
              </li>
              <li>
                AI-gegenereerde content (offertes, chatbot-antwoorden) wordt
                geleverd op &quot;as-is&quot; basis. De Klant is verantwoordelijk
                voor controle en gebruik hiervan.
              </li>
            </ul>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              11. Privacy &amp; gegevensbescherming
            </h2>
            <p>
              De verwerking van persoonsgegevens geschiedt conform ons{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacybeleid
              </Link>{" "}
              en de Algemene Verordening Gegevensbescherming (AVG). Blueprint
              treedt op als verwerker ten aanzien van klantgegevens die via de
              Diensten worden verwerkt. Een verwerkersovereenkomst maakt onderdeel
              uit van de overeenkomst.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              12. Overmacht
            </h2>
            <p>
              Blueprint is niet gehouden tot het nakomen van enige verplichting
              indien dit wordt verhinderd door overmacht. Onder overmacht wordt
              verstaan: storingen in internet- of elektriciteitsnetwerken,
              storingen bij toeleveranciers (cloud hosting, API-providers),
              natuurrampen, pandemieën, overheidsmaatregelen of andere
              omstandigheden buiten onze redelijke controle.
            </p>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              13. Wijzigingen
            </h2>
            <p>
              Blueprint behoudt zich het recht voor deze Algemene Voorwaarden
              te wijzigen. Wijzigingen worden minimaal 30 dagen voor
              inwerkingtreding per e-mail aangekondigd. Indien de Klant niet
              akkoord gaat met de wijzigingen, heeft de Klant het recht het
              abonnement op te zeggen voor de ingangsdatum van de nieuwe
              voorwaarden.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              14. Toepasselijk recht &amp; geschillen
            </h2>
            <p>
              Op deze Algemene Voorwaarden en alle overeenkomsten met Blueprint
              is Nederlands recht van toepassing. Geschillen worden bij
              voorkeur in onderling overleg opgelost. Indien dit niet lukt,
              worden geschillen voorgelegd aan de bevoegde rechtbank in
              Nederland.
            </p>
          </section>

          {/* 15 */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              15. Contact
            </h2>
            <p>
              Voor vragen over deze Algemene Voorwaarden kunt u contact opnemen
              via:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-3">
              <li>
                <strong>E-mail:</strong>{" "}
                <a
                  href="mailto:info@blueprint.nl"
                  className="text-blue-600 hover:underline"
                >
                  info@blueprint.nl
                </a>
              </li>
              <li>
                <strong>Bedrijfsnaam:</strong> Blueprint
              </li>
              <li>
                <strong>Contactpersoon:</strong> Lorenzo Ruisi
              </li>
            </ul>
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

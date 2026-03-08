"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import BackgroundShader from "@/components/ui/background-shader";

/* ─── NAV ─── */
const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Sectoren", href: "#sectors" },
  { label: "Prijzen", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

/* ─── FEATURES ─── */
const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
      </svg>
    ),
    tag: "01",
    title: "AI Webshop",
    desc: "Een professionele website op maat, binnen 48 uur live. Geoptimaliseerd voor mobiel, SEO en conversie.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
    tag: "02",
    title: "WhatsApp Bot",
    desc: "24/7 bereikbaar via WhatsApp. AI beantwoordt vragen, maakt afspraken en verstuurt offertes automatisch.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    tag: "03",
    title: "Offerte Generator",
    desc: "Professionele offertes in seconden. AI berekent prijzen, genereert PDF en verstuurt direct naar de klant.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
    tag: "04",
    title: "Agenda & Boekingen",
    desc: "Klanten boeken zelf online. Automatische bevestigingen en herinneringen via WhatsApp.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    tag: "05",
    title: "Dashboard & Analytics",
    desc: "Realtime inzicht in klanten, offertes, afspraken en omzet. Alles op een plek.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
    tag: "06",
    title: "AI-Powered",
    desc: "Aangedreven door de nieuwste AI. Uw digitale assistent leert continu bij en wordt steeds slimmer.",
  },
];

/* ─── SECTORS ─── */
const SECTORS = [
  { name: "Bouw & Renovatie", examples: "Aannemers, verbouwers, dakdekkers" },
  { name: "Installatie", examples: "Loodgieters, elektriciens, HVAC" },
  { name: "Schilders", examples: "Schildersbedrijven, behang, coating" },
  { name: "Tuinieren", examples: "Hoveniers, tuinonderhoud, bestrating" },
  { name: "Beauty & Wellness", examples: "Salons, barbershops, nagelstudio\u2019s" },
  { name: "Horeca", examples: "Restaurants, caf\u00E9s, catering" },
  { name: "Automotive", examples: "Garages, autobedrijven, APK" },
  { name: "Schoonmaak", examples: "Schoonmaakbedrijven, glazenwassers" },
  { name: "Gezondheid", examples: "Tandartsen, fysiotherapie, huisartsen" },
];

/* ─── PRICING ─── */
const PRICING = [
  {
    name: "Starter",
    price: "199",
    desc: "Perfect voor starters en kleine bedrijven",
    features: [
      "Professionele webshop",
      "Basis WhatsApp bot",
      "Tot 100 gesprekken/maand",
      "Standaard templates",
      "Email support",
    ],
    cta: "Start gratis proefperiode",
    popular: false,
  },
  {
    name: "Professional",
    price: "349",
    desc: "Voor groeiende bedrijven die meer willen",
    features: [
      "Alles van Starter",
      "Offerte generator",
      "Agenda & boekingen",
      "Tot 500 gesprekken/maand",
      "Eigen branding",
      "Prioriteit support",
    ],
    cta: "Start gratis proefperiode",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "549",
    desc: "Volledig pakket met maatwerkoplossingen",
    features: [
      "Alles van Professional",
      "Onbeperkt gesprekken",
      "Custom integraties",
      "Dedicated account manager",
      "API toegang",
      "SLA garantie",
    ],
    cta: "Neem contact op",
    popular: false,
  },
];

/* ─── TESTIMONIALS ─── */
const TESTIMONIALS = [
  {
    quote:
      "Dankzij Blueprint bespaar ik 15 uur per week aan administratie. De WhatsApp bot beantwoordt 80% van de klantvragen automatisch.",
    name: "Mark de Vries",
    role: "Eigenaar De Vries Bouw",
    initials: "MV",
  },
  {
    quote:
      "Onze offertes worden nu in minuten verstuurd in plaats van dagen. Klanten zijn onder de indruk van de snelheid.",
    name: "Fatima El-Amrani",
    role: "Installatietechniek Amsterdam",
    initials: "FA",
  },
  {
    quote:
      "De AI chatbot spreekt perfect Nederlands en begrijpt precies wat onze klanten nodig hebben. Geweldig!",
    name: "Jan Bakker",
    role: "Bakker Schilderwerken",
    initials: "JB",
  },
];

/* ─── STATS ─── */
const STATS = [
  { value: 260500, suffix: "+", label: "MKB bedrijven in NL", prefix: "" },
  { value: 15, suffix: "+", label: "Sectoren", prefix: "" },
  { value: 48, suffix: "u", label: "Live in", prefix: "" },
  { value: 24, suffix: "/7", label: "Bereikbaar", prefix: "" },
];

/* ─── FAQ ─── */
const FAQS = [
  {
    q: "Hoe snel kan ik starten?",
    a: "Binnen 2 weken is je complete systeem live. Na een kort kennismakingsgesprek bouwen wij je webshop, configureren we de WhatsApp bot en zetten we de offerte generator klaar. Je hoeft zelf niets technisch te doen.",
  },
  {
    q: "Moet ik technische kennis hebben?",
    a: "Nee, wij regelen alles. Van de installatie tot de configuratie en het onderhoud. U levert uw bedrijfsinformatie aan en wij zorgen dat alles perfect werkt. Bij vragen staat ons support team voor u klaar.",
  },
  {
    q: "Kan ik het eerst proberen?",
    a: "Ja, we bieden een gratis demo aan. Tijdens de demo laten we u zien hoe het platform er voor uw specifieke sector uitziet en werkt. Geen verplichtingen, geen creditcard nodig.",
  },
  {
    q: "Welke sectoren ondersteunen jullie?",
    a: "We ondersteunen 15+ sectoren, waaronder bouw, installatie, schilders, tuinieren, beauty, horeca, automotive, schoonmaak en gezondheid. Elke sector krijgt op maat gemaakte templates, prijslijsten en workflows.",
  },
  {
    q: "Hoe werkt de WhatsApp bot?",
    a: "Onze AI-aangedreven chatbot draait 24/7 op uw zakelijke WhatsApp-nummer. Hij beantwoordt veelgestelde vragen, maakt afspraken, verstuurt offertes en stuurt complexe vragen door naar u. De bot spreekt vloeiend Nederlands en leert continu bij.",
  },
];

/* ────────────────────────────────────────────────────────
   COUNTER HOOK — animated count-up on scroll
   ──────────────────────────────────────────────────────── */
function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [started, end, duration]);

  return { count, ref };
}

/* ────────────────────────────────────────────────────────
   SCROLL ANIMATION HOOK
   ──────────────────────────────────────────────────────── */
function useScrollAnimation() {
  useEffect(() => {
    const elements = document.querySelectorAll(".animate-on-scroll");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ────────────────────────────────────────────────────────
   STAT CARD
   ──────────────────────────────────────────────────────── */
function StatCard({ stat, delay }: { stat: (typeof STATS)[number]; delay: number }) {
  const { count, ref } = useCountUp(stat.value, 2200);
  return (
    <div ref={ref} className="animate-on-scroll text-center" data-delay={delay}>
      <div className="text-3xl sm:text-4xl font-bold text-[#0B1120] tracking-tight">
        {stat.prefix}
        {count.toLocaleString("nl-NL")}
        {stat.suffix}
      </div>
      <div className="text-[13px] text-[#64748b] mt-2 font-medium tracking-wide uppercase">
        {stat.label}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════ */
export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Contact form
  const [formData, setFormData] = useState({
    bedrijfsnaam: "",
    naam: "",
    telefoon: "",
    email: "",
    sector: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  useScrollAnimation();

  useEffect(() => {
    function handleScroll() {
      setShowFloatingCta(window.scrollY > 600);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
      if (formErrors.length > 0) setFormErrors([]);
    },
    [formErrors.length]
  );

  function validateForm(): string[] {
    const errors: string[] = [];
    if (!formData.bedrijfsnaam.trim()) errors.push("Bedrijfsnaam is verplicht.");
    if (!formData.naam.trim()) errors.push("Naam is verplicht.");
    if (!formData.telefoon.trim()) errors.push("Telefoonnummer is verplicht.");
    if (!formData.email.trim()) {
      errors.push("Email is verplicht.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.push("Ongeldig email formaat.");
    }
    if (!formData.sector) errors.push("Selecteer een sector.");
    return errors;
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors([]);
    setFormSuccess(false);
    const errors = validateForm();
    if (errors.length > 0) { setFormErrors(errors); return; }
    setFormLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setFormSuccess(true);
        setFormData({ bedrijfsnaam: "", naam: "", telefoon: "", email: "", sector: "" });
      } else {
        setFormErrors(data.errors || ["Er is een fout opgetreden."]);
      }
    } catch {
      setFormErrors(["Netwerkfout. Controleer uw verbinding en probeer opnieuw."]);
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFD]">
      {/* ─── NAVIGATION ─── */}
      <nav className="fixed top-0 w-full z-50 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="flex justify-between items-center h-[72px]">
            <a href="#" className="flex items-center">
              <Image src="/logo.png" alt="Blueprint" width={280} height={80} className="h-20 w-auto" priority />
            </a>

            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-[13px] font-medium text-white/70 hover:text-white transition-colors tracking-wide"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contact"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-5 py-2 rounded-lg text-[13px] font-semibold hover:bg-white/20 transition-colors tracking-wide"
              >
                Gratis Demo
              </a>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0B1120]/95 backdrop-blur-xl border-t border-white/10 px-5 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-white/70 font-medium py-2.5 text-[14px] hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              className="block bg-white/10 border border-white/20 text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold text-center mt-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Gratis Demo
            </a>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative pt-[140px] pb-24 sm:pt-[160px] sm:pb-32 overflow-hidden">
        {/* Mesh gradient background */}
        <BackgroundShader />
        {/* Gradient fade at bottom for smooth transition */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#EFF4FF] to-transparent z-[1]" />

        <div className="relative z-[2] max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold tracking-[0.12em] uppercase text-[#60a5fa] mb-6 animate-on-scroll">AI Automatisering</div>
            <h1 className="text-[40px] sm:text-[52px] lg:text-[60px] font-bold text-white leading-[1.08] tracking-tight animate-on-scroll" data-delay="1">
              Uw bedrijf op
              <br />
              <span className="text-[#60a5fa]">autopilot</span> met AI
            </h1>
            <p className="mt-6 text-[17px] sm:text-[19px] text-white/80 max-w-xl leading-relaxed animate-on-scroll" data-delay="2">
              Webshop, WhatsApp Bot en Offerte Generator — alles wat uw MKB-bedrijf nodig heeft, volledig geautomatiseerd.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 animate-on-scroll" data-delay="3">
              <a
                href="#contact"
                className="inline-flex items-center justify-center bg-[#3B82F6] text-white px-7 py-3.5 rounded-lg text-[15px] font-semibold hover:bg-[#2563EB] transition-all shadow-[0_2px_16px_rgba(59,130,246,0.35)] hover:shadow-[0_4px_24px_rgba(59,130,246,0.5)]"
              >
                Start gratis proefperiode
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center border border-white/20 text-white/80 px-7 py-3.5 rounded-lg text-[15px] font-medium hover:border-white/40 hover:text-white transition-colors backdrop-blur-sm"
              >
                Bekijk features
              </a>
            </div>
            <p className="mt-5 text-[13px] text-white/40 animate-on-scroll" data-delay="4">
              14 dagen gratis &middot; geen creditcard nodig &middot; maandelijks opzegbaar
            </p>
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="border-y border-[#dbeafe] py-12 sm:py-14 bg-[#EFF4FF]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
            {STATS.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} delay={i + 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="py-24 sm:py-32 relative bg-[#F5F8FF]">
        <div className="absolute inset-0 bp-grid opacity-40" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-16 animate-on-scroll">
            <div className="bp-label mb-4">Features</div>
            <h2 className="text-[32px] sm:text-[38px] font-bold text-[#0B1120] leading-tight tracking-tight">
              Alles wat uw bedrijf nodig heeft
            </h2>
            <p className="mt-4 text-[16px] text-[#64748b] leading-relaxed">
              E&eacute;n platform, volledig ge&iuml;ntegreerd. Van webshop tot WhatsApp, van offertes tot agenda.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className="animate-on-scroll group bp-corners bg-white/80 backdrop-blur-sm p-7 rounded-lg border border-[#dbeafe] hover:border-[#93c5fd] hover:bg-white hover:shadow-[0_4px_20px_rgba(59,130,246,0.08)] transition-all duration-300"
                data-delay={(i % 3) + 1}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#EFF4FF] text-[#3B82F6] rounded-lg flex items-center justify-center group-hover:bg-[#3B82F6] group-hover:text-white transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <span className="text-[11px] font-mono text-[#bfdbfe] tracking-wider">{feature.tag}</span>
                </div>
                <h3 className="text-[17px] font-bold text-[#0B1120]">{feature.title}</h3>
                <p className="mt-2 text-[14px] text-[#64748b] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-24 sm:py-32 bg-[#0B1120] relative overflow-hidden">
        <div className="absolute inset-0 bp-grid-dense" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-16 animate-on-scroll">
            <div className="bp-label mb-4">Werkwijze</div>
            <h2 className="text-[32px] sm:text-[38px] font-bold text-white leading-tight tracking-tight">
              In 3 stappen live
            </h2>
            <p className="mt-4 text-[16px] text-[#94a3b8] leading-relaxed">
              Geen technische kennis nodig. Wij regelen alles.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            {[
              {
                step: "01",
                title: "Kennismaking",
                desc: "Vertel ons over uw bedrijf, diensten en doelen. Wij maken een plan op maat.",
              },
              {
                step: "02",
                title: "Setup & Lancering",
                desc: "Binnen 48 uur staat uw webshop live, is de WhatsApp bot actief en de offerte generator klaar.",
              },
              {
                step: "03",
                title: "Groei op Autopilot",
                desc: "De AI leert continu bij. Meer klanten, minder administratie, meer omzet.",
              },
            ].map((item, i) => (
              <div key={item.step} className="animate-on-scroll relative" data-delay={i + 1}>
                {/* Connecting line between steps */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-6 left-[calc(100%+4px)] w-[calc(100%-48px)] h-px border-t border-dashed border-[#1e3a5f]" style={{ left: '48px', width: 'calc(100% - 16px)' }} />
                )}
                <div className="flex items-start gap-5">
                  <div className="shrink-0 w-12 h-12 rounded-lg bg-[#3B82F6] text-white flex items-center justify-center text-[14px] font-bold font-mono">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-[14px] text-[#94a3b8] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTORS ─── */}
      <section id="sectors" className="py-24 sm:py-32 relative bg-[#EFF4FF]">
        <div className="absolute inset-0 bp-grid opacity-40" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-16 animate-on-scroll">
            <div className="bp-label mb-4">Sectoren</div>
            <h2 className="text-[32px] sm:text-[38px] font-bold text-[#0B1120] leading-tight tracking-tight">
              Gebouwd voor uw sector
            </h2>
            <p className="mt-4 text-[16px] text-[#64748b] leading-relaxed">
              Elke sector krijgt een op maat gemaakt pakket met relevante templates, prijzen en workflows.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SECTORS.map((sector, i) => (
              <div
                key={sector.name}
                className="animate-on-scroll flex items-center gap-4 px-5 py-4 rounded-lg bg-white/80 backdrop-blur-sm border border-[#dbeafe] hover:border-[#93c5fd] hover:bg-white transition-all group"
                data-delay={(i % 3) + 1}
              >
                <div className="w-2 h-2 rounded-full bg-[#3B82F6] opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
                <div>
                  <h3 className="text-[15px] font-semibold text-[#0B1120]">{sector.name}</h3>
                  <p className="text-[13px] text-[#94a3b8] mt-0.5">{sector.examples}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="py-24 sm:py-32 bg-white border-y border-[#dbeafe]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-16 animate-on-scroll">
            <div className="bp-label mb-4">Prijzen</div>
            <h2 className="text-[32px] sm:text-[38px] font-bold text-[#0B1120] leading-tight tracking-tight">
              Transparante prijzen
            </h2>
            <p className="mt-4 text-[16px] text-[#64748b] leading-relaxed">
              Geen verborgen kosten. Geen opstartkosten. Maandelijks opzegbaar.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-5xl">
            {PRICING.map((plan, i) => (
              <div
                key={plan.name}
                className={`animate-on-scroll relative rounded-lg p-7 transition-all ${
                  plan.popular
                    ? "bg-[#0B1120] text-white ring-1 ring-[#0B1120]"
                    : "bg-[#F5F8FF] border border-[#dbeafe] bp-corners"
                }`}
                data-delay={i + 1}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-7 bg-[#3B82F6] text-white text-[10px] font-bold px-3 py-1 rounded tracking-wider uppercase">
                    Meest gekozen
                  </div>
                )}
                <div>
                  <h3 className={`text-[13px] font-semibold tracking-wider uppercase ${plan.popular ? "text-[#94a3b8]" : "text-[#94a3b8]"}`}>
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className={`text-[42px] font-bold tracking-tight ${plan.popular ? "text-white" : "text-[#0B1120]"}`}>
                      {"\u20AC"}{plan.price}
                    </span>
                    <span className={`text-[14px] ${plan.popular ? "text-[#64748b]" : "text-[#94a3b8]"}`}>/maand</span>
                  </div>
                  <p className={`mt-2 text-[13px] ${plan.popular ? "text-[#64748b]" : "text-[#94a3b8]"}`}>
                    {plan.desc}
                  </p>
                </div>
                <div className={`mt-6 pt-6 border-t ${plan.popular ? "border-white/10" : "border-[#e8ecf2]"}`}>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <svg
                          className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? "text-[#3B82F6]" : "text-[#3B82F6]"}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        <span className={`text-[13px] ${plan.popular ? "text-[#cbd5e1]" : "text-[#64748b]"}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <a
                  href="#contact"
                  className={`mt-7 block text-center py-3 rounded-lg font-semibold text-[13px] tracking-wide transition-all ${
                    plan.popular
                      ? "bg-[#3B82F6] text-white hover:bg-[#2563EB]"
                      : "bg-[#0B1120] text-white hover:bg-[#1a2744]"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-24 sm:py-32 relative bg-[#0B1120] overflow-hidden">
        <div className="absolute inset-0 bp-grid-dense" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-xl mb-16 animate-on-scroll">
            <div className="bp-label mb-4">Klanten</div>
            <h2 className="text-[32px] sm:text-[38px] font-bold text-white leading-tight tracking-tight">
              Wat ondernemers zeggen
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className="animate-on-scroll bp-corners bg-[#111d33] p-7 rounded-lg border border-[#1e3a5f]"
                data-delay={i + 1}
              >
                {/* Quote mark */}
                <svg className="w-8 h-8 text-[#1e3a5f] mb-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151C7.563 6.068 6 8.789 6 11h4v10H0z" />
                </svg>
                <blockquote className="text-[14px] text-[#94a3b8] leading-relaxed">
                  {t.quote}
                </blockquote>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#3B82F6] text-white flex items-center justify-center font-bold text-[11px] tracking-wide">
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-white">{t.name}</div>
                    <div className="text-[12px] text-[#64748b]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 sm:py-32 bg-[#F5F8FF]">
        <div className="max-w-2xl mx-auto px-5 sm:px-8">
          <div className="mb-16 animate-on-scroll">
            <div className="bp-label mb-4">FAQ</div>
            <h2 className="text-[32px] sm:text-[38px] font-bold text-[#0B1120] leading-tight tracking-tight">
              Veelgestelde vragen
            </h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="animate-on-scroll border border-[#dbeafe] rounded-lg overflow-hidden bg-white"
                data-delay={(i % 3) + 1}
              >
                <button
                  className="flex items-center justify-between w-full px-6 py-4 text-left hover:bg-white transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-[15px] font-semibold text-[#0B1120] pr-4">{faq.q}</span>
                  <svg
                    className={`w-4 h-4 text-[#94a3b8] shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                <div
                  className="overflow-hidden transition-all duration-200"
                  style={{ maxHeight: openFaq === i ? '200px' : '0px', opacity: openFaq === i ? 1 : 0 }}
                >
                  <div className="px-6 pb-4 text-[14px] text-[#64748b] leading-relaxed">
                    {faq.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT / CTA ─── */}
      <section id="contact" className="py-24 sm:py-32 relative bg-gradient-to-b from-[#0a1628] to-[#0B1120] overflow-hidden">
        <div className="absolute inset-0 bp-grid-dense" />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 md:gap-16">
              {/* Left — text */}
              <div className="animate-on-scroll">
                <div className="bp-label mb-4">Contact</div>
                <h2 className="text-[32px] sm:text-[38px] font-bold text-white leading-tight tracking-tight">
                  Klaar om te groeien?
                </h2>
                <p className="mt-4 text-[16px] text-[#94a3b8] leading-relaxed">
                  Plan een gratis demo en ontdek wat Blueprint voor uw bedrijf kan doen.
                </p>
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3 text-[14px] text-[#94a3b8]">
                    <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#60a5fa]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    info@blueprint.nl
                  </div>
                  <div className="flex items-center gap-3 text-[14px] text-[#94a3b8]">
                    <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#60a5fa]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                    </div>
                    Nederland
                  </div>
                  <div className="flex items-center gap-3 text-[14px] text-[#94a3b8]">
                    <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
                      <svg className="w-4 h-4 text-[#60a5fa]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    </div>
                    Reactie binnen 24 uur
                  </div>
                </div>
              </div>

              {/* Right — form */}
              <div>
                {formSuccess ? (
                  <div className="animate-on-scroll">
                    <div className="bg-[#111d33] border border-[#1e3a5f] rounded-lg p-8 text-center">
                      <div className="w-12 h-12 rounded-full bg-[#3B82F6]/20 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-[#60a5fa]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                      <h3 className="text-[18px] font-bold text-white mb-2">Bedankt!</h3>
                      <p className="text-[14px] text-[#94a3b8]">
                        Wij nemen binnen 24 uur contact met u op om een gratis demo in te plannen.
                      </p>
                      <button
                        onClick={() => setFormSuccess(false)}
                        className="mt-4 text-[13px] text-[#60a5fa] font-medium hover:text-[#3B82F6] transition-colors"
                      >
                        Nog een aanvraag versturen
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-3 animate-on-scroll" data-delay="1">
                    {formErrors.length > 0 && (
                      <div className="bg-[#fef2f2]/10 border border-[#fecaca]/20 rounded-lg p-3">
                        <ul className="text-[13px] text-[#fca5a5] space-y-1">
                          {formErrors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <input
                      type="text"
                      name="bedrijfsnaam"
                      placeholder="Bedrijfsnaam"
                      value={formData.bedrijfsnaam}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 rounded-lg border border-[#1e3a5f] bg-[#111d33] text-white text-[14px] placeholder:text-[#5a7da8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all"
                    />
                    <input
                      type="text"
                      name="naam"
                      placeholder="Uw naam"
                      value={formData.naam}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 rounded-lg border border-[#1e3a5f] bg-[#111d33] text-white text-[14px] placeholder:text-[#5a7da8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="tel"
                        name="telefoon"
                        placeholder="Telefoonnummer"
                        value={formData.telefoon}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-lg border border-[#1e3a5f] bg-[#111d33] text-white text-[14px] placeholder:text-[#5a7da8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all"
                      />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 rounded-lg border border-[#1e3a5f] bg-[#111d33] text-white text-[14px] placeholder:text-[#5a7da8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all"
                      />
                    </div>
                    <select
                      name="sector"
                      value={formData.sector}
                      onChange={handleFormChange}
                      className={`w-full px-4 py-3 rounded-lg border border-[#1e3a5f] bg-[#111d33] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 focus:border-[#3B82F6] transition-all ${
                        formData.sector ? "text-white" : "text-[#5a7da8]"
                      }`}
                    >
                      <option value="">Selecteer uw sector</option>
                      <option value="bouw">Bouw & Renovatie</option>
                      <option value="installatie">Installatie</option>
                      <option value="schilders">Schilders</option>
                      <option value="tuinieren">Tuinieren</option>
                      <option value="beauty">Beauty & Wellness</option>
                      <option value="horeca">Horeca</option>
                      <option value="automotive">Automotive</option>
                      <option value="schoonmaak">Schoonmaak</option>
                      <option value="gezondheid">Gezondheid</option>
                      <option value="anders">Anders</option>
                    </select>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="w-full bg-[#3B82F6] text-white py-3.5 rounded-lg font-semibold text-[14px] hover:bg-[#2563EB] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_2px_16px_rgba(59,130,246,0.25)]"
                    >
                      {formLoading ? (
                        <>
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Verzenden...
                        </>
                      ) : (
                        "Vraag gratis demo aan"
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#0B1120] text-[#64748b] py-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="mb-4">
                <Image src="/logo.png" alt="Blueprint" width={140} height={40} className="h-8 w-auto" />
              </div>
              <p className="text-[13px] leading-relaxed max-w-xs">
                AI-automatisering voor het Nederlandse MKB. Webshop, WhatsApp Bot en Offerte Generator.
              </p>
              <div className="flex gap-3 mt-5">
                {[
                  { label: "LinkedIn", d: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
                  { label: "WhatsApp", d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" },
                ].map((social) => (
                  <a key={social.label} href="#" className="w-8 h-8 rounded-lg bg-[#1e293b] hover:bg-[#3B82F6] flex items-center justify-center transition-colors" aria-label={social.label}>
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d={social.d} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-white text-[13px] font-semibold mb-4 tracking-wide">Product</h4>
              <ul className="space-y-2.5 text-[13px]">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Prijzen</a></li>
                <li><a href="#sectors" className="hover:text-white transition-colors">Sectoren</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-[13px] font-semibold mb-4 tracking-wide">Bedrijf</h4>
              <ul className="space-y-2.5 text-[13px]">
                <li><a href="#" className="hover:text-white transition-colors">Over ons</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacybeleid</a></li>
                <li><a href="/voorwaarden" className="hover:text-white transition-colors">Algemene voorwaarden</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-[13px] font-semibold mb-4 tracking-wide">Contact</h4>
              <ul className="space-y-2.5 text-[13px]">
                <li><a href="#contact" className="hover:text-white transition-colors">Demo aanvragen</a></li>
                <li>info@blueprint.nl</li>
                <li>Nederland</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[#1e293b] flex flex-col sm:flex-row justify-between items-center gap-4 text-[12px]">
            <p>&copy; {new Date().getFullYear()} Blueprint. Alle rechten voorbehouden.</p>
            <div className="flex items-center gap-5">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/voorwaarden" className="hover:text-white transition-colors">Voorwaarden</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── FLOATING CTA ─── */}
      <a
        href="#contact"
        className={`fixed bottom-6 right-6 z-50 bg-[#3B82F6] text-white px-5 py-3 rounded-lg font-semibold text-[13px] shadow-[0_4px_24px_rgba(59,130,246,0.35)] flex items-center gap-2 transition-all duration-300 hover:bg-[#2563EB] ${
          showFloatingCta
            ? "translate-y-0 opacity-100"
            : "translate-y-16 opacity-0 pointer-events-none"
        }`}
      >
        Start Demo
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </a>
    </div>
  );
}

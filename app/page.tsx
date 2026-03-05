"use client";

import { useState } from "react";
import Image from "next/image";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Sectoren", href: "#sectors" },
  { label: "Prijzen", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

const FEATURES = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
      </svg>
    ),
    title: "AI Webshop",
    desc: "Een professionele website op maat, binnen 48 uur live. Geoptimaliseerd voor mobiel, SEO en conversie.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
    title: "WhatsApp Bot",
    desc: "24/7 bereikbaar via WhatsApp. AI beantwoordt vragen, maakt afspraken en verstuurt offertes automatisch.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    title: "Offerte Generator",
    desc: "Professionele offertes in seconden. AI berekent prijzen, genereert PDF en verstuurt direct naar de klant.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
    title: "Agenda & Boekingen",
    desc: "Klanten boeken zelf online. Automatische bevestigingen en herinneringen via WhatsApp.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    title: "Dashboard & Analytics",
    desc: "Realtime inzicht in klanten, offertes, afspraken en omzet. Alles op één plek.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
    title: "AI-Powered",
    desc: "Aangedreven door de nieuwste AI. Uw digitale assistent leert continu bij en wordt steeds slimmer.",
  },
];

const SECTORS = [
  { name: "Bouw & Renovatie", icon: "🏗️", examples: "Aannemers, verbouwers, dakdekkers" },
  { name: "Installatie", icon: "🔧", examples: "Loodgieters, elektriciens, HVAC" },
  { name: "Schilders", icon: "🎨", examples: "Schildersbedrijven, behang, coating" },
  { name: "Tuinieren", icon: "🌿", examples: "Hoveniers, tuinonderhoud, bestrating" },
  { name: "Beauty & Wellness", icon: "💆", examples: "Salons, barbershops, nagelstudio's" },
  { name: "Horeca", icon: "🍽️", examples: "Restaurants, cafés, catering" },
  { name: "Automotive", icon: "🚗", examples: "Garages, autobedrijven, APK" },
  { name: "Schoonmaak", icon: "🧹", examples: "Schoonmaakbedrijven, glazenwassers" },
  { name: "Gezondheid", icon: "🏥", examples: "Tandartsen, fysiotherapie, huisartsen" },
];

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

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Contact form state
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

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear errors when user starts typing
    if (formErrors.length > 0) setFormErrors([]);
  }

  function validateForm(): string[] {
    const errors: string[] = [];
    if (!formData.bedrijfsnaam.trim()) errors.push("Bedrijfsnaam is verplicht.");
    if (!formData.naam.trim()) errors.push("Naam is verplicht.");
    if (!formData.telefoon.trim()) errors.push("Telefoonnummer is verplicht.");
    if (!formData.email.trim()) {
      errors.push("Email is verplicht.");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.push("Ongeldig email formaat.");
      }
    }
    if (!formData.sector) errors.push("Selecteer een sector.");
    return errors;
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormErrors([]);
    setFormSuccess(false);

    // Client-side validation
    const errors = validateForm();
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="#" className="flex items-center">
              <Image src="/logo.jpeg" alt="Blueprint" width={140} height={40} className="h-8 w-auto rounded" priority />
            </a>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#contact"
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Gratis demo
              </a>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-gray-700 font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#contact"
              className="block bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Gratis demo
            </a>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white/90 text-sm font-medium px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Nu beschikbaar voor Nederlandse bedrijven
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl mx-auto">
            Uw bedrijf op{" "}
            <span className="text-blue-200">autopilot</span> met AI
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Webshop, WhatsApp Bot en Offerte Generator — alles wat uw MKB-bedrijf nodig heeft, volledig geautomatiseerd.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#contact"
              className="bg-white text-blue-700 px-8 py-4 rounded-xl text-lg font-bold hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20"
            >
              Start gratis proefperiode
            </a>
            <a
              href="#features"
              className="border-2 border-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Bekijk features
            </a>
          </div>
          <p className="mt-6 text-sm text-blue-200">
            14 dagen gratis proberen — geen creditcard nodig
          </p>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="bg-gray-50 border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">15+</div>
              <div className="text-sm text-gray-500 mt-1">Sectoren</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">24/7</div>
              <div className="text-sm text-gray-500 mt-1">Bereikbaar</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">48u</div>
              <div className="text-sm text-gray-500 mt-1">Live online</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">€0</div>
              <div className="text-sm text-gray-500 mt-1">Opstartkosten</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Alles wat uw bedrijf nodig heeft
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Eén platform, volledig geïntegreerd. Van webshop tot WhatsApp, van offertes tot agenda.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl border border-gray-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-xl font-bold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-3 text-gray-500 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              In 3 stappen live
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Geen technische kennis nodig. Wij regelen alles.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
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
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white text-2xl font-bold rounded-2xl mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section id="sectors" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Gebouwd voor uw sector
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Elke sector krijgt een op maat gemaakt pakket met relevante templates, prijzen en workflows.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SECTORS.map((sector) => (
              <div
                key={sector.name}
                className="flex items-start gap-4 p-6 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <span className="text-3xl">{sector.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900">{sector.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{sector.examples}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Transparante prijzen
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Geen verborgen kosten. Geen opstartkosten. Maandelijks opzegbaar.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-8 rounded-2xl ${
                  plan.popular
                    ? "bg-blue-600 text-white ring-4 ring-blue-600 ring-offset-2 scale-105"
                    : "bg-white border border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-800 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                    MEEST GEKOZEN
                  </div>
                )}
                <div className="text-center">
                  <h3
                    className={`text-lg font-bold ${plan.popular ? "text-blue-100" : "text-gray-500"}`}
                  >
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className={`text-5xl font-bold ${plan.popular ? "text-white" : "text-gray-900"}`}>
                      €{plan.price}
                    </span>
                    <span className={plan.popular ? "text-blue-200" : "text-gray-400"}>
                      /maand
                    </span>
                  </div>
                  <p className={`mt-3 text-sm ${plan.popular ? "text-blue-200" : "text-gray-500"}`}>
                    {plan.desc}
                  </p>
                </div>
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg
                        className={`w-5 h-5 mt-0.5 shrink-0 ${plan.popular ? "text-blue-200" : "text-blue-600"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span className={`text-sm ${plan.popular ? "text-blue-100" : "text-gray-600"}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className={`mt-8 block text-center py-3 px-6 rounded-xl font-semibold text-sm transition-colors ${
                    plan.popular
                      ? "bg-white text-blue-700 hover:bg-blue-50"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Veelgestelde vragen</h2>
            <p className="mt-4 text-lg text-gray-500">Alles wat u moet weten over Blueprint.</p>
          </div>
          <div className="space-y-4">
            {[
              { q: "Heb ik technische kennis nodig?", a: "Nee, helemaal niet. Wij bouwen alles voor u op. U hoeft alleen uw bedrijfsinformatie aan te leveren — wij regelen de rest." },
              { q: "Hoe snel is mijn website live?", a: "Binnen 48 uur na onboarding staat uw website live, is de WhatsApp bot actief en de offerte generator klaar voor gebruik." },
              { q: "Kan ik het platform eerst uitproberen?", a: "Ja! Wij bieden een gratis demo aan. Daarin laten we zien hoe het platform er voor uw specifieke sector uitziet en werkt." },
              { q: "Wat gebeurt er met mijn data?", a: "Uw data is van u. Wij hosten alles veilig op Europese servers (AVG-compliant). Bij opzegging exporteren wij al uw gegevens." },
              { q: "Kan ik op elk moment opzeggen?", a: "Ja, maandelijks opzegbaar. Geen langlopende contracten, geen opzegkosten. U zit nergens aan vast." },
              { q: "Werkt de WhatsApp bot echt 24/7?", a: "Ja. De AI-bot beantwoordt vragen, maakt afspraken en stuurt offertes — ook buiten kantooruren. Complexe vragen worden doorgestuurd naar u." },
              { q: "Wat als mijn sector er niet bij staat?", a: "Neem contact met ons op. Blueprint is modulair opgebouwd en wij kunnen het platform aanpassen aan vrijwel elke sector." },
              { q: "Zijn er opstartkosten?", a: "Nee, geen opstartkosten. U betaalt alleen het maandelijkse abonnement. Setup, onboarding en de eerste aanpassingen zijn inbegrepen." },
            ].map((faq, i) => (
              <details key={i} className="group border border-gray-200 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-gray-900 pr-4">{faq.q}</span>
                  <svg className="w-5 h-5 text-gray-400 shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <div className="px-6 pb-5 text-gray-500 leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Contact */}
      <section id="contact" className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Klaar om te groeien?
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Plan een gratis demo en ontdek wat Blueprint voor uw bedrijf kan doen.
          </p>
          {formSuccess ? (
            <div className="mt-10 max-w-md mx-auto">
              <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
                <svg
                  className="w-12 h-12 text-green-500 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Bedankt voor uw aanvraag!
                </h3>
                <p className="text-gray-600">
                  Wij nemen binnen 24 uur contact met u op om een gratis demo
                  in te plannen.
                </p>
                <button
                  onClick={() => setFormSuccess(false)}
                  className="mt-6 text-blue-600 font-medium hover:text-blue-700 transition-colors"
                >
                  Nog een aanvraag versturen
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="mt-10 max-w-md mx-auto space-y-4">
              {formErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
                  <ul className="text-sm text-red-600 space-y-1">
                    {formErrors.map((err, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <svg
                          className="w-4 h-4 mt-0.5 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                          />
                        </svg>
                        {err}
                      </li>
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
                className="w-full px-5 py-3.5 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                name="naam"
                placeholder="Uw naam"
                value={formData.naam}
                onChange={handleFormChange}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="tel"
                name="telefoon"
                placeholder="Telefoonnummer"
                value={formData.telefoon}
                onChange={handleFormChange}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleFormChange}
                className="w-full px-5 py-3.5 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                name="sector"
                value={formData.sector}
                onChange={handleFormChange}
                className={`w-full px-5 py-3.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formData.sector ? "text-gray-900" : "text-gray-500"
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
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {formLoading ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Verzenden...
                  </>
                ) : (
                  "Vraag gratis demo aan"
                )}
              </button>
              <p className="text-sm text-gray-400">
                Wij nemen binnen 24 uur contact met u op.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="md:col-span-2">
              <div className="mb-4">
                <Image src="/logo.jpeg" alt="Blueprint" width={140} height={40} className="h-8 w-auto rounded" />
              </div>
              <p className="text-sm leading-relaxed max-w-sm">
                AI-automatisering voor het Nederlandse MKB. Webshop, WhatsApp Bot en Offerte Generator — alles in één platform.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Prijzen</a></li>
                <li><a href="#sectors" className="hover:text-white transition-colors">Sectoren</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Demo aanvragen</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>info@blueprint.nl</li>
                <li>Nederland</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; {new Date().getFullYear()} Blueprint. Alle rechten voorbehouden.</p>
            <div className="flex gap-6">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/voorwaarden" className="hover:text-white transition-colors">Voorwaarden</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

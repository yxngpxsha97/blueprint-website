"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

/* ─── Constants ─── */

const SECTORS = [
  { value: "bouw", label: "Bouw & Renovatie" },
  { value: "installatie", label: "Installatie" },
  { value: "schilders", label: "Schilders" },
  { value: "tuiniers", label: "Tuinieren & Hoveniers" },
  { value: "beauty", label: "Beauty & Wellness" },
  { value: "horeca", label: "Horeca" },
  { value: "automotive", label: "Automotive" },
  { value: "schoonmaak", label: "Schoonmaak" },
  { value: "gezondheid", label: "Gezondheid" },
];

const PLANS = [
  {
    id: "starter",
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
  },
  {
    id: "professional",
    name: "Professional",
    price: "349",
    desc: "Voor groeiende bedrijven die meer willen",
    popular: true,
    features: [
      "Alles van Starter",
      "Offerte generator",
      "Agenda & boekingen",
      "Tot 500 gesprekken/maand",
      "Eigen branding",
      "Prioriteit support",
    ],
  },
  {
    id: "enterprise",
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
  },
];

const STEPS = [
  { number: 1, label: "Bedrijfsgegevens" },
  { number: 2, label: "Contactgegevens" },
  { number: 3, label: "Abonnement" },
];

/* ─── Types ─── */

interface FormData {
  // Step 1
  kvk_nummer: string;
  bedrijfsnaam: string;
  sector: string;
  btw_nummer: string;
  // Step 2
  naam: string;
  email: string;
  telefoon: string;
  straat: string;
  postcode: string;
  stad: string;
  // Step 3
  plan: string;
}

/* ─── Page ─── */

export default function AanmeldenPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    kvk_nummer: "",
    bedrijfsnaam: "",
    sector: "",
    btw_nummer: "",
    naam: "",
    email: "",
    telefoon: "",
    straat: "",
    postcode: "",
    stad: "",
    plan: "professional",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
      if (errors.length > 0) setErrors([]);
    },
    [errors.length]
  );

  function validateStep(s: number): string[] {
    const errs: string[] = [];
    if (s === 1) {
      if (!formData.kvk_nummer.trim()) errs.push("KvK-nummer is verplicht.");
      if (!formData.bedrijfsnaam.trim()) errs.push("Bedrijfsnaam is verplicht.");
      if (!formData.sector) errs.push("Selecteer een sector.");
    }
    if (s === 2) {
      if (!formData.naam.trim()) errs.push("Naam is verplicht.");
      if (!formData.email.trim()) {
        errs.push("Email is verplicht.");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errs.push("Ongeldig email formaat.");
      }
      if (!formData.telefoon.trim()) errs.push("Telefoonnummer is verplicht.");
      if (!formData.stad.trim()) errs.push("Stad is verplicht.");
    }
    if (s === 3) {
      if (!formData.plan) errs.push("Kies een abonnement.");
    }
    return errs;
  }

  function handleNext() {
    const errs = validateStep(step);
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    setStep((prev) => Math.min(prev + 1, 3));
  }

  function handleBack() {
    setErrors([]);
    setStep((prev) => Math.max(prev - 1, 1));
  }

  async function handleSubmit() {
    const errs = validateStep(3);
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    setErrors([]);
    setLoading(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setErrors(data.errors || ["Er is een fout opgetreden. Probeer het later opnieuw."]);
      }
    } catch {
      setErrors(["Netwerkfout. Controleer uw verbinding en probeer opnieuw."]);
    } finally {
      setLoading(false);
    }
  }

  /* ─── Success State ─── */
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-8 sm:p-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Welkom bij Blueprint!
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-2">
              Uw aanmelding is succesvol ontvangen.
            </p>
            <p className="text-gray-400 text-sm mb-8">
              Wij nemen binnen 24 uur contact met u op om uw account in te richten en uw webshop, WhatsApp bot en offerte generator klaar te zetten.
            </p>

            <div className="bg-blue-50 rounded-xl p-6 text-left mb-8">
              <h3 className="font-semibold text-gray-900 mb-3">Volgende stappen:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0 mt-0.5">1</span>
                  U ontvangt een welkomstmail met inloggegevens
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0 mt-0.5">2</span>
                  Wij configureren uw webshop en WhatsApp bot
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0 mt-0.5">3</span>
                  Binnen 2 weken staat alles live
                </li>
              </ul>
            </div>

            <div className="border-t border-gray-100 pt-6 space-y-3">
              <Link
                href="/"
                className="block bg-blue-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Terug naar homepage
              </Link>
            </div>
          </div>
          <p className="text-center text-sm text-gray-400 mt-6">
            Powered by Blueprint
          </p>
        </div>
      </div>
    );
  }

  /* ─── Input helper ─── */
  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Header ─── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image src="/logo.jpeg" alt="Blueprint" width={140} height={40} className="h-8 w-auto rounded" />
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
          >
            Terug naar site
          </Link>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Aanmelden bij Blueprint
          </h1>
          <p className="mt-3 text-gray-500 text-lg">
            Start met het automatiseren van uw bedrijf. In 3 stappen klaar.
          </p>
        </div>

        {/* ─── Progress Bar ─── */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s) => (
              <div key={s.number} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    step >= s.number
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > s.number ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    s.number
                  )}
                </div>
                <span className={`text-sm font-medium hidden sm:inline ${step >= s.number ? "text-gray-900" : "text-gray-400"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* ─── Errors ─── */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <ul className="text-sm text-red-600 space-y-1">
              {errors.map((err, i) => (
                <li key={i} className="flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                  </svg>
                  {err}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ─── Step 1: Bedrijfsgegevens ─── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Bedrijfsgegevens</h2>
            <p className="text-gray-500 text-sm mb-6">Vertel ons over uw bedrijf</p>

            <div className="space-y-4">
              <div>
                <label htmlFor="kvk_nummer" className="block text-sm font-medium text-gray-700 mb-1.5">
                  KvK-nummer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="kvk_nummer"
                  name="kvk_nummer"
                  placeholder="12345678"
                  value={formData.kvk_nummer}
                  onChange={handleChange}
                  className={inputClass}
                  maxLength={8}
                />
              </div>

              <div>
                <label htmlFor="bedrijfsnaam" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bedrijfsnaam <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="bedrijfsnaam"
                  name="bedrijfsnaam"
                  placeholder="Uw bedrijfsnaam"
                  value={formData.bedrijfsnaam}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Sector <span className="text-red-500">*</span>
                </label>
                <select
                  id="sector"
                  name="sector"
                  value={formData.sector}
                  onChange={handleChange}
                  className={`${inputClass} ${formData.sector ? "text-gray-900" : "text-gray-400"}`}
                >
                  <option value="">Selecteer uw sector</option>
                  {SECTORS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="btw_nummer" className="block text-sm font-medium text-gray-700 mb-1.5">
                  BTW-nummer <span className="text-gray-400 font-normal">(optioneel)</span>
                </label>
                <input
                  type="text"
                  id="btw_nummer"
                  name="btw_nummer"
                  placeholder="NL123456789B01"
                  value={formData.btw_nummer}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Volgende
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 2: Contactgegevens ─── */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 sm:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Contactgegevens</h2>
            <p className="text-gray-500 text-sm mb-6">Hoe kunnen wij u bereiken?</p>

            <div className="space-y-4">
              <div>
                <label htmlFor="naam" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Volledige naam <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="naam"
                  name="naam"
                  placeholder="Jan de Vries"
                  value={formData.naam}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="jan@uwbedrijf.nl"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="telefoon" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Telefoonnummer <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="telefoon"
                  name="telefoon"
                  placeholder="06-12345678"
                  value={formData.telefoon}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="straat" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Straat + huisnummer <span className="text-gray-400 font-normal">(optioneel)</span>
                </label>
                <input
                  type="text"
                  id="straat"
                  name="straat"
                  placeholder="Hoofdstraat 1"
                  value={formData.straat}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Postcode
                  </label>
                  <input
                    type="text"
                    id="postcode"
                    name="postcode"
                    placeholder="1234 AB"
                    value={formData.postcode}
                    onChange={handleChange}
                    className={inputClass}
                    maxLength={7}
                  />
                </div>
                <div>
                  <label htmlFor="stad" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Stad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="stad"
                    name="stad"
                    placeholder="Amsterdam"
                    value={formData.stad}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={handleBack}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Vorige
              </button>
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Volgende
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Abonnement kiezen ─── */}
        {step === 3 && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Kies uw abonnement</h2>
              <p className="text-gray-500 text-sm">Maandelijks opzegbaar. Geen opstartkosten.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {PLANS.map((plan) => {
                const isSelected = formData.plan === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, plan: plan.id }))}
                    className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 shadow-md"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        Populair
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        </div>
                      </div>
                    )}

                    <h3 className="font-bold text-gray-900 text-sm">{plan.name}</h3>
                    <div className="mt-2 flex items-baseline gap-0.5">
                      <span className="text-2xl font-bold text-gray-900">{"\u20AC"}{plan.price}</span>
                      <span className="text-gray-400 text-xs">/maand</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">{plan.desc}</p>

                    <ul className="mt-4 space-y-1.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <svg className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={handleBack}
                className="border border-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Vorige
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verwerken...
                  </>
                ) : (
                  <>
                    Aanmelding voltooien
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-10">
          Powered by Blueprint
        </p>
      </div>
    </div>
  );
}

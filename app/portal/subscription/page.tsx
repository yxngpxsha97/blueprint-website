"use client";

import { useState, useEffect } from "react";

interface PlanDef {
  id: string;
  name: string;
  price: string;
  desc: string;
  popular?: boolean;
}

const PLANS: PlanDef[] = [
  { id: "starter", name: "Starter", price: "199", desc: "Perfect voor starters en kleine bedrijven" },
  { id: "professional", name: "Professional", price: "349", desc: "Voor groeiende bedrijven die meer willen", popular: true },
  { id: "enterprise", name: "Enterprise", price: "549", desc: "Volledig pakket met maatwerkoplossingen" },
];

interface FeatureRow {
  label: string;
  starter: string;
  professional: string;
  enterprise: string;
}

const FEATURES: FeatureRow[] = [
  { label: "Gesprekken/maand", starter: "100", professional: "500", enterprise: "Onbeperkt" },
  { label: "WhatsApp Bot", starter: "Basis", professional: "Geavanceerd", enterprise: "Geavanceerd" },
  { label: "Offerte Generator", starter: "-", professional: "Inclusief", enterprise: "Inclusief" },
  { label: "Boekingssysteem", starter: "-", professional: "Inclusief", enterprise: "Inclusief" },
  { label: "Custom Webshop", starter: "Template", professional: "Eigen branding", enterprise: "Volledig maatwerk" },
  { label: "API Toegang", starter: "-", professional: "-", enterprise: "Inclusief" },
  { label: "Prioriteit Support", starter: "-", professional: "Inclusief", enterprise: "Dedicated manager" },
];

export default function SubscriptionPage() {
  const [currentPlan, setCurrentPlan] = useState<string>("professional");
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard/data?table=subscriptions&select=tier&limit=1");
        if (res.ok) {
          const json = await res.json();
          if (json.data?.[0]?.tier) setCurrentPlan(json.data[0].tier);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  function handlePlanChange(planId: string) {
    if (planId === currentPlan) return;
    setShowConfirm(planId);
  }

  function confirmChange() {
    setShowConfirm(null);
    setToastMessage("Uw verzoek is ontvangen. Wij nemen contact met u op om de wijziging te bevestigen.");
    setTimeout(() => setToastMessage(null), 5000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm animate-[slideIn_0.3s_ease-out]">
          <div className="bg-emerald-50 text-emerald-600 rounded-xl p-4 shadow-lg flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-sm text-emerald-600">{toastMessage}</p>
            <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-emerald-600 ml-auto shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Plan wijzigen</h3>
            <p className="text-gray-500 text-sm mb-6">
              Weet u zeker dat u wilt{" "}
              {PLANS.findIndex((p) => p.id === showConfirm) > PLANS.findIndex((p) => p.id === currentPlan) ? "upgraden" : "downgraden"}{" "}
              naar <strong className="text-gray-900">{PLANS.find((p) => p.id === showConfirm)?.name}</strong>? De wijziging gaat in bij uw volgende facturatieperiode.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(null)} className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">
                Annuleren
              </button>
              <button onClick={confirmChange} className="flex-1 bg-blue-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-600 shadow-sm transition-all">
                Bevestigen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Abonnement</h1>
        <p className="text-gray-500 mt-1">Beheer uw plan en bekijk de beschikbare opties.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          const isUpgrade = PLANS.findIndex((p) => p.id === plan.id) > PLANS.findIndex((p) => p.id === currentPlan);

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl p-6 transition-all ${
                isCurrent ? "shadow-[0_0_0_2px_rgba(59,130,246,1)] ring-2 ring-blue-100" : "shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-4 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Uw huidige plan
                </div>
              )}
              {plan.popular && !isCurrent && (
                <div className="absolute -top-3 left-4 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Populair
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-900 mt-1">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-0.5">
                <span className="text-3xl font-bold text-gray-900">{"\u20AC"}{plan.price}</span>
                <span className="text-gray-500 text-sm">/maand</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">{plan.desc}</p>

              <div className="mt-6">
                {isCurrent ? (
                  <div className="w-full text-center py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-blue-600">Actief</div>
                ) : plan.id === "enterprise" ? (
                  <a href="mailto:info@blueprint.nl?subject=Enterprise%20plan%20aanvraag" className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                    Neem contact op
                  </a>
                ) : (
                  <button
                    onClick={() => handlePlanChange(plan.id)}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isUpgrade ? "bg-blue-500 text-white hover:bg-blue-600 shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {isUpgrade ? "Upgraden" : "Downgraden"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/80">
          <h2 className="text-[14px] font-bold text-gray-900">Plan vergelijking</h2>
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-sm font-medium text-gray-500 px-6 py-4 w-1/4">Feature</th>
                {PLANS.map((plan) => (
                  <th key={plan.id} className={`text-center text-sm font-semibold px-6 py-4 ${plan.id === currentPlan ? "text-blue-600 bg-blue-50" : "text-gray-900"}`}>
                    {plan.name}
                    {plan.id === currentPlan && <span className="block text-[10px] font-bold text-blue-500 mt-0.5">HUIDIG</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {FEATURES.map((row) => (
                <tr key={row.label} className="hover:bg-gray-50/50 transition-colors">
                  <td className="text-sm text-gray-900 font-medium px-6 py-4">{row.label}</td>
                  {(["starter", "professional", "enterprise"] as const).map((planId) => {
                    const val = row[planId];
                    const isCurrent = planId === currentPlan;
                    return (
                      <td key={planId} className={`text-center text-sm px-6 py-4 ${isCurrent ? "bg-blue-50" : ""} ${val === "-" ? "text-gray-300" : "text-gray-600"}`}>
                        {val === "-" ? <span className="inline-block w-4 h-0.5 bg-gray-300 rounded" /> : val}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden divide-y divide-gray-100">
          {FEATURES.map((row) => (
            <div key={row.label} className="px-6 py-4">
              <p className="text-sm font-medium text-gray-900 mb-2">{row.label}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(["starter", "professional", "enterprise"] as const).map((planId) => {
                  const val = row[planId];
                  const isCurrent = planId === currentPlan;
                  return (
                    <div key={planId} className={`text-center py-1.5 rounded-lg ${isCurrent ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-500"} ${val === "-" ? "text-gray-300" : ""}`}>
                      {val === "-" ? "--" : val}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 bg-blue-500 rounded-2xl p-6 sm:p-8 text-center text-white">
        <h3 className="text-xl font-bold mb-2">Interesse in Enterprise?</h3>
        <p className="text-blue-100 text-sm mb-6 max-w-md mx-auto">
          Onbeperkte gesprekken, custom integraties en een dedicated account manager. Neem contact met ons op voor een offerte op maat.
        </p>
        <a href="mailto:info@blueprint.nl?subject=Enterprise%20plan%20aanvraag" className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
          Neem contact op
        </a>
      </div>
    </div>
  );
}

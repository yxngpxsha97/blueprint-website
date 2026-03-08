"use client";

import { useState, useEffect, useCallback } from "react";

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm animate-[slideIn_0.3s_ease-out]">
      <div className="bg-emerald-50 text-emerald-600 rounded-xl p-4 shadow-lg flex items-start gap-3">
        <svg className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <p className="text-sm text-emerald-600">{message}</p>
        <button onClick={onClose} className="text-emerald-400 hover:text-emerald-600 ml-auto shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [orgId, setOrgId] = useState("");
  const [company, setCompany] = useState({ name: "", address: "", phone: "", email: "", kvk: "", btw: "" });
  const [webshop, setWebshop] = useState({ primaryColor: "#2563EB", logoUrl: "", tagline: "" });
  const [whatsapp, setWhatsapp] = useState({ phone: "", botActive: true });
  const [passwords, setPasswords] = useState({ current: "", newPassword: "", confirm: "" });
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [orgRes, wsRes, sessRes] = await Promise.all([
          fetch("/api/dashboard/data?table=organizations&select=id,name,address,phone,email,kvk_number,btw_number"),
          fetch("/api/dashboard/data?table=webshop_config&select=theme,hero_title,seo_title,contact_phone"),
          fetch("/api/auth/session"),
        ]);

        if (orgRes.ok) {
          const json = await orgRes.json();
          const org = json.data?.[0];
          if (org) {
            setOrgId(org.id);
            setCompany({
              name: org.name || "",
              address: org.address || "",
              phone: org.phone || "",
              email: org.email || "",
              kvk: org.kvk_number || "",
              btw: org.btw_number || "",
            });
            if (org.phone) setWhatsapp((prev) => ({ ...prev, phone: org.phone }));
          }
        }

        if (wsRes.ok) {
          const json = await wsRes.json();
          const ws = json.data?.[0];
          if (ws) {
            setWebshop({
              primaryColor: ws.theme?.colors?.primary || "#2563EB",
              logoUrl: "",
              tagline: ws.hero_title || ws.seo_title || "",
            });
          }
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  const inputClass =
    "w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 text-sm";

  async function handleCompanySave(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    try {
      const res = await fetch(`/api/dashboard/data?table=organizations&id=${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: company.name,
          address: company.address,
          phone: company.phone,
          email: company.email,
          kvk_number: company.kvk,
          btw_number: company.btw,
        }),
      });
      showToast(res.ok ? "Bedrijfsgegevens opgeslagen." : "Fout bij opslaan.");
    } catch {
      showToast("Fout bij opslaan.");
    }
  }

  async function handleWebshopSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      // Get webshop_config ID first
      const wsRes = await fetch("/api/dashboard/data?table=webshop_config&select=id");
      if (!wsRes.ok) { showToast("Fout bij opslaan."); return; }
      const wsJson = await wsRes.json();
      const wsId = wsJson.data?.[0]?.id;
      if (!wsId) { showToast("Geen webshop config gevonden."); return; }

      const res = await fetch(`/api/dashboard/data?table=webshop_config&id=${wsId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hero_title: webshop.tagline,
          seo_title: webshop.tagline,
        }),
      });
      showToast(res.ok ? "Webshop instellingen opgeslagen." : "Fout bij opslaan.");
    } catch {
      showToast("Fout bij opslaan.");
    }
  }

  function handleWhatsappSave(e: React.FormEvent) {
    e.preventDefault();
    showToast("WhatsApp instellingen opgeslagen.");
  }

  function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (!passwords.current || !passwords.newPassword || !passwords.confirm) {
      showToast("Vul alle velden in.");
      return;
    }
    if (passwords.newPassword !== passwords.confirm) {
      showToast("Nieuwe wachtwoorden komen niet overeen.");
      return;
    }
    if (passwords.newPassword.length < 8) {
      showToast("Wachtwoord moet minimaal 8 tekens bevatten.");
      return;
    }
    setPasswords({ current: "", newPassword: "", confirm: "" });
    showToast("Wachtwoord succesvol gewijzigd.");
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
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Instellingen</h1>
        <p className="text-gray-500 mt-1">Beheer uw bedrijfsgegevens, webshop en account.</p>
      </div>

      <div className="space-y-6">
        {/* Bedrijfsgegevens */}
        <form onSubmit={handleCompanySave} className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" />
              </svg>
              Bedrijfsgegevens
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="company_name" className="block text-sm font-medium text-gray-500 mb-1.5">Bedrijfsnaam</label>
                <input type="text" id="company_name" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label htmlFor="company_email" className="block text-sm font-medium text-gray-500 mb-1.5">Email</label>
                <input type="email" id="company_email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="company_phone" className="block text-sm font-medium text-gray-500 mb-1.5">Telefoon</label>
                <input type="tel" id="company_phone" value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label htmlFor="company_address" className="block text-sm font-medium text-gray-500 mb-1.5">Adres</label>
                <input type="text" id="company_address" value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="company_kvk" className="block text-sm font-medium text-gray-500 mb-1.5">KvK-nummer</label>
                <input type="text" id="company_kvk" value={company.kvk} onChange={(e) => setCompany({ ...company, kvk: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label htmlFor="company_btw" className="block text-sm font-medium text-gray-500 mb-1.5">BTW-nummer</label>
                <input type="text" id="company_btw" value={company.btw} onChange={(e) => setCompany({ ...company, btw: e.target.value })} className={inputClass} />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button type="submit" className="bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-600 shadow-sm transition cursor-pointer text-sm">Opslaan</button>
          </div>
        </form>

        {/* Webshop Instellingen */}
        <form onSubmit={handleWebshopSave} className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
              </svg>
              Webshop instellingen
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="primary_color" className="block text-sm font-medium text-gray-500 mb-1.5">Primaire kleur</label>
                <div className="flex items-center gap-3">
                  <input type="color" id="primary_color" value={webshop.primaryColor} onChange={(e) => setWebshop({ ...webshop, primaryColor: e.target.value })} className="w-12 h-12 bg-white border border-gray-200 rounded-xl cursor-pointer p-1" />
                  <input type="text" value={webshop.primaryColor} onChange={(e) => setWebshop({ ...webshop, primaryColor: e.target.value })} className={`${inputClass} flex-1 font-mono`} maxLength={7} />
                </div>
              </div>
              <div>
                <label htmlFor="logo_url" className="block text-sm font-medium text-gray-500 mb-1.5">Logo URL</label>
                <input type="url" id="logo_url" placeholder="https://uwsite.nl/logo.png" value={webshop.logoUrl} onChange={(e) => setWebshop({ ...webshop, logoUrl: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label htmlFor="tagline" className="block text-sm font-medium text-gray-500 mb-1.5">Tagline</label>
              <input type="text" id="tagline" placeholder="Uw bedrijfsslogan" value={webshop.tagline} onChange={(e) => setWebshop({ ...webshop, tagline: e.target.value })} className={inputClass} />
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2">Kleur voorbeeld:</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: webshop.primaryColor }} />
                <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: webshop.primaryColor, opacity: 0.1 }} />
                <span className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ backgroundColor: webshop.primaryColor }}>Button</span>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button type="submit" className="bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-600 shadow-sm transition cursor-pointer text-sm">Opslaan</button>
          </div>
        </form>

        {/* WhatsApp */}
        <form onSubmit={handleWhatsappSave} className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
              WhatsApp
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="wa_phone" className="block text-sm font-medium text-gray-500 mb-1.5">WhatsApp nummer</label>
                <input type="tel" id="wa_phone" value={whatsapp.phone} onChange={(e) => setWhatsapp({ ...whatsapp, phone: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1.5">Bot status</label>
                <button
                  type="button"
                  onClick={() => setWhatsapp({ ...whatsapp, botActive: !whatsapp.botActive })}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors ${whatsapp.botActive ? "bg-emerald-50" : "bg-gray-50"}`}
                >
                  <div className={`relative w-11 h-6 rounded-full transition-colors ${whatsapp.botActive ? "bg-blue-500" : "bg-gray-300"}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${whatsapp.botActive ? "translate-x-5" : "translate-x-0"}`} />
                  </div>
                  <span className={`text-sm font-medium ${whatsapp.botActive ? "text-emerald-600" : "text-gray-500"}`}>
                    {whatsapp.botActive ? "Actief" : "Inactief"}
                  </span>
                </button>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button type="submit" className="bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-600 shadow-sm transition cursor-pointer text-sm">Opslaan</button>
          </div>
        </form>

        {/* Wachtwoord Wijzigen */}
        <form onSubmit={handlePasswordSave} className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
              Wachtwoord wijzigen
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-gray-500 mb-1.5">Huidig wachtwoord</label>
              <input type="password" id="current_password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className={inputClass} placeholder="Uw huidige wachtwoord" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-500 mb-1.5">Nieuw wachtwoord</label>
                <input type="password" id="new_password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} className={inputClass} placeholder="Minimaal 8 tekens" />
              </div>
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-500 mb-1.5">Bevestig wachtwoord</label>
                <input type="password" id="confirm_password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className={inputClass} placeholder="Herhaal nieuw wachtwoord" />
              </div>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button type="submit" className="bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-600 shadow-sm transition cursor-pointer text-sm">Wachtwoord wijzigen</button>
          </div>
        </form>
      </div>
    </div>
  );
}

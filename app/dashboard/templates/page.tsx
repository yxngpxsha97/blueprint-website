'use client';

import { useState, useEffect, useCallback } from 'react';

interface WaTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  header_type: string | null;
  header_text: string | null;
  body: string;
  footer: string | null;
  buttons: { type: string; text: string; url?: string }[];
  status: string;
  sector: string | null;
  is_default: boolean;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  draft: { label: 'Concept', classes: 'bg-gray-100 text-gray-500' },
  pending: { label: 'In review', classes: 'bg-amber-50 text-amber-600' },
  approved: { label: 'Goedgekeurd', classes: 'bg-emerald-50 text-emerald-600' },
  rejected: { label: 'Afgewezen', classes: 'bg-red-50 text-red-600' },
  paused: { label: 'Gepauzeerd', classes: 'bg-amber-50 text-amber-600' },
  disabled: { label: 'Uitgeschakeld', classes: 'bg-gray-100 text-gray-400' },
};

const categoryLabels: Record<string, string> = {
  utility: 'Utility',
  authentication: 'Authenticatie',
  marketing: 'Marketing',
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      let query = `table=wa_templates&order=created_at.desc`;
      if (filter !== 'all') query += `&status=eq.${filter}`;
      const res = await fetch(`/api/dashboard/data?${query}`);
      if (res.ok) {
        const json = await res.json();
        setTemplates(json.data || []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  async function submitTemplate(id: string) {
    try {
      const res = await fetch(`/api/dashboard/data?table=wa_templates&id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending', submitted_at: new Date().toISOString() }),
      });
      if (res.ok) fetchTemplates();
    } catch { /* ignore */ }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Templates</h1>
          <p className="text-gray-500 text-sm mt-1">Beheer uw WhatsApp Business berichtsjablonen</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-600 shadow-sm transition cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nieuw template
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {['all', 'draft', 'pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              filter === s
                ? 'bg-gray-900 text-white'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {s === 'all' ? 'Alle' : statusConfig[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Create form */}
      {showCreate && <CreateTemplateForm onCreated={() => { setShowCreate(false); fetchTemplates(); }} />}

      {/* Templates list */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-8">
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="flex gap-3">
                  <div className="h-5 bg-gray-100 rounded w-40" />
                  <div className="h-5 bg-gray-100 rounded w-20" />
                  <div className="h-5 bg-gray-100 rounded w-16" />
                </div>
                <div className="h-24 bg-gray-50 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-200" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Geen templates gevonden</p>
          <p className="text-gray-400 text-xs mt-1">Maak uw eerste WhatsApp template aan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[t.status]?.classes || 'bg-gray-100 text-gray-500'}`}>
                      {statusConfig[t.status]?.label || t.status}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                      {categoryLabels[t.category] || t.category}
                    </span>
                    {t.is_default && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Standaard</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Taal: {t.language.toUpperCase()} {t.sector && `| Sector: ${t.sector}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {t.status === 'draft' && (
                    <button
                      onClick={() => submitTemplate(t.id)}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                      Indienen
                    </button>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 rounded-xl p-4 text-sm">
                {t.header_text && <p className="font-semibold text-gray-900 mb-2">{t.header_text}</p>}
                <p className="text-gray-500 whitespace-pre-wrap">{t.body}</p>
                {t.footer && <p className="text-gray-400 text-xs mt-2">{t.footer}</p>}
                {t.buttons && t.buttons.length > 0 && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    {t.buttons.map((btn, i) => (
                      <span key={i} className="px-3 py-1 bg-white rounded text-xs text-blue-600 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                        {btn.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateTemplateForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('utility');
  const [body, setBody] = useState('');
  const [footer, setFooter] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !body) return;
    setSaving(true);
    try {
      const res = await fetch('/api/dashboard/data?table=wa_templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
          language: 'nl',
          category,
          body,
          footer: footer || null,
          status: 'draft',
        }),
      });
      if (res.ok) onCreated();
    } catch { /* ignore */ }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6 mb-6">
      <div className="border-b border-gray-100 bg-gray-50/50 -mx-6 -mt-6 px-6 py-4 rounded-t-2xl mb-5">
        <h3 className="font-semibold text-gray-900">Nieuw template aanmaken</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Template naam</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="bijv. appointment_confirmation"
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categorie</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 cursor-pointer"
          >
            <option value="utility">Utility</option>
            <option value="marketing">Marketing</option>
            <option value="authentication">Authenticatie</option>
          </select>
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Berichttekst <span className="text-gray-400">(gebruik {'{{1}}'}, {'{{2}}'} voor variabelen)</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Footer (optioneel)</label>
        <input
          type="text"
          value={footer}
          onChange={(e) => setFooter(e.target.value)}
          placeholder="bijv. {bedrijfsnaam}"
          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-600 disabled:opacity-50 transition shadow-sm cursor-pointer"
        >
          {saving ? 'Opslaan...' : 'Template opslaan'}
        </button>
      </div>
    </form>
  );
}

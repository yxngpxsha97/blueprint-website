'use client';

import { useState, useEffect, useCallback } from 'react';

interface ConversationCustomer {
  name: string;
  phone: string | null;
  email: string | null;
}

interface Conversation {
  id: string;
  customer_id: string;
  status: string;
  channel: string;
  last_message_at: string | null;
  started_at: string;
  created_at: string;
  customer: ConversationCustomer | null;
}

interface Message {
  id: string;
  conversation_id: string;
  role: string;
  content: string | null;
  created_at: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Zojuist';
  if (diffMins < 60) return `${diffMins}m geleden`;
  if (diffHours < 24) return `${diffHours}u geleden`;
  if (diffDays < 7) return `${diffDays}d geleden`;
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(d);
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  active: { label: 'Actief', classes: 'bg-emerald-50 text-emerald-600' },
  closed: { label: 'Afgesloten', classes: 'bg-gray-100 text-gray-500' },
  pending: { label: 'In behandeling', classes: 'bg-amber-50 text-amber-600' },
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('select', 'id,customer_id,status,channel,last_message_at,started_at,created_at,customer:customers(name,phone,email)');
      params.set('order', 'last_message_at.desc.nullslast');
      params.set('limit', '100');
      if (statusFilter !== 'all') {
        params.set('status', `eq.${statusFilter}`);
      }
      const res = await fetch(`/api/dashboard/data?table=conversations&${params.toString()}`);
      const data = await res.json();
      setConversations(data.data ?? []);
    } catch {
      setConversations([]);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  async function loadMessages(conversationId: string) {
    setSelectedId(conversationId);
    setLoadingMessages(true);
    try {
      const params = new URLSearchParams();
      params.set('select', 'id,conversation_id,role,content,created_at');
      params.set('conversation_id', `eq.${conversationId}`);
      params.set('order', 'created_at.asc');
      params.set('limit', '200');
      const res = await fetch(`/api/dashboard/data?table=messages&${params.toString()}`);
      const data = await res.json();
      setMessages(data.data ?? []);
    } catch {
      setMessages([]);
    }
    setLoadingMessages(false);
  }

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      c.customer?.name?.toLowerCase().includes(term) ||
      c.customer?.phone?.includes(term) ||
      false
    );
  });

  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gesprekken</h1>
        <p className="text-gray-500 text-sm mt-1">WhatsApp en webchat gesprekken</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversation list */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-gray-100 space-y-3">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Zoek klant of telefoon..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                />
              </div>
              <div className="flex gap-2">
                {['all', 'active', 'pending', 'closed'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-4 py-1.5 text-[12px] rounded-full font-semibold transition cursor-pointer ${
                      statusFilter === s
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {s === 'all' ? 'Alle' : statusConfig[s]?.label ?? s}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-gray-100 animate-pulse rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 px-4">
                <svg className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                </svg>
                <p className="text-sm text-gray-500">Geen gesprekken gevonden</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[calc(100vh-300px)] overflow-y-auto">
                {filtered.map((conv) => {
                  const sc = statusConfig[conv.status] ?? statusConfig.active;
                  const isSelected = selectedId === conv.id;

                  return (
                    <button
                      key={conv.id}
                      onClick={() => loadMessages(conv.id)}
                      className={`w-full text-left px-4 py-3 transition cursor-pointer ${
                        isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-50 border-l-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {/* Channel icon */}
                          {conv.channel === 'whatsapp' ? (
                            <div className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582" />
                              </svg>
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {conv.customer?.name ?? 'Onbekende klant'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {conv.last_message_at ? formatTime(conv.last_message_at) : formatTime(conv.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 truncate">
                          {conv.customer?.phone ?? conv.customer?.email ?? ''}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${sc.classes}`}>
                          {sc.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Message view */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden h-[calc(100vh-200px)] flex flex-col">
            {!selectedId ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={0.75} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                  <p className="text-gray-500 text-sm">Selecteer een gesprek om de berichten te bekijken</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        {(selected?.customer?.name ?? '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {selected?.customer?.name ?? 'Onbekend'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {selected?.customer?.phone ?? selected?.customer?.email ?? ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selected?.channel === 'whatsapp' && (
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium">WhatsApp</span>
                    )}
                    {selected?.channel === 'web' && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">Webchat</span>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-[#F5F3EF]">
                  {loadingMessages ? (
                    <div className="space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                          <div className="h-10 bg-gray-100 animate-pulse rounded-2xl w-2/3" />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">Geen berichten in dit gesprek</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.role === 'customer' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            msg.role === 'customer'
                              ? 'bg-white text-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)]'
                              : msg.role === 'system'
                              ? 'bg-amber-50 text-amber-700 text-xs italic'
                              : 'bg-blue-500 text-white'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content ?? '[Media]'}</p>
                          <p className={`text-[10px] mt-1 ${
                            msg.role === 'customer' ? 'text-gray-400' : msg.role === 'system' ? 'text-amber-500' : 'text-blue-100'
                          }`}>
                            {new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit' }).format(new Date(msg.created_at))}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

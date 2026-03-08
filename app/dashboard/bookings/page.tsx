'use client';

import { useState, useEffect, useCallback } from 'react';

interface BookingCustomer {
  name: string;
  phone: string | null;
}

interface BookingService {
  name: string;
  duration_minutes: number | null;
}

interface Booking {
  id: string;
  customer_id: string | null;
  service_id: string | null;
  datetime: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  created_at: string;
  customer: BookingCustomer | null;
  service: BookingService | null;
}

const statusConfig: Record<string, { label: string; classes: string; dot: string }> = {
  pending: { label: 'In afwachting', classes: 'bg-amber-50 text-amber-600', dot: 'bg-amber-400' },
  confirmed: { label: 'Bevestigd', classes: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  cancelled: { label: 'Geannuleerd', classes: 'bg-red-50 text-red-600', dot: 'bg-red-400' },
  completed: { label: 'Voltooid', classes: 'bg-blue-50 text-blue-600', dot: 'bg-blue-500' },
  no_show: { label: 'Niet verschenen', classes: 'bg-orange-50 text-orange-600', dot: 'bg-orange-400' },
};

function formatDateFull(iso: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

function getWeekDates(referenceDate: Date): Date[] {
  const start = new Date(referenceDate);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

type ViewMode = 'calendar' | 'list';
type TimeFilter = 'today' | 'week' | 'next_week';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const now = new Date();
  const referenceDate = new Date(now);
  if (timeFilter === 'next_week') {
    referenceDate.setDate(referenceDate.getDate() + 7);
  }
  referenceDate.setDate(referenceDate.getDate() + weekOffset * 7);

  const weekDates = getWeekDates(referenceDate);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('select', 'id,customer_id,service_id,datetime,duration_minutes,status,notes,created_at,customer:customers(name,phone),service:services(name,duration_minutes)');
      params.set('order', 'datetime.asc');

      // Time-based filtering
      const today = new Date();
      if (timeFilter === 'today') {
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
        params.set('datetime', `gte.${startOfDay}`);
        params.append('datetime', `lt.${endOfDay}`);
      } else {
        // Load a wider range for the week view
        const start = new Date(weekDates[0]);
        const end = new Date(weekDates[6]);
        end.setDate(end.getDate() + 1);
        params.set('datetime', `gte.${start.toISOString()}`);
        params.append('datetime', `lt.${end.toISOString()}`);
      }

      const res = await fetch(`/api/dashboard/data?table=bookings&${params.toString()}`);
      const data = await res.json();
      setBookings(data.data ?? []);
    } catch {
      setBookings([]);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter, weekOffset]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function updateStatus(bookingId: string, newStatus: string) {
    try {
      await fetch(`/api/dashboard/data?table=bookings&id=${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
    } catch { /* silently fail for MVP */ }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Afspraken</h1>
          <p className="text-gray-500 text-sm mt-1">Beheer uw planning en afspraken</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="bg-gray-100 rounded-xl p-1 flex">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Kalender
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              Lijst
            </button>
          </div>
        </div>
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {([
          { key: 'today', label: 'Vandaag' },
          { key: 'week', label: 'Deze Week' },
          { key: 'next_week', label: 'Volgende Week' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setTimeFilter(key); setWeekOffset(0); }}
            className={`px-4 py-1.5 text-[12px] rounded-full font-semibold transition cursor-pointer ${
              timeFilter === key
                ? 'bg-gray-900 text-white'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}

        {timeFilter !== 'today' && (
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
            <span className="text-sm text-gray-900 font-medium min-w-[120px] text-center">
              {new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(weekDates[0])}
              {' - '}
              {new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(weekDates[6])}
            </span>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-8">
          <div className="grid grid-cols-7 gap-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-16 mx-auto" />
                <div className="h-20 bg-gray-100 rounded-lg" />
                <div className="h-16 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ) : viewMode === 'calendar' ? (
        /* Calendar Week View */
        <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-gray-100">
            {weekDates.map((date) => {
              const dayBookings = bookings.filter((b) => isSameDay(new Date(b.datetime), date));
              const isToday = isSameDay(date, new Date());

              return (
                <div key={date.toISOString()} className="min-h-[200px]">
                  {/* Day header */}
                  <div className={`px-3 py-2 text-center border-b border-gray-100 ${isToday ? 'bg-blue-50' : 'bg-gray-50/80'}`}>
                    <div className="text-xs text-gray-400 uppercase">
                      {new Intl.DateTimeFormat('nl-NL', { weekday: 'short' }).format(date)}
                    </div>
                    <div className={`text-lg font-bold ${isToday ? 'text-blue-500' : 'text-gray-900'}`}>
                      {date.getDate()}
                    </div>
                  </div>
                  {/* Bookings */}
                  <div className="p-1.5 space-y-1">
                    {dayBookings.map((booking) => {
                      const sc = statusConfig[booking.status] ?? statusConfig.pending;
                      return (
                        <button
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs cursor-pointer transition hover:opacity-80 ${sc.classes}`}
                        >
                          <div className="font-semibold truncate">
                            {formatTime(booking.datetime)}
                          </div>
                          <div className="truncate">{booking.customer?.name ?? 'Onbekend'}</div>
                          {booking.service && (
                            <div className="truncate text-[10px] opacity-75">{booking.service.name}</div>
                          )}
                        </button>
                      );
                    })}
                    {dayBookings.length === 0 && (
                      <p className="text-[10px] text-gray-400 text-center py-4">Geen afspraken</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          {bookings.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <p className="text-gray-400 text-sm">Geen afspraken in deze periode</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {bookings.map((booking) => {
                const sc = statusConfig[booking.status] ?? statusConfig.pending;
                return (
                  <div
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className="px-6 py-4 hover:bg-gray-50 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${sc.dot}`} />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {booking.customer?.name ?? 'Onbekende klant'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {booking.service?.name ?? 'Geen dienst'} &middot; {booking.duration_minutes} min
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatDateFull(booking.datetime)}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sc.classes}`}>
                          {sc.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/20" onClick={() => setSelectedBooking(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md z-10">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-900 cursor-pointer transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-gray-900 mb-4">Afspraakdetails</h3>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase">Klant</span>
                <p className="text-sm text-gray-900">{selectedBooking.customer?.name ?? 'Onbekend'}</p>
                {selectedBooking.customer?.phone && (
                  <p className="text-sm text-gray-500">{selectedBooking.customer.phone}</p>
                )}
              </div>
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase">Datum & Tijd</span>
                <p className="text-sm text-gray-900">{formatDateFull(selectedBooking.datetime)}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase">Dienst</span>
                <p className="text-sm text-gray-900">
                  {selectedBooking.service?.name ?? 'Niet opgegeven'} &middot; {selectedBooking.duration_minutes} min
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase">Status</span>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(statusConfig[selectedBooking.status] ?? statusConfig.pending).classes}`}>
                    {(statusConfig[selectedBooking.status] ?? statusConfig.pending).label}
                  </span>
                </p>
              </div>
              {selectedBooking.notes && (
                <div>
                  <span className="text-xs font-medium text-gray-400 uppercase">Notities</span>
                  <p className="text-sm text-gray-600">{selectedBooking.notes}</p>
                </div>
              )}
            </div>

            {/* Status update buttons */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-400 uppercase mb-2">Status bijwerken</p>
              <div className="flex flex-wrap gap-2">
                {['confirmed', 'completed', 'cancelled', 'no_show'].map((s) => {
                  const sc = statusConfig[s];
                  if (selectedBooking.status === s) return null;
                  return (
                    <button
                      key={s}
                      onClick={() => updateStatus(selectedBooking.id, s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${sc.classes} hover:opacity-80`}
                    >
                      {sc.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Blueprint Admin Dashboard — TypeScript Types
// Matches Supabase schema from 001_initial_schema.sql
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  sector: string | null;
  subscription_tier: 'starter' | 'professional' | 'enterprise';
  phone: string | null;
  email: string | null;
  address: string | null;
  kvk_number: string | null;
  btw_number: string | null;
  logo_url: string | null;
  primary_color: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  org_id: string;
  auth_uid: string | null;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'staff';
  phone: string | null;
  password_hash: string | null;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  org_id: string;
  tier: 'starter' | 'professional' | 'enterprise';
  price_cents: number;
  currency: string;
  status: 'active' | 'trial' | 'cancelled' | 'past_due';
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  mollie_customer_id: string | null;
  mollie_subscription_id: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price_cents: number;
  currency: string;
  duration_minutes: number | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  org_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  source: 'whatsapp' | 'website' | 'manual' | 'import';
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  org_id: string;
  customer_id: string;
  wa_conversation_id: string | null;
  status: 'active' | 'closed' | 'pending';
  channel: 'whatsapp' | 'web';
  assigned_user_id: string | null;
  started_at: string;
  last_message_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  customer?: Customer;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'customer' | 'assistant' | 'system';
  content: string | null;
  wa_message_id: string | null;
  media_url: string | null;
  media_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface QuoteItem {
  service_id: string | null;
  name: string;
  qty: number;
  unit_price_cents: number;
  total_cents: number;
}

export interface Quote {
  id: string;
  org_id: string;
  customer_id: string | null;
  quote_number: string;
  items: QuoteItem[];
  subtotal_cents: number;
  btw_percentage: number;
  btw_cents: number;
  total_cents: number;
  currency: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until: string | null;
  notes: string | null;
  pdf_url: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  customer?: Customer;
}

export interface Booking {
  id: string;
  org_id: string;
  customer_id: string | null;
  service_id: string | null;
  datetime: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes: string | null;
  cal_event_id: string | null;
  reminder_sent: boolean;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  customer?: Customer;
  service?: Service;
}

export interface WebshopConfig {
  id: string;
  org_id: string;
  domain: string | null;
  theme: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
    border_radius: string;
  };
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  about_text: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  social_links: Record<string, string>;
  seo_title: string | null;
  seo_description: string | null;
  analytics_id: string | null;
  favicon_url: string | null;
  custom_css: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  org_id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Joined fields
  user?: User;
}

export interface Template {
  id: string;
  org_id: string;
  name: string;
  category: 'greeting' | 'quote' | 'booking' | 'reminder' | 'followup' | 'marketing' | 'notification';
  content_nl: string;
  content_en: string | null;
  variables: Array<{ key: string; description: string; example: string }>;
  wa_template_name: string | null;
  wa_status: 'pending' | 'approved' | 'rejected';
  active: boolean;
  created_at: string;
  updated_at: string;
}

// Session type for auth
export interface Session {
  org_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'staff';
  org_name: string;
  user_name: string;
  user_email: string;
}

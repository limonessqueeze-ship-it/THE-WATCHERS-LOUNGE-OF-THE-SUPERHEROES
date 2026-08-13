import { createClient } from '@supabase/supabase-js';

// Read Supabase environment variables safely
const metaEnv = (import.meta as any).env || {};

export const SUPABASE_URL = metaEnv.VITE_SUPABASE_URL || 'https://uzutrjpkeolwabfaasgu.supabase.co';
export const SUPABASE_ANON_KEY = metaEnv.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6dXRyanBrZW9sd2FiZmFhc2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NzcyMzAsImV4cCI6MjEwMjA1MzIzMH0.RsF0HeuukKp6eXf2xwAvZINb7HufMrSXFgrQzI4H6EI';

export const isSupabaseConfigured = true;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export interface DbUser {
  id: string;
  nombre: string;
  contrasena?: string;
  foto_de_perfil: string;
  dinero: number;
  agent_handle?: string;
  created_at?: string;
}

// Deprecated alias for backwards compatibility
export type DbProfile = DbUser;

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function ensureUUID(idString: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(idString)) {
    return idString;
  }
  let hex = '';
  for (let i = 0; i < idString.length; i++) {
    hex += idString.charCodeAt(i).toString(16);
  }
  while (hex.length < 32) {
    hex += '0123456789abcdef'[Math.floor(Math.random() * 16)];
  }
  hex = hex.substring(0, 32);
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-4${hex.substring(13, 16)}-a${hex.substring(17, 20)}-${hex.substring(20, 32)}`;
}

export async function fetchUserFromSupabase(identifier: string): Promise<DbUser | null> {
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    let query = supabase.from('users').select('*');
    if (isUuid) {
      query = query.eq('id', identifier);
    } else {
      query = query.ilike('nombre', identifier);
    }
    const { data, error } = await query.maybeSingle();

    if (error) {
      console.debug('Supabase fetch user notice:', error.message);
      return null;
    }
    return data as DbUser | null;
  } catch (err) {
    console.debug('Error in fetchUserFromSupabase:', err);
    return null;
  }
}

export async function fetchProfileFromSupabase(userId: string): Promise<DbUser | null> {
  return fetchUserFromSupabase(userId);
}

export async function saveUserToSupabase(userData: {
  id: string;
  nombre: string;
  contrasena?: string;
  foto_de_perfil?: string;
  dinero?: number;
  agent_handle?: string;
}) {
  try {
    const validId = ensureUUID(userData.id);

    const payload: any = {
      id: validId,
      nombre: userData.nombre || 'Usuario',
      foto_de_perfil: userData.foto_de_perfil || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      dinero: userData.dinero ?? 500,
      agent_handle: userData.agent_handle || `@${(userData.nombre || 'user').toLowerCase()}`
    };

    if (userData.contrasena) {
      payload.contrasena = userData.contrasena;
    }

    const { data, error } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase save user notice:', error.message);
    } else {
      console.log('Saved user to Supabase users table:', validId);
    }

    return { data, error };
  } catch (err) {
    console.debug('Error in saveUserToSupabase:', err);
    return { data: null, error: err };
  }
}

export async function saveProfileToSupabase(profile: any, _hasSupabaseAuth?: boolean) {
  return saveUserToSupabase({
    id: profile.id,
    nombre: profile.username || profile.nombre || 'Usuario',
    foto_de_perfil: profile.avatar_url || profile.foto_de_perfil,
    dinero: profile.nexus_points ?? profile.dinero ?? 500,
    agent_handle: profile.agent_handle
  });
}

export interface DbForumMessage {
  id: string;
  channel: string;
  author_name: string;
  author_handle: string;
  author_id?: string;
  avatar_url?: string;
  content: string;
  image_url?: string;
  reactions: Record<string, number>;
  created_at?: string;
}

export async function fetchForumMessagesFromSupabase(): Promise<DbForumMessage[]> {
  try {
    const { data, error } = await supabase
      .from('forum_messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.debug('Supabase fetch forum messages notice:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.debug('Error fetching forum messages from Supabase:', err);
    return [];
  }
}

export async function saveForumMessageToSupabase(msg: DbForumMessage) {
  try {
    const payload = {
      id: msg.id,
      channel: msg.channel,
      author_name: msg.author_name,
      author_handle: msg.author_handle,
      author_id: msg.author_id || null,
      avatar_url: msg.avatar_url || '',
      content: msg.content || '',
      image_url: msg.image_url || '',
      reactions: msg.reactions || {},
      created_at: msg.created_at || new Date().toISOString()
    };

    const { error } = await supabase
      .from('forum_messages')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase save forum message notice:', error.message);
    }
  } catch (err) {
    console.debug('Error in saveForumMessageToSupabase:', err);
  }
}

export async function updateForumMessageReactionsInSupabase(messageId: string, reactions: Record<string, number>) {
  try {
    const { error } = await supabase
      .from('forum_messages')
      .update({ reactions })
      .eq('id', messageId);

    if (error) {
      console.warn('Supabase update forum reactions notice:', error.message);
    }
  } catch (err) {
    console.debug('Error in updateForumMessageReactionsInSupabase:', err);
  }
}

export async function fetchAllUsersFromSupabase(): Promise<DbUser[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.debug('Supabase fetch all users notice:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.debug('Error fetching all users from Supabase:', err);
    return [];
  }
}

export async function transferMoneyInSupabase(senderId: string, recipientId: string, amount: number) {
  try {
    const recipient = await fetchUserFromSupabase(recipientId);
    if (recipient) {
      const newRecipientMoney = (recipient.dinero ?? 500) + amount;
      await supabase
        .from('users')
        .update({ dinero: newRecipientMoney })
        .eq('id', recipient.id);
      console.log(`Transferred ${amount} to user ${recipientId}. New balance: ${newRecipientMoney}`);
    }
  } catch (err) {
    console.error('Error in transferMoneyInSupabase:', err);
  }
}

export interface DbTeoria {
  id: string;
  titulo: string;
  categoria: string;
  fase: string;
  resumen: string;
  desarrollo?: string;
  imagen?: string;
  autor: string;
  created_at?: string;
}

export async function fetchTeoriasFromSupabase(): Promise<DbTeoria[]> {
  try {
    const { data, error } = await supabase
      .from('teorias')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.debug('Supabase fetch teorias notice:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.debug('Error fetching teorias from Supabase:', err);
    return [];
  }
}

export async function saveTeoriaToSupabase(teoria: DbTeoria) {
  try {
    const payload = {
      id: teoria.id,
      titulo: teoria.titulo,
      categoria: teoria.categoria || 'Películas',
      fase: teoria.fase || 'Fase 6',
      resumen: teoria.resumen || '',
      desarrollo: teoria.desarrollo || '',
      imagen: teoria.imagen || '',
      autor: teoria.autor || 'Agente de la TVA',
      created_at: teoria.created_at || new Date().toISOString()
    };

    const { error } = await supabase
      .from('teorias')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase save teoria notice:', error.message);
    } else {
      console.log('Saved teoria to Supabase teorias table:', teoria.id);
    }
  } catch (err) {
    console.debug('Error in saveTeoriaToSupabase:', err);
  }
}




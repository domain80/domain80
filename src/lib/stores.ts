import { atom, map } from 'nanostores';
import { supabase, type Profile } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

// ============================================
// Auth Store - shared across components
// ============================================

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
}

export const $auth = atom<AuthState>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
});

// Promise deduplication - prevents race conditions
let authPromise: Promise<AuthState> | null = null;

// Session storage key for profile cache
const PROFILE_CACHE_KEY = 'cached_profile';
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedProfile(userId: string): Profile | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (!cached) return null;
    const { profile, timestamp, uid } = JSON.parse(cached);
    if (uid !== userId) return null; // Different user
    if (Date.now() - timestamp > PROFILE_CACHE_TTL) return null; // Expired
    return profile;
  } catch {
    return null;
  }
}

function setCachedProfile(userId: string, profile: Profile) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({
      profile,
      timestamp: Date.now(),
      uid: userId,
    }));
  } catch {
    // Ignore storage errors
  }
}

export async function initAuth(): Promise<AuthState> {
  // Return cached state if already loaded this session
  const current = $auth.get();
  if (!current.isLoading && current.session !== null) {
    return current;
  }

  // If a request is already in flight, wait for it (deduplication)
  if (authPromise) {
    return authPromise;
  }

  // Start the auth fetch
  authPromise = (async () => {
    const { data: { session } } = await supabase.auth.getSession();

    let profile: Profile | null = null;
    if (session?.user) {
      // Try cached profile first
      profile = getCachedProfile(session.user.id);

      if (!profile) {
        // Fetch from DB
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        profile = data;

        // Cache it
        if (profile) {
          setCachedProfile(session.user.id, profile);
        }
      }
    }

    const state: AuthState = {
      session,
      user: session?.user || null,
      profile,
      isLoading: false,
    };

    $auth.set(state);
    return state;
  })();

  const result = await authPromise;
  authPromise = null; // Clear for next page navigation
  return result;
}

export function clearAuth() {
  authPromise = null;
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(PROFILE_CACHE_KEY);
  }
  $auth.set({
    session: null,
    user: null,
    profile: null,
    isLoading: true,
  });
}

// ============================================
// Comments Cache - by post slug
// ============================================

interface CommentsCacheEntry {
  data: unknown[];
  timestamp: number;
  count: number;
}

const COMMENTS_TTL = 5 * 60 * 1000; // 5 minutes

export const $commentsCache = map<Record<string, CommentsCacheEntry>>({});

export function getCachedComments(slug: string): CommentsCacheEntry | null {
  const cache = $commentsCache.get();
  const entry = cache[slug];

  if (!entry) return null;

  // Check if cache is still valid
  if (Date.now() - entry.timestamp > COMMENTS_TTL) {
    return null; // Cache expired
  }

  return entry;
}

export function setCachedComments(slug: string, data: unknown[], count: number) {
  $commentsCache.setKey(slug, {
    data,
    timestamp: Date.now(),
    count,
  });
}

export function invalidateComments(slug: string) {
  const cache = $commentsCache.get();
  const newCache = { ...cache };
  delete newCache[slug];
  $commentsCache.set(newCache);
}

// ============================================
// Likes Cache - by post slug
// ============================================

interface LikesCacheEntry {
  count: number;
  hasLiked: boolean;
  timestamp: number;
}

const LIKES_TTL = 1 * 60 * 1000; // 1 minute

export const $likesCache = map<Record<string, LikesCacheEntry>>({});

export function getCachedLikes(slug: string): LikesCacheEntry | null {
  const cache = $likesCache.get();
  const entry = cache[slug];

  if (!entry) return null;

  if (Date.now() - entry.timestamp > LIKES_TTL) {
    return null;
  }

  return entry;
}

export function setCachedLikes(slug: string, count: number, hasLiked: boolean) {
  $likesCache.setKey(slug, {
    count,
    hasLiked,
    timestamp: Date.now(),
  });
}

export function updateCachedLikes(slug: string, hasLiked: boolean) {
  const cache = $likesCache.get();
  const entry = cache[slug];

  if (entry) {
    $likesCache.setKey(slug, {
      ...entry,
      count: hasLiked ? entry.count + 1 : entry.count - 1,
      hasLiked,
      timestamp: Date.now(),
    });
  }
}

export function invalidateLikes(slug: string) {
  const cache = $likesCache.get();
  const newCache = { ...cache };
  delete newCache[slug];
  $likesCache.set(newCache);
}

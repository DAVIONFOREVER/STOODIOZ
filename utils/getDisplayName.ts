/**
 * Display name for profiles. Use this whenever we show "who" to the user.
 *
 * RULES:
 * - id / profile_id: internal only (API, DB, state, keys). Never pass to getDisplayName or show in UI.
 * - name, username, company_name, artist_name, stage_name, display_name, full_name: for display. This helper picks the right one.
 * 
 * Priority order:
 * 1. display_name (user's chosen public name)
 * 2. username (treated same as display_name)
 * 
 * ID Detection: Filters out names that look like database IDs (e.g., "artis_444a8", "engin_abc123")
 */
function looksLikeId(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim().toLowerCase();
  // Check for role-table IDs: artis_, artist_, engin_, produc_, stood_, label_, user_ + hex/suffix
  return /^(artis|artist|engin|produc|stood|label|user)_[a-f0-9]+/i.test(trimmed) ||
         /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
}

function looksLikePlaceholder(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim().toLowerCase();
  return ['someone', 'unknown', 'user', 'n/a', 'na', 'none'].includes(trimmed);
}

function looksLikeEmail(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  return value.includes('@') && value.includes('.');
}

/**
 * Your 5 accounts → exact display names shown everywhere in the app.
 * Aria is always "Aria Cantata" and does not need to be listed here.
 */
const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  'warstudiosatl@gmail.com': 'Wealth and Riches Music',
  'vijetamusic@gmail.com': 'Vijeta',
  'davionforever@gmail.com': 'Davion Forever',
  'mixedbydavion@gmail.com': 'Mixed By Davion',
  'atlanticrecords@gmail.com': 'Atlantic Records',
};

export function getDisplayName(
  entity: { 
    name?: string | null; 
    username?: string | null; 
    company_name?: string | null; 
    artist_name?: string | null;
    stage_name?: string | null;
    display_name?: string | null;
    full_name?: string | null;
    email?: string | null;
  } | null | undefined,
  fallback = 'Someone'
): string {
  if (entity == null) return fallback;
  const nested = (entity as any)?.profiles || (entity as any)?.profile || null;
  const primaryEmail =
    (entity as any)?.email ||
    nested?.email ||
    (looksLikeEmail((entity as any)?.name) ? (entity as any)?.name : '') ||
    (looksLikeEmail((entity as any)?.username) ? (entity as any)?.username : '') ||
    '';
  const nameLower = String(entity.name || nested?.name || '').toLowerCase();
  const usernameLower = String(entity.username || nested?.username || '').toLowerCase();
  const fullNameLower = String((entity as any)?.full_name || nested?.full_name || '').toLowerCase();
  const displayNameLower = String((entity as any)?.display_name ?? nested?.display_name ?? '').toLowerCase();
  const rawId = String((entity as any)?.id || (entity as any)?.profile_id || '').toLowerCase();
  // Aria Cantata: no exceptions — always this exact display name (check all name-like fields)
  if (
    primaryEmail === 'aria@stoodioz.ai' ||
    usernameLower === 'aria' ||
    nameLower === 'aria' ||
    nameLower.includes('aria cantata') ||
    fullNameLower === 'aria' ||
    fullNameLower.includes('aria cantata') ||
    displayNameLower === 'aria' ||
    displayNameLower.includes('aria cantata') ||
    rawId === 'aria'
  ) {
    return 'Aria Cantata';
  }

  const emailKey = primaryEmail?.trim().toLowerCase() || '';
  if (emailKey && DISPLAY_NAME_OVERRIDES[emailKey]) return DISPLAY_NAME_OVERRIDES[emailKey];

  const displayName = (entity as any)?.display_name ?? nested?.display_name;
  const username = entity?.username ?? nested?.username;

  const formatHandle = (value: string): string | null => {
    if (!value || typeof value !== 'string') return null;
    let cleaned = value.replace(/[._-]+/g, ' ').trim();
    if (cleaned && !cleaned.includes(' ') && /by/i.test(cleaned)) {
      cleaned = cleaned.replace(/([a-z])by([a-z])/gi, '$1 by $2');
    }
    if (!cleaned) return null;
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length === 0) return null;
    return words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };
  
  // Return first valid (non-ID-like) name found
  if (displayName && typeof displayName === 'string' && displayName.trim() && !looksLikeId(displayName) && !looksLikePlaceholder(displayName) && !looksLikeEmail(displayName)) {
    return displayName.trim();
  }
  if (username && typeof username === 'string' && username.trim() && !looksLikeId(username) && !looksLikeEmail(username)) {
    return formatHandle(username) || username.trim();
  }

  const nameCandidates = [
    entity?.name,
    (entity as any)?.full_name,
    (entity as any)?.company_name,
    (entity as any)?.artist_name,
    (entity as any)?.stage_name,
    nested?.name,
    nested?.full_name,
    nested?.company_name,
    nested?.artist_name,
    nested?.stage_name,
  ];
  for (const candidate of nameCandidates) {
    if (typeof candidate !== 'string') continue;
    const trimmed = candidate.trim();
    if (!trimmed || looksLikeId(trimmed) || looksLikePlaceholder(trimmed) || looksLikeEmail(trimmed)) continue;
    return trimmed;
  }
  
  // If all fields are ID-like or empty, return fallback
  return fallback;
}

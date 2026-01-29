/**
 * Display name for profiles. Use this whenever we show "who" to the user.
 *
 * RULES:
 * - id / profile_id: internal only (API, DB, state, keys). Never pass to getDisplayName or show in UI.
 * - name, username, company_name, artist_name, stage_name, display_name, full_name: for display. This helper picks the right one.
 * 
 * Priority order:
 * 1. stage_name (artist stage name)
 * 2. display_name (user's preferred display name)
 * 3. company_name (for labels/studios)
 * 4. artist_name (legacy field)
 * 5. full_name (full legal name)
 * 6. name (default name field) - BUT skip if it looks like an ID
 * 7. username (fallback) - BUT skip if it looks like an ID
 * 
 * ID Detection: Filters out names that look like database IDs (e.g., "artis_444a8", "engin_abc123")
 */
function looksLikeId(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim().toLowerCase();
  // Check for patterns like "artis_", "engin_", "produc_", "stood_", "label_" followed by hex/uuid-like chars
  return /^(artis|engin|produc|stood|label|user)_[a-f0-9]{4,}/i.test(trimmed) ||
         // Or UUID-like patterns
         /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
}

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
  const email = (entity as any)?.email || '';
  const nameLower = String(entity.name || '').toLowerCase();
  const usernameLower = String(entity.username || '').toLowerCase();
  if (email === 'aria@stoodioz.ai' || usernameLower === 'aria' || nameLower === 'aria' || nameLower.includes('aria cantata')) {
    return 'Aria Cantata';
  }
  const nested = (entity as any)?.profiles || (entity as any)?.profile || null;
  
  // Check fields in priority order, skipping ID-like values
  const stageName = (entity as any)?.stage_name || nested?.stage_name;
  const displayName = (entity as any)?.display_name || nested?.display_name;
  const companyName = (entity as any)?.company_name || nested?.company_name;
  const artistName = (entity as any)?.artist_name || nested?.artist_name;
  const fullName = (entity as any)?.full_name || nested?.full_name;
  const name = entity?.name || nested?.name;
  const username = entity?.username || nested?.username;
  const emailName = (entity as any)?.email || nested?.email || '';

  const formatHandle = (value: string): string | null => {
    if (!value || typeof value !== 'string') return null;
    const cleaned = value.replace(/[._-]+/g, ' ').trim();
    if (!cleaned) return null;
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length === 0) return null;
    return words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };
  
  // Return first valid (non-ID-like) name found
  if (stageName && typeof stageName === 'string' && stageName.trim() && !looksLikeId(stageName)) {
    return stageName.trim();
  }
  if (displayName && typeof displayName === 'string' && displayName.trim() && !looksLikeId(displayName)) {
    return displayName.trim();
  }
  if (companyName && typeof companyName === 'string' && companyName.trim() && !looksLikeId(companyName)) {
    return companyName.trim();
  }
  if (artistName && typeof artistName === 'string' && artistName.trim() && !looksLikeId(artistName)) {
    return artistName.trim();
  }
  if (fullName && typeof fullName === 'string' && fullName.trim() && !looksLikeId(fullName)) {
    return fullName.trim();
  }
  if (name && typeof name === 'string' && name.trim() && !looksLikeId(name)) {
    return name.trim();
  }
  if (username && typeof username === 'string' && username.trim() && !looksLikeId(username)) {
    return formatHandle(username) || username.trim();
  }
  const emailFallback = formatHandle(emailName.split('@')[0] || '');
  if (emailFallback && !looksLikeId(emailFallback)) {
    return emailFallback;
  }
  
  // If all fields are ID-like or empty, return fallback
  return fallback;
}

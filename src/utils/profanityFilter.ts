// Moderate & filter explicit/inappropriate usernames and content in Spanish & English

const EXPLICIT_TERMS: string[] = [
  // Spanish explicit / vulgar terms
  'puta', 'puto', 'putita', 'putito', 'puton', 'putona',
  'pendejo', 'pendeja', 'pendejos', 'pendejas',
  'cabron', 'cabrona', 'cabrones',
  'verga', 'vergazo', 'vergon', 'envergar',
  'pinga', 'pito', 'pene', 'vagina', 'vacio', 'concha', 'conchuda', 'chota', 'poronga', 'mamon', 'mamona', 'mamada',
  'mierda', 'mierdero', 'caca', 'culo', 'culon', 'culona', 'culear', 'follar', 'follada',
  'zorra', 'zorro', 'bobo', 'tarado', 'imbecil', 'estupido', 'estupida', 'idiota', 'maricon', 'marica', 'joto', 'jotolon',
  'puto', 'nazi', 'hitler', 'violador', 'violadora', 'violacion', 'pedofilo', 'pedofila', 'pederasta',
  'chupa', 'chupada', 'chupame', 'tetas', 'chichi', 'chichis', 'tetazas', 'coño', 'pollon', 'polla', 'polla',

  // English explicit / vulgar terms
  'fuck', 'fucker', 'fucking', 'fuckhead', 'shit', 'shitting', 'shitty',
  'bitch', 'bitches', 'cunt', 'dick', 'cock', 'pussy', 'asshole', 'ass', 'bastard',
  'slut', 'whore', 'nigger', 'nigga', 'faggot', 'fag', 'retard', 'nazis',
  'porn', 'porno', 'pornography', 'sex', 'sexy', 'hentai', 'xvideo', 'xnxx',
  'anal', 'boobs', 'penis', 'vagina', 'cum', 'ejaculation', 'orgasm'
];

/**
  Normalizes text converting leetspeak numbers & symbols into standard letters,
  removing punctuation/spaces, and removing consecutive repeated characters.
 */
function normalizeText(text: string): string {
  let normalized = text.toLowerCase().trim();

  // Leetspeak replacements
  const leetMap: Record<string, string> = {
    '@': 'a',
    '4': 'a',
    'á': 'a',
    'à': 'a',
    'ä': 'a',
    '3': 'e',
    'é': 'e',
    'è': 'e',
    'ë': 'e',
    '1': 'i',
    '!': 'i',
    '|': 'i',
    'í': 'i',
    'ì': 'i',
    'ï': 'i',
    '0': 'o',
    'ó': 'o',
    'ò': 'o',
    'ö': 'o',
    '5': 's',
    '$': 's',
    '7': 't',
    '+': 't',
    'ú': 'u',
    'ù': 'u',
    'ü': 'u',
    'vv': 'w'
  };

  let converted = '';
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    converted += leetMap[char] || char;
  }

  // Remove non-alphanumeric characters (spaces, hyphens, underscores, dots, etc.)
  const cleanAlpha = converted.replace(/[^a-z0-9]/g, '');

  // Collapse 3 or more repeated letters to 1 (e.g. "puuuutaaa" -> "puta")
  const collapsed = cleanAlpha.replace(/(.)\1{2,}/g, '$1');

  return collapsed;
}

/**
 * Checks if a given username or handle contains explicit/inappropriate terms.
 * Returns an object indicating if it's explicit and a friendly Spanish reason.
 */
export function checkExplicitName(name: string): { isExplicit: boolean; reason?: string } {
  if (!name || typeof name !== 'string') {
    return { isExplicit: false };
  }

  const rawLower = name.toLowerCase();
  const normalized = normalizeText(name);

  for (const term of EXPLICIT_TERMS) {
    // Check raw substring
    if (rawLower.includes(term)) {
      return {
        isExplicit: true,
        reason: 'El nombre contiene lenguaje inapropiado o explícito no permitido en la TVA.'
      };
    }

    // Check normalized (leetspeak / special char stripped) substring
    if (normalized.includes(term)) {
      return {
        isExplicit: true,
        reason: 'El nombre contiene variantes de palabras explícitas o inapropiadas.'
      };
    }
  }

  return { isExplicit: false };
}

/**
 * Clears all local accounts and user sessions saved in localStorage and sessionStorage.
 */
export function clearAllLocalAccounts() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('mcu_registered_accounts_v1');
  localStorage.removeItem('watcher_lounge_user_v2');
  localStorage.removeItem('mcu_registered_users');
  localStorage.removeItem('mcu_user');
  localStorage.removeItem('mcu_discord_forum_messages_v2');
  localStorage.removeItem('mcu_user_v1');
  localStorage.removeItem('mcu_user_v2');
  localStorage.removeItem('mcu_casino_history');
  sessionStorage.clear();
  console.log('Todas las cuentas locales y datos de sesión han sido eliminados.');
}

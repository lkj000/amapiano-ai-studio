/**
 * Amapiano Gasp / Vocal Technique Generator
 * 
 * Implements the characteristic vocal interjections, gasps, and ad-libs
 * that define authentic amapiano vocal production.
 * 
 * Includes: "Eish!", "Hayi!", "Yebo!", gasping techniques, and call-response patterns.
 */

export interface VocalInterjection {
  type: 'gasp' | 'exclamation' | 'adlib' | 'call' | 'response';
  text: string;
  phonetic: string;
  language: string;
  timing: 'downbeat' | 'upbeat' | 'pickup' | 'fill' | 'transition';
  energy: 'low' | 'medium' | 'high' | 'explosive';
  duration: number; // in beats
  pitchContour: 'rising' | 'falling' | 'flat' | 'wave';
}

export interface GaspPattern {
  name: string;
  interjections: VocalInterjection[];
  description: string;
  cultural_context: string;
}

/**
 * Authentic Amapiano Vocal Interjections by Language
 */
export const VOCAL_INTERJECTIONS: Record<string, VocalInterjection[]> = {
  zulu: [
    { type: 'exclamation', text: 'Yebo!', phonetic: 'ye-bo', language: 'zulu', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Hayi!', phonetic: 'ha-yi', language: 'zulu', timing: 'upbeat', energy: 'medium', duration: 0.25, pitchContour: 'rising' },
    { type: 'adlib', text: 'Awu!', phonetic: 'a-wu', language: 'zulu', timing: 'fill', energy: 'high', duration: 0.5, pitchContour: 'wave' },
    { type: 'exclamation', text: 'Eish!', phonetic: 'eysh', language: 'zulu', timing: 'pickup', energy: 'medium', duration: 0.25, pitchContour: 'falling' },
    { type: 'gasp', text: 'Hhayi bo!', phonetic: 'hai-bo', language: 'zulu', timing: 'transition', energy: 'explosive', duration: 0.75, pitchContour: 'rising' },
    { type: 'call', text: 'Lalela!', phonetic: 'la-le-la', language: 'zulu', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'flat' },
    { type: 'adlib', text: 'Shaya!', phonetic: 'sha-ya', language: 'zulu', timing: 'fill', energy: 'explosive', duration: 0.5, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Sho!', phonetic: 'sho', language: 'zulu', timing: 'upbeat', energy: 'medium', duration: 0.25, pitchContour: 'flat' },
    { type: 'response', text: 'Kunjani!', phonetic: 'kun-ja-ni', language: 'zulu', timing: 'downbeat', energy: 'medium', duration: 0.75, pitchContour: 'rising' },
    { type: 'gasp', text: '(inhale) Ah!', phonetic: 'ahhh', language: 'zulu', timing: 'pickup', energy: 'low', duration: 0.5, pitchContour: 'rising' },
  ],
  
  xhosa: [
    { type: 'exclamation', text: 'Ewe!', phonetic: 'e-we', language: 'xhosa', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Hayi!', phonetic: 'ha-yi', language: 'xhosa', timing: 'upbeat', energy: 'medium', duration: 0.25, pitchContour: 'rising' },
    { type: 'gasp', text: 'Yhoo!', phonetic: 'yho-o', language: 'xhosa', timing: 'transition', energy: 'explosive', duration: 0.75, pitchContour: 'wave' },
    { type: 'adlib', text: 'Molo!', phonetic: 'mo-lo', language: 'xhosa', timing: 'pickup', energy: 'medium', duration: 0.5, pitchContour: 'flat' },
    { type: 'call', text: 'Mamela!', phonetic: 'ma-me-la', language: 'xhosa', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'rising' },
    { type: 'exclamation', text: 'Ncaa!', phonetic: 'n-caa', language: 'xhosa', timing: 'fill', energy: 'medium', duration: 0.25, pitchContour: 'falling' },
    { type: 'response', text: 'Kunjani!', phonetic: 'kun-ja-ni', language: 'xhosa', timing: 'downbeat', energy: 'medium', duration: 0.75, pitchContour: 'rising' },
  ],
  
  tsonga: [
    { type: 'exclamation', text: 'Ina!', phonetic: 'i-na', language: 'tsonga', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'gasp', text: 'Xewani!', phonetic: 'xe-wa-ni', language: 'tsonga', timing: 'transition', energy: 'explosive', duration: 0.75, pitchContour: 'wave' },
    { type: 'adlib', text: 'Avuxeni!', phonetic: 'a-vu-xe-ni', language: 'tsonga', timing: 'pickup', energy: 'high', duration: 1, pitchContour: 'rising' },
    { type: 'call', text: 'Yingisani!', phonetic: 'yi-ngi-sa-ni', language: 'tsonga', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'flat' },
    { type: 'exclamation', text: 'Chaaa!', phonetic: 'cha-a', language: 'tsonga', timing: 'fill', energy: 'medium', duration: 0.5, pitchContour: 'falling' },
  ],
  
  tswana: [
    { type: 'exclamation', text: 'Ee!', phonetic: 'e-e', language: 'tswana', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Aowa!', phonetic: 'a-o-wa', language: 'tswana', timing: 'upbeat', energy: 'medium', duration: 0.5, pitchContour: 'rising' },
    { type: 'gasp', text: 'Jo!', phonetic: 'jo', language: 'tswana', timing: 'transition', energy: 'explosive', duration: 0.25, pitchContour: 'rising' },
    { type: 'call', text: 'Reetsa!', phonetic: 're-e-tsa', language: 'tswana', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'flat' },
    { type: 'adlib', text: 'Sharp sharp!', phonetic: 'sharp-sharp', language: 'tswana', timing: 'fill', energy: 'medium', duration: 0.5, pitchContour: 'flat' },
  ],
  
  sotho: [
    { type: 'exclamation', text: 'E!', phonetic: 'e', language: 'sotho', timing: 'downbeat', energy: 'high', duration: 0.25, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Tjhe!', phonetic: 'tje', language: 'sotho', timing: 'upbeat', energy: 'medium', duration: 0.25, pitchContour: 'rising' },
    { type: 'gasp', text: 'Joo!', phonetic: 'jo-o', language: 'sotho', timing: 'transition', energy: 'explosive', duration: 0.5, pitchContour: 'wave' },
    { type: 'call', text: 'Mamela!', phonetic: 'ma-me-la', language: 'sotho', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'flat' },
    { type: 'adlib', text: 'Le nna!', phonetic: 'le-nna', language: 'sotho', timing: 'fill', energy: 'medium', duration: 0.5, pitchContour: 'rising' },
  ],
  
  pedi: [
    { type: 'exclamation', text: 'Ee!', phonetic: 'e-e', language: 'pedi', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'gasp', text: 'Joo!', phonetic: 'jo-o', language: 'pedi', timing: 'transition', energy: 'explosive', duration: 0.5, pitchContour: 'wave' },
    { type: 'call', text: 'Theeletša!', phonetic: 'the-e-le-tša', language: 'pedi', timing: 'downbeat', energy: 'high', duration: 1, pitchContour: 'flat' },
    { type: 'adlib', text: 'Ke šoro!', phonetic: 'ke-sho-ro', language: 'pedi', timing: 'fill', energy: 'medium', duration: 0.5, pitchContour: 'falling' },
  ],
  
  venda: [
    { type: 'exclamation', text: 'Ee!', phonetic: 'e-e', language: 'venda', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'gasp', text: 'Hai!', phonetic: 'ha-i', language: 'venda', timing: 'transition', energy: 'explosive', duration: 0.25, pitchContour: 'rising' },
    { type: 'call', text: 'Thetshelesani!', phonetic: 'the-tshe-le-sa-ni', language: 'venda', timing: 'downbeat', energy: 'high', duration: 1, pitchContour: 'flat' },
    { type: 'adlib', text: 'Ndi khou!', phonetic: 'ndi-khou', language: 'venda', timing: 'fill', energy: 'medium', duration: 0.5, pitchContour: 'falling' },
  ],
  
  ndebele: [
    { type: 'exclamation', text: 'Yebo!', phonetic: 'ye-bo', language: 'ndebele', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'gasp', text: 'Hawu!', phonetic: 'ha-wu', language: 'ndebele', timing: 'transition', energy: 'explosive', duration: 0.5, pitchContour: 'wave' },
    { type: 'call', text: 'Lalelani!', phonetic: 'la-le-la-ni', language: 'ndebele', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'flat' },
  ],
  
  swati: [
    { type: 'exclamation', text: 'Yebo!', phonetic: 'ye-bo', language: 'swati', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'gasp', text: 'Hawu!', phonetic: 'ha-wu', language: 'swati', timing: 'transition', energy: 'explosive', duration: 0.5, pitchContour: 'wave' },
    { type: 'call', text: 'Lalelani!', phonetic: 'la-le-la-ni', language: 'swati', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'flat' },
    { type: 'adlib', text: 'Siyabonga!', phonetic: 'si-ya-bo-nga', language: 'swati', timing: 'fill', energy: 'medium', duration: 1, pitchContour: 'falling' },
  ],
  
  afrikaans: [
    { type: 'exclamation', text: 'Ja!', phonetic: 'ya', language: 'afrikaans', timing: 'downbeat', energy: 'high', duration: 0.25, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Nee man!', phonetic: 'nee-man', language: 'afrikaans', timing: 'upbeat', energy: 'medium', duration: 0.5, pitchContour: 'falling' },
    { type: 'gasp', text: 'Jirre!', phonetic: 'yi-re', language: 'afrikaans', timing: 'transition', energy: 'explosive', duration: 0.5, pitchContour: 'wave' },
    { type: 'adlib', text: 'Lekker!', phonetic: 'lek-ker', language: 'afrikaans', timing: 'fill', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'call', text: 'Luister!', phonetic: 'lœis-ter', language: 'afrikaans', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'flat' },
  ],
  
  english: [
    { type: 'exclamation', text: 'Yeah!', phonetic: 'yeah', language: 'english', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Eish!', phonetic: 'eysh', language: 'english', timing: 'upbeat', energy: 'medium', duration: 0.25, pitchContour: 'falling' },
    { type: 'gasp', text: 'Yo!', phonetic: 'yo', language: 'english', timing: 'transition', energy: 'explosive', duration: 0.25, pitchContour: 'rising' },
    { type: 'adlib', text: 'Sharp!', phonetic: 'sharp', language: 'english', timing: 'fill', energy: 'medium', duration: 0.25, pitchContour: 'flat' },
    { type: 'call', text: 'Listen!', phonetic: 'lis-ten', language: 'english', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'flat' },
    { type: 'adlib', text: 'You know!', phonetic: 'you-know', language: 'english', timing: 'fill', energy: 'low', duration: 0.5, pitchContour: 'rising' },
  ],
};

/**
 * Predefined gasp patterns for different song sections
 */
export const GASP_PATTERNS: Record<string, GaspPattern> = {
  intro_buildup: {
    name: 'Intro Buildup',
    description: 'Building anticipation before the drop',
    cultural_context: 'Creates tension like a DJ building the crowd',
    interjections: [
      { type: 'gasp', text: '(inhale)', phonetic: '...', language: 'universal', timing: 'pickup', energy: 'low', duration: 0.5, pitchContour: 'rising' },
      { type: 'exclamation', text: 'Hayi!', phonetic: 'ha-yi', language: 'zulu', timing: 'upbeat', energy: 'medium', duration: 0.25, pitchContour: 'rising' },
      { type: 'gasp', text: '(deeper inhale)', phonetic: '...', language: 'universal', timing: 'pickup', energy: 'medium', duration: 0.75, pitchContour: 'rising' },
    ]
  },
  
  drop_hit: {
    name: 'Drop Hit',
    description: 'Explosive moment when the beat drops',
    cultural_context: 'The sghubu moment - when everyone reacts',
    interjections: [
      { type: 'exclamation', text: 'YEBO!', phonetic: 'YE-BO', language: 'zulu', timing: 'downbeat', energy: 'explosive', duration: 0.75, pitchContour: 'falling' },
      { type: 'adlib', text: 'Shaya!', phonetic: 'sha-ya', language: 'zulu', timing: 'fill', energy: 'explosive', duration: 0.5, pitchContour: 'falling' },
    ]
  },
  
  verse_flow: {
    name: 'Verse Flow',
    description: 'Subtle interjections during verses',
    cultural_context: 'Conversational, like storytelling',
    interjections: [
      { type: 'adlib', text: 'Mm!', phonetic: 'mm', language: 'universal', timing: 'fill', energy: 'low', duration: 0.25, pitchContour: 'flat' },
      { type: 'exclamation', text: 'Sho!', phonetic: 'sho', language: 'zulu', timing: 'upbeat', energy: 'medium', duration: 0.25, pitchContour: 'flat' },
    ]
  },
  
  call_response: {
    name: 'Call and Response',
    description: 'Traditional call and response pattern',
    cultural_context: 'Deeply rooted in African musical tradition',
    interjections: [
      { type: 'call', text: 'Lalela!', phonetic: 'la-le-la', language: 'zulu', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'rising' },
      { type: 'response', text: 'Yebo!', phonetic: 'ye-bo', language: 'zulu', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    ]
  },
  
  breakdown: {
    name: 'Breakdown',
    description: 'Sparse section with emotional gasps',
    cultural_context: 'Moment of reflection before energy rebuilds',
    interjections: [
      { type: 'gasp', text: '(breathe)', phonetic: '...', language: 'universal', timing: 'transition', energy: 'low', duration: 1, pitchContour: 'wave' },
      { type: 'adlib', text: 'Hayi...', phonetic: 'ha-yi', language: 'zulu', timing: 'fill', energy: 'low', duration: 0.5, pitchContour: 'falling' },
    ]
  },
  
  outro_celebration: {
    name: 'Outro Celebration',
    description: 'Celebratory ad-libs as song ends',
    cultural_context: 'Community celebration, ubuntu spirit',
    interjections: [
      { type: 'adlib', text: 'Siyabonga!', phonetic: 'si-ya-bo-nga', language: 'zulu', timing: 'fill', energy: 'high', duration: 1, pitchContour: 'falling' },
      { type: 'exclamation', text: 'Sharp!', phonetic: 'sharp', language: 'english', timing: 'upbeat', energy: 'medium', duration: 0.25, pitchContour: 'flat' },
    ]
  }
};

/**
 * Generate vocal interjections for a specific language and section
 */
export function generateInterjections(
  language: string,
  section: string,
  count: number = 3
): VocalInterjection[] {
  const languageInterjects = VOCAL_INTERJECTIONS[language] || VOCAL_INTERJECTIONS.english;
  const patternInterjects = GASP_PATTERNS[section]?.interjections || [];
  
  const combined = [...languageInterjects, ...patternInterjects];
  const selected: VocalInterjection[] = [];
  
  // Select diverse interjections
  const types = new Set<string>();
  for (let i = 0; i < count && combined.length > 0; i++) {
    const candidates = combined.filter(int => !types.has(int.type) || types.size >= 3);
    const choice = candidates[Math.floor(Math.random() * candidates.length)];
    if (choice) {
      selected.push(choice);
      types.add(choice.type);
    }
  }
  
  return selected;
}

/**
 * Get gasp timing suggestions based on BPM and section
 */
export function getGaspTimings(
  bpm: number,
  section: 'intro' | 'verse' | 'chorus' | 'breakdown' | 'outro',
  bars: number = 4
): Array<{ bar: number; beat: number; timing: VocalInterjection['timing'] }> {
  const timings: Array<{ bar: number; beat: number; timing: VocalInterjection['timing'] }> = [];
  
  switch (section) {
    case 'intro':
      // Build-up gasps before drops
      for (let bar = 0; bar < bars; bar += 2) {
        timings.push({ bar, beat: 4, timing: 'pickup' });
      }
      break;
      
    case 'verse':
      // Sparse interjections
      timings.push({ bar: 0, beat: 1, timing: 'downbeat' });
      timings.push({ bar: 2, beat: 3, timing: 'fill' });
      break;
      
    case 'chorus':
      // More frequent, energetic
      for (let bar = 0; bar < bars; bar++) {
        timings.push({ bar, beat: 1, timing: 'downbeat' });
        if (bar % 2 === 1) {
          timings.push({ bar, beat: 3, timing: 'fill' });
        }
      }
      break;
      
    case 'breakdown':
      // Emotional, sparse
      timings.push({ bar: 0, beat: 1, timing: 'transition' });
      timings.push({ bar: bars - 1, beat: 4, timing: 'pickup' });
      break;
      
    case 'outro':
      // Celebratory
      timings.push({ bar: 0, beat: 1, timing: 'downbeat' });
      timings.push({ bar: 1, beat: 2, timing: 'upbeat' });
      timings.push({ bar: 2, beat: 1, timing: 'fill' });
      break;
  }
  
  return timings;
}

/**
 * Get all available languages for vocal interjections
 */
export function getAvailableLanguages(): string[] {
  return Object.keys(VOCAL_INTERJECTIONS);
}

/**
 * Get interjections for a specific language
 */
export function getLanguageInterjections(language: string): VocalInterjection[] {
  return VOCAL_INTERJECTIONS[language.toLowerCase()] || [];
}

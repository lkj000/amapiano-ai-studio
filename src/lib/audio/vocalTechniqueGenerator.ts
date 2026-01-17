/**
 * Vocal Technique Generator - Comprehensive Amapiano Vocal Production System
 * 
 * Extends the Amapiano Gasp concept to include:
 * - Beat 1 Silence (the signature "gasp" moment)
 * - Regional vocal interjection styles
 * - Call-and-response patterns
 * - Vocal chops and ad-libs
 * - Multi-language support for all 11 SA official languages
 */

import type { VocalInterjection, GaspPattern } from './amapianoGasp';

export interface VocalTechniqueConfig {
  /** Beat 1 silence - the signature Amapiano production technique */
  beat1Silence: Beat1SilenceVocalConfig;
  
  /** Gasp/breath placement */
  breathPlacement: BreathPlacementConfig;
  
  /** Vocal chop style */
  chopStyle: VocalChopConfig;
  
  /** Ad-lib intensity and style */
  adlibConfig: AdlibConfig;
  
  /** Call-and-response settings */
  callResponse: CallResponseConfig;
  
  /** Language mix preferences */
  languageMix: LanguageMixConfig;
  
  /** Regional vocal style */
  regionalStyle: RegionalVocalStyle;
}

export interface Beat1SilenceVocalConfig {
  /** Enable the signature beat 1 silence */
  enabled: boolean;
  
  /** Type of silence effect */
  type: 'complete-silence' | 'breath-only' | 'reverb-tail' | 'filter-sweep' | 'gasp-in';
  
  /** Duration in 16th notes */
  duration: 1 | 2 | 3 | 4;
  
  /** How often to apply (0-1) */
  frequency: number;
  
  /** Pre-silence buildup effect */
  preEffect: 'none' | 'riser' | 'filter-open' | 'vocal-swell';
  
  /** Recovery style after silence */
  recovery: 'explosive' | 'gentle' | 'layered' | 'delayed';
}

export interface BreathPlacementConfig {
  /** Where to place audible breaths */
  positions: ('pre-phrase' | 'post-phrase' | 'mid-phrase' | 'on-beat')[];
  
  /** Breath intensity */
  intensity: 'subtle' | 'natural' | 'pronounced' | 'exaggerated';
  
  /** Breath processing style */
  processing: 'dry' | 'reverbed' | 'pitched' | 'rhythmic';
  
  /** Include gasp sounds */
  includeGasps: boolean;
}

export interface VocalChopConfig {
  /** Chop rhythm pattern */
  pattern: 'none' | 'simple' | 'complex' | 'polyrhythmic';
  
  /** Chop length in 16th notes */
  chopLength: 1 | 2 | 4;
  
  /** Pitch manipulation */
  pitchShift: boolean;
  
  /** Formant preservation */
  preserveFormants: boolean;
  
  /** Stutter effects */
  stutterEnabled: boolean;
  stutterRate: 1 | 2 | 4 | 8;
}

export interface AdlibConfig {
  /** Ad-lib density */
  density: 'minimal' | 'sparse' | 'moderate' | 'frequent' | 'dense';
  
  /** Ad-lib types to include */
  types: ('exclamation' | 'agreement' | 'hype' | 'melodic' | 'spoken')[];
  
  /** Energy level */
  energy: 'chill' | 'medium' | 'high' | 'explosive';
  
  /** Layer with main vocal */
  layering: 'background' | 'equal' | 'foreground';
}

export interface CallResponseConfig {
  /** Enable call-and-response */
  enabled: boolean;
  
  /** Response delay in beats */
  responseDelay: 0.5 | 1 | 2 | 4;
  
  /** Response style */
  responseStyle: 'echo' | 'answer' | 'harmony' | 'counter';
  
  /** Number of response voices */
  voiceCount: 1 | 2 | 3 | 4;
  
  /** Crowd/choir response */
  crowdResponse: boolean;
}

export interface LanguageMixConfig {
  /** Primary language */
  primary: SouthAfricanLanguage;
  
  /** Secondary languages to mix in */
  secondary: SouthAfricanLanguage[];
  
  /** Code-switching frequency */
  switchFrequency: 'rare' | 'occasional' | 'frequent';
  
  /** Phrase-level or word-level mixing */
  mixLevel: 'phrase' | 'word' | 'both';
}

export type SouthAfricanLanguage = 
  | 'zulu'
  | 'xhosa'
  | 'afrikaans'
  | 'english'
  | 'sotho'
  | 'tswana'
  | 'pedi'
  | 'venda'
  | 'tsonga'
  | 'swati'
  | 'ndebele';

export type RegionalVocalStyle = 
  | 'gauteng-deep'
  | 'gauteng-private-school'
  | 'durban-gqom'
  | 'cape-town-jazzy'
  | 'eastern-cape-traditional'
  | 'limpopo-venda'
  | 'free-state-sesotho'
  | 'international-crossover';

/**
 * Extended vocal interjections by language - comprehensive collection
 */
export const EXTENDED_VOCAL_INTERJECTIONS: Record<SouthAfricanLanguage, VocalInterjection[]> = {
  zulu: [
    // Exclamations
    { type: 'exclamation', text: 'Yebo!', phonetic: 'ye-bo', language: 'zulu', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Hayi!', phonetic: 'ha-yi', language: 'zulu', timing: 'upbeat', energy: 'medium', duration: 0.25, pitchContour: 'rising' },
    { type: 'exclamation', text: 'Hhayi bo!', phonetic: 'hai-bo', language: 'zulu', timing: 'transition', energy: 'explosive', duration: 0.75, pitchContour: 'rising' },
    { type: 'exclamation', text: 'Eish!', phonetic: 'eysh', language: 'zulu', timing: 'pickup', energy: 'medium', duration: 0.25, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Sho!', phonetic: 'sho', language: 'zulu', timing: 'upbeat', energy: 'medium', duration: 0.25, pitchContour: 'flat' },
    { type: 'exclamation', text: 'Awu!', phonetic: 'a-wu', language: 'zulu', timing: 'fill', energy: 'high', duration: 0.5, pitchContour: 'wave' },
    { type: 'exclamation', text: 'Manje!', phonetic: 'man-je', language: 'zulu', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Phela!', phonetic: 'pe-la', language: 'zulu', timing: 'fill', energy: 'medium', duration: 0.5, pitchContour: 'rising' },
    // Gasps and breaths
    { type: 'gasp', text: '(inhale)', phonetic: 'hhhh', language: 'zulu', timing: 'pickup', energy: 'low', duration: 0.5, pitchContour: 'rising' },
    { type: 'gasp', text: 'Hawu!', phonetic: 'ha-wu', language: 'zulu', timing: 'transition', energy: 'explosive', duration: 0.5, pitchContour: 'wave' },
    // Ad-libs
    { type: 'adlib', text: 'Shaya!', phonetic: 'sha-ya', language: 'zulu', timing: 'fill', energy: 'explosive', duration: 0.5, pitchContour: 'falling' },
    { type: 'adlib', text: 'Dlala!', phonetic: 'dla-la', language: 'zulu', timing: 'fill', energy: 'high', duration: 0.5, pitchContour: 'rising' },
    { type: 'adlib', text: 'Uyangibona?', phonetic: 'u-ya-ngi-bo-na', language: 'zulu', timing: 'fill', energy: 'medium', duration: 1, pitchContour: 'rising' },
    { type: 'adlib', text: 'Ngiyabonga!', phonetic: 'ngi-ya-bo-nga', language: 'zulu', timing: 'fill', energy: 'medium', duration: 1, pitchContour: 'falling' },
    // Call-response
    { type: 'call', text: 'Lalela!', phonetic: 'la-le-la', language: 'zulu', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'flat' },
    { type: 'response', text: 'Kunjani!', phonetic: 'kun-ja-ni', language: 'zulu', timing: 'downbeat', energy: 'medium', duration: 0.75, pitchContour: 'rising' },
    { type: 'call', text: 'Woza!', phonetic: 'wo-za', language: 'zulu', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'rising' },
    { type: 'response', text: 'Siyeza!', phonetic: 'si-ye-za', language: 'zulu', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'falling' },
  ],
  
  xhosa: [
    { type: 'exclamation', text: 'Ewe!', phonetic: 'e-we', language: 'xhosa', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Hayi!', phonetic: 'ha-yi', language: 'xhosa', timing: 'upbeat', energy: 'medium', duration: 0.25, pitchContour: 'rising' },
    { type: 'gasp', text: 'Yhoo!', phonetic: 'yho-o', language: 'xhosa', timing: 'transition', energy: 'explosive', duration: 0.75, pitchContour: 'wave' },
    { type: 'exclamation', text: 'Ncaa!', phonetic: 'n-caa', language: 'xhosa', timing: 'fill', energy: 'medium', duration: 0.25, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Camagu!', phonetic: 'ca-ma-gu', language: 'xhosa', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'falling' },
    { type: 'adlib', text: 'Molo!', phonetic: 'mo-lo', language: 'xhosa', timing: 'pickup', energy: 'medium', duration: 0.5, pitchContour: 'flat' },
    { type: 'adlib', text: 'Uxolo!', phonetic: 'u-xo-lo', language: 'xhosa', timing: 'fill', energy: 'low', duration: 0.75, pitchContour: 'falling' },
    { type: 'call', text: 'Mamela!', phonetic: 'ma-me-la', language: 'xhosa', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'rising' },
    { type: 'response', text: 'Kunjani!', phonetic: 'kun-ja-ni', language: 'xhosa', timing: 'downbeat', energy: 'medium', duration: 0.75, pitchContour: 'rising' },
    { type: 'gasp', text: 'Qha!', phonetic: 'qa', language: 'xhosa', timing: 'transition', energy: 'high', duration: 0.25, pitchContour: 'falling' },
    { type: 'adlib', text: 'Tyhini!', phonetic: 'tyi-ni', language: 'xhosa', timing: 'fill', energy: 'high', duration: 0.5, pitchContour: 'wave' },
  ],
  
  afrikaans: [
    { type: 'exclamation', text: 'Ja!', phonetic: 'ya', language: 'afrikaans', timing: 'downbeat', energy: 'high', duration: 0.25, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Nee man!', phonetic: 'nee-man', language: 'afrikaans', timing: 'upbeat', energy: 'medium', duration: 0.5, pitchContour: 'falling' },
    { type: 'gasp', text: 'Jirre!', phonetic: 'yi-re', language: 'afrikaans', timing: 'transition', energy: 'explosive', duration: 0.5, pitchContour: 'wave' },
    { type: 'adlib', text: 'Lekker!', phonetic: 'lek-ker', language: 'afrikaans', timing: 'fill', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'call', text: 'Luister!', phonetic: 'lœis-ter', language: 'afrikaans', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'flat' },
    { type: 'exclamation', text: 'Eina!', phonetic: 'ay-na', language: 'afrikaans', timing: 'pickup', energy: 'medium', duration: 0.5, pitchContour: 'falling' },
    { type: 'adlib', text: 'Hectic!', phonetic: 'hek-tik', language: 'afrikaans', timing: 'fill', energy: 'high', duration: 0.5, pitchContour: 'rising' },
    { type: 'exclamation', text: 'Sies!', phonetic: 'sis', language: 'afrikaans', timing: 'upbeat', energy: 'medium', duration: 0.25, pitchContour: 'falling' },
    { type: 'adlib', text: 'Kom aan!', phonetic: 'kom-aan', language: 'afrikaans', timing: 'fill', energy: 'high', duration: 0.75, pitchContour: 'rising' },
    { type: 'gasp', text: 'Ag nee!', phonetic: 'ax-nee', language: 'afrikaans', timing: 'transition', energy: 'medium', duration: 0.5, pitchContour: 'falling' },
  ],
  
  english: [
    { type: 'exclamation', text: 'Yeah!', phonetic: 'yeah', language: 'english', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Yo!', phonetic: 'yo', language: 'english', timing: 'upbeat', energy: 'high', duration: 0.25, pitchContour: 'rising' },
    { type: 'gasp', text: 'Whoa!', phonetic: 'whoa', language: 'english', timing: 'transition', energy: 'explosive', duration: 0.5, pitchContour: 'wave' },
    { type: 'adlib', text: 'Sharp!', phonetic: 'sharp', language: 'english', timing: 'fill', energy: 'medium', duration: 0.25, pitchContour: 'flat' },
    { type: 'call', text: 'Listen!', phonetic: 'lis-ten', language: 'english', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'flat' },
    { type: 'adlib', text: 'You know!', phonetic: 'you-know', language: 'english', timing: 'fill', energy: 'low', duration: 0.5, pitchContour: 'rising' },
    { type: 'exclamation', text: 'Eish!', phonetic: 'eysh', language: 'english', timing: 'upbeat', energy: 'medium', duration: 0.25, pitchContour: 'falling' },
    { type: 'adlib', text: 'Trust me!', phonetic: 'trust-me', language: 'english', timing: 'fill', energy: 'medium', duration: 0.5, pitchContour: 'falling' },
    { type: 'adlib', text: 'For real!', phonetic: 'for-real', language: 'english', timing: 'fill', energy: 'medium', duration: 0.5, pitchContour: 'rising' },
    { type: 'exclamation', text: "Let's go!", phonetic: 'lets-go', language: 'english', timing: 'downbeat', energy: 'explosive', duration: 0.75, pitchContour: 'rising' },
  ],
  
  sotho: [
    { type: 'exclamation', text: 'E!', phonetic: 'e', language: 'sotho', timing: 'downbeat', energy: 'high', duration: 0.25, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Tjhe!', phonetic: 'tje', language: 'sotho', timing: 'upbeat', energy: 'medium', duration: 0.25, pitchContour: 'rising' },
    { type: 'gasp', text: 'Joo!', phonetic: 'jo-o', language: 'sotho', timing: 'transition', energy: 'explosive', duration: 0.5, pitchContour: 'wave' },
    { type: 'call', text: 'Mamela!', phonetic: 'ma-me-la', language: 'sotho', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'flat' },
    { type: 'adlib', text: 'Le nna!', phonetic: 'le-nna', language: 'sotho', timing: 'fill', energy: 'medium', duration: 0.5, pitchContour: 'rising' },
    { type: 'exclamation', text: 'Athe!', phonetic: 'a-the', language: 'sotho', timing: 'upbeat', energy: 'medium', duration: 0.5, pitchContour: 'rising' },
    { type: 'adlib', text: 'Ke hantle!', phonetic: 'ke-han-tle', language: 'sotho', timing: 'fill', energy: 'medium', duration: 0.75, pitchContour: 'falling' },
    { type: 'gasp', text: 'Molimo!', phonetic: 'mo-li-mo', language: 'sotho', timing: 'transition', energy: 'high', duration: 0.75, pitchContour: 'falling' },
  ],
  
  tswana: [
    { type: 'exclamation', text: 'Ee!', phonetic: 'e-e', language: 'tswana', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Aowa!', phonetic: 'a-o-wa', language: 'tswana', timing: 'upbeat', energy: 'medium', duration: 0.5, pitchContour: 'rising' },
    { type: 'gasp', text: 'Jo!', phonetic: 'jo', language: 'tswana', timing: 'transition', energy: 'explosive', duration: 0.25, pitchContour: 'rising' },
    { type: 'call', text: 'Reetsa!', phonetic: 're-e-tsa', language: 'tswana', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'flat' },
    { type: 'adlib', text: 'Sharp sharp!', phonetic: 'sharp-sharp', language: 'tswana', timing: 'fill', energy: 'medium', duration: 0.5, pitchContour: 'flat' },
    { type: 'exclamation', text: 'Ao bathong!', phonetic: 'ao-ba-thong', language: 'tswana', timing: 'transition', energy: 'high', duration: 0.75, pitchContour: 'wave' },
    { type: 'adlib', text: 'Ke nnete!', phonetic: 'ke-nne-te', language: 'tswana', timing: 'fill', energy: 'medium', duration: 0.75, pitchContour: 'falling' },
    { type: 'gasp', text: 'Modimo!', phonetic: 'mo-di-mo', language: 'tswana', timing: 'transition', energy: 'high', duration: 0.75, pitchContour: 'falling' },
  ],
  
  pedi: [
    { type: 'exclamation', text: 'Ee!', phonetic: 'e-e', language: 'pedi', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'gasp', text: 'Joo!', phonetic: 'jo-o', language: 'pedi', timing: 'transition', energy: 'explosive', duration: 0.5, pitchContour: 'wave' },
    { type: 'call', text: 'Theeletša!', phonetic: 'the-e-le-tša', language: 'pedi', timing: 'downbeat', energy: 'high', duration: 1, pitchContour: 'flat' },
    { type: 'adlib', text: 'Ke šoro!', phonetic: 'ke-sho-ro', language: 'pedi', timing: 'fill', energy: 'medium', duration: 0.5, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Aowa!', phonetic: 'a-o-wa', language: 'pedi', timing: 'upbeat', energy: 'medium', duration: 0.5, pitchContour: 'rising' },
    { type: 'adlib', text: 'Ke nnete!', phonetic: 'ke-nne-te', language: 'pedi', timing: 'fill', energy: 'medium', duration: 0.75, pitchContour: 'falling' },
    { type: 'gasp', text: 'Modimo!', phonetic: 'mo-di-mo', language: 'pedi', timing: 'transition', energy: 'high', duration: 0.75, pitchContour: 'falling' },
    { type: 'call', text: 'Etla!', phonetic: 'e-tla', language: 'pedi', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'rising' },
  ],
  
  venda: [
    { type: 'exclamation', text: 'Ee!', phonetic: 'e-e', language: 'venda', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'gasp', text: 'Hai!', phonetic: 'ha-i', language: 'venda', timing: 'transition', energy: 'explosive', duration: 0.25, pitchContour: 'rising' },
    { type: 'call', text: 'Thetshelesani!', phonetic: 'the-tshe-le-sa-ni', language: 'venda', timing: 'downbeat', energy: 'high', duration: 1, pitchContour: 'flat' },
    { type: 'adlib', text: 'Ndi khou!', phonetic: 'ndi-khou', language: 'venda', timing: 'fill', energy: 'medium', duration: 0.5, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Zwavhudi!', phonetic: 'zwa-vhu-di', language: 'venda', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'falling' },
    { type: 'gasp', text: 'Yhooo!', phonetic: 'yho-o-o', language: 'venda', timing: 'transition', energy: 'explosive', duration: 0.75, pitchContour: 'wave' },
    { type: 'adlib', text: 'Ndi mulalo!', phonetic: 'ndi-mu-la-lo', language: 'venda', timing: 'fill', energy: 'medium', duration: 1, pitchContour: 'falling' },
  ],
  
  tsonga: [
    { type: 'exclamation', text: 'Ina!', phonetic: 'i-na', language: 'tsonga', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'gasp', text: 'Xewani!', phonetic: 'xe-wa-ni', language: 'tsonga', timing: 'transition', energy: 'explosive', duration: 0.75, pitchContour: 'wave' },
    { type: 'adlib', text: 'Avuxeni!', phonetic: 'a-vu-xe-ni', language: 'tsonga', timing: 'pickup', energy: 'high', duration: 1, pitchContour: 'rising' },
    { type: 'call', text: 'Yingisani!', phonetic: 'yi-ngi-sa-ni', language: 'tsonga', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'flat' },
    { type: 'exclamation', text: 'Chaaa!', phonetic: 'cha-a', language: 'tsonga', timing: 'fill', energy: 'medium', duration: 0.5, pitchContour: 'falling' },
    { type: 'gasp', text: 'Hoyooo!', phonetic: 'ho-yo-o', language: 'tsonga', timing: 'transition', energy: 'explosive', duration: 0.75, pitchContour: 'rising' },
    { type: 'adlib', text: 'Inkomu!', phonetic: 'in-ko-mu', language: 'tsonga', timing: 'fill', energy: 'medium', duration: 0.75, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Aa!', phonetic: 'a-a', language: 'tsonga', timing: 'upbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
  ],
  
  swati: [
    { type: 'exclamation', text: 'Yebo!', phonetic: 'ye-bo', language: 'swati', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'gasp', text: 'Hawu!', phonetic: 'ha-wu', language: 'swati', timing: 'transition', energy: 'explosive', duration: 0.5, pitchContour: 'wave' },
    { type: 'call', text: 'Lalelani!', phonetic: 'la-le-la-ni', language: 'swati', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'flat' },
    { type: 'adlib', text: 'Siyabonga!', phonetic: 'si-ya-bo-nga', language: 'swati', timing: 'fill', energy: 'medium', duration: 1, pitchContour: 'falling' },
    { type: 'exclamation', text: 'Awu Nkosi!', phonetic: 'a-wu-nko-si', language: 'swati', timing: 'transition', energy: 'high', duration: 0.75, pitchContour: 'wave' },
    { type: 'gasp', text: 'Ehhh!', phonetic: 'e-hhh', language: 'swati', timing: 'pickup', energy: 'medium', duration: 0.5, pitchContour: 'rising' },
    { type: 'adlib', text: 'Sikhona!', phonetic: 'si-kho-na', language: 'swati', timing: 'fill', energy: 'medium', duration: 0.75, pitchContour: 'falling' },
  ],
  
  ndebele: [
    { type: 'exclamation', text: 'Yebo!', phonetic: 'ye-bo', language: 'ndebele', timing: 'downbeat', energy: 'high', duration: 0.5, pitchContour: 'falling' },
    { type: 'gasp', text: 'Hawu!', phonetic: 'ha-wu', language: 'ndebele', timing: 'transition', energy: 'explosive', duration: 0.5, pitchContour: 'wave' },
    { type: 'call', text: 'Lalelani!', phonetic: 'la-le-la-ni', language: 'ndebele', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'flat' },
    { type: 'exclamation', text: 'Hayi bo!', phonetic: 'ha-yi-bo', language: 'ndebele', timing: 'upbeat', energy: 'high', duration: 0.5, pitchContour: 'rising' },
    { type: 'adlib', text: 'Siyathokoza!', phonetic: 'si-ya-tho-ko-za', language: 'ndebele', timing: 'fill', energy: 'medium', duration: 1, pitchContour: 'falling' },
    { type: 'gasp', text: 'Maye!', phonetic: 'ma-ye', language: 'ndebele', timing: 'transition', energy: 'high', duration: 0.5, pitchContour: 'wave' },
    { type: 'call', text: 'Wozani!', phonetic: 'wo-za-ni', language: 'ndebele', timing: 'downbeat', energy: 'high', duration: 0.75, pitchContour: 'rising' },
  ],
};

/**
 * Beat 1 Silence presets for different song sections
 */
export const BEAT_1_SILENCE_PRESETS: Record<string, Beat1SilenceVocalConfig> = {
  'drop-impact': {
    enabled: true,
    type: 'complete-silence',
    duration: 2,
    frequency: 1.0,
    preEffect: 'riser',
    recovery: 'explosive'
  },
  'verse-subtle': {
    enabled: true,
    type: 'breath-only',
    duration: 1,
    frequency: 0.5,
    preEffect: 'none',
    recovery: 'gentle'
  },
  'chorus-power': {
    enabled: true,
    type: 'gasp-in',
    duration: 1,
    frequency: 0.75,
    preEffect: 'vocal-swell',
    recovery: 'layered'
  },
  'breakdown-dramatic': {
    enabled: true,
    type: 'reverb-tail',
    duration: 4,
    frequency: 1.0,
    preEffect: 'filter-open',
    recovery: 'delayed'
  },
  'intro-build': {
    enabled: true,
    type: 'filter-sweep',
    duration: 2,
    frequency: 0.8,
    preEffect: 'riser',
    recovery: 'gentle'
  }
};

/**
 * Regional vocal style configurations
 */
export const REGIONAL_VOCAL_STYLES: Record<RegionalVocalStyle, VocalTechniqueConfig> = {
  'gauteng-deep': {
    beat1Silence: BEAT_1_SILENCE_PRESETS['drop-impact'],
    breathPlacement: {
      positions: ['pre-phrase', 'on-beat'],
      intensity: 'pronounced',
      processing: 'reverbed',
      includeGasps: true
    },
    chopStyle: {
      pattern: 'complex',
      chopLength: 2,
      pitchShift: true,
      preserveFormants: true,
      stutterEnabled: true,
      stutterRate: 4
    },
    adlibConfig: {
      density: 'moderate',
      types: ['exclamation', 'hype', 'agreement'],
      energy: 'high',
      layering: 'background'
    },
    callResponse: {
      enabled: true,
      responseDelay: 1,
      responseStyle: 'answer',
      voiceCount: 2,
      crowdResponse: true
    },
    languageMix: {
      primary: 'zulu',
      secondary: ['english', 'sotho'],
      switchFrequency: 'frequent',
      mixLevel: 'both'
    },
    regionalStyle: 'gauteng-deep'
  },
  
  'gauteng-private-school': {
    beat1Silence: BEAT_1_SILENCE_PRESETS['verse-subtle'],
    breathPlacement: {
      positions: ['pre-phrase'],
      intensity: 'subtle',
      processing: 'dry',
      includeGasps: false
    },
    chopStyle: {
      pattern: 'simple',
      chopLength: 4,
      pitchShift: true,
      preserveFormants: true,
      stutterEnabled: false,
      stutterRate: 1
    },
    adlibConfig: {
      density: 'sparse',
      types: ['melodic', 'agreement'],
      energy: 'medium',
      layering: 'background'
    },
    callResponse: {
      enabled: false,
      responseDelay: 1,
      responseStyle: 'echo',
      voiceCount: 1,
      crowdResponse: false
    },
    languageMix: {
      primary: 'english',
      secondary: ['zulu'],
      switchFrequency: 'rare',
      mixLevel: 'phrase'
    },
    regionalStyle: 'gauteng-private-school'
  },
  
  'durban-gqom': {
    beat1Silence: { ...BEAT_1_SILENCE_PRESETS['drop-impact'], type: 'complete-silence', duration: 1 },
    breathPlacement: {
      positions: ['on-beat'],
      intensity: 'exaggerated',
      processing: 'rhythmic',
      includeGasps: true
    },
    chopStyle: {
      pattern: 'polyrhythmic',
      chopLength: 1,
      pitchShift: true,
      preserveFormants: false,
      stutterEnabled: true,
      stutterRate: 8
    },
    adlibConfig: {
      density: 'dense',
      types: ['exclamation', 'hype', 'spoken'],
      energy: 'explosive',
      layering: 'foreground'
    },
    callResponse: {
      enabled: true,
      responseDelay: 0.5,
      responseStyle: 'counter',
      voiceCount: 3,
      crowdResponse: true
    },
    languageMix: {
      primary: 'zulu',
      secondary: ['english'],
      switchFrequency: 'occasional',
      mixLevel: 'word'
    },
    regionalStyle: 'durban-gqom'
  },
  
  'cape-town-jazzy': {
    beat1Silence: BEAT_1_SILENCE_PRESETS['breakdown-dramatic'],
    breathPlacement: {
      positions: ['pre-phrase', 'mid-phrase'],
      intensity: 'natural',
      processing: 'reverbed',
      includeGasps: false
    },
    chopStyle: {
      pattern: 'none',
      chopLength: 4,
      pitchShift: false,
      preserveFormants: true,
      stutterEnabled: false,
      stutterRate: 1
    },
    adlibConfig: {
      density: 'minimal',
      types: ['melodic'],
      energy: 'chill',
      layering: 'equal'
    },
    callResponse: {
      enabled: true,
      responseDelay: 2,
      responseStyle: 'harmony',
      voiceCount: 4,
      crowdResponse: false
    },
    languageMix: {
      primary: 'afrikaans',
      secondary: ['english', 'xhosa'],
      switchFrequency: 'occasional',
      mixLevel: 'phrase'
    },
    regionalStyle: 'cape-town-jazzy'
  },
  
  'eastern-cape-traditional': {
    beat1Silence: BEAT_1_SILENCE_PRESETS['chorus-power'],
    breathPlacement: {
      positions: ['pre-phrase', 'post-phrase'],
      intensity: 'pronounced',
      processing: 'dry',
      includeGasps: true
    },
    chopStyle: {
      pattern: 'simple',
      chopLength: 2,
      pitchShift: false,
      preserveFormants: true,
      stutterEnabled: false,
      stutterRate: 1
    },
    adlibConfig: {
      density: 'moderate',
      types: ['exclamation', 'agreement', 'hype'],
      energy: 'high',
      layering: 'background'
    },
    callResponse: {
      enabled: true,
      responseDelay: 1,
      responseStyle: 'answer',
      voiceCount: 4,
      crowdResponse: true
    },
    languageMix: {
      primary: 'xhosa',
      secondary: ['english'],
      switchFrequency: 'rare',
      mixLevel: 'phrase'
    },
    regionalStyle: 'eastern-cape-traditional'
  },
  
  'limpopo-venda': {
    beat1Silence: BEAT_1_SILENCE_PRESETS['breakdown-dramatic'],
    breathPlacement: {
      positions: ['pre-phrase', 'on-beat'],
      intensity: 'pronounced',
      processing: 'reverbed',
      includeGasps: true
    },
    chopStyle: {
      pattern: 'complex',
      chopLength: 2,
      pitchShift: true,
      preserveFormants: true,
      stutterEnabled: false,
      stutterRate: 1
    },
    adlibConfig: {
      density: 'moderate',
      types: ['exclamation', 'hype'],
      energy: 'high',
      layering: 'background'
    },
    callResponse: {
      enabled: true,
      responseDelay: 1,
      responseStyle: 'answer',
      voiceCount: 3,
      crowdResponse: true
    },
    languageMix: {
      primary: 'venda',
      secondary: ['pedi', 'english'],
      switchFrequency: 'occasional',
      mixLevel: 'phrase'
    },
    regionalStyle: 'limpopo-venda'
  },
  
  'free-state-sesotho': {
    beat1Silence: BEAT_1_SILENCE_PRESETS['verse-subtle'],
    breathPlacement: {
      positions: ['pre-phrase'],
      intensity: 'natural',
      processing: 'dry',
      includeGasps: false
    },
    chopStyle: {
      pattern: 'simple',
      chopLength: 4,
      pitchShift: false,
      preserveFormants: true,
      stutterEnabled: false,
      stutterRate: 1
    },
    adlibConfig: {
      density: 'sparse',
      types: ['melodic', 'agreement'],
      energy: 'medium',
      layering: 'background'
    },
    callResponse: {
      enabled: true,
      responseDelay: 2,
      responseStyle: 'harmony',
      voiceCount: 2,
      crowdResponse: false
    },
    languageMix: {
      primary: 'sotho',
      secondary: ['english'],
      switchFrequency: 'rare',
      mixLevel: 'phrase'
    },
    regionalStyle: 'free-state-sesotho'
  },
  
  'international-crossover': {
    beat1Silence: BEAT_1_SILENCE_PRESETS['intro-build'],
    breathPlacement: {
      positions: ['pre-phrase'],
      intensity: 'subtle',
      processing: 'pitched',
      includeGasps: false
    },
    chopStyle: {
      pattern: 'complex',
      chopLength: 2,
      pitchShift: true,
      preserveFormants: true,
      stutterEnabled: true,
      stutterRate: 4
    },
    adlibConfig: {
      density: 'moderate',
      types: ['melodic', 'hype'],
      energy: 'high',
      layering: 'equal'
    },
    callResponse: {
      enabled: false,
      responseDelay: 1,
      responseStyle: 'echo',
      voiceCount: 1,
      crowdResponse: false
    },
    languageMix: {
      primary: 'english',
      secondary: ['zulu', 'xhosa'],
      switchFrequency: 'occasional',
      mixLevel: 'word'
    },
    regionalStyle: 'international-crossover'
  }
};

/**
 * Generate a complete vocal technique configuration for a track
 */
export function generateVocalConfig(
  style: RegionalVocalStyle,
  overrides?: Partial<VocalTechniqueConfig>
): VocalTechniqueConfig {
  const base = REGIONAL_VOCAL_STYLES[style];
  return {
    ...base,
    ...overrides,
    beat1Silence: { ...base.beat1Silence, ...overrides?.beat1Silence },
    breathPlacement: { ...base.breathPlacement, ...overrides?.breathPlacement },
    chopStyle: { ...base.chopStyle, ...overrides?.chopStyle },
    adlibConfig: { ...base.adlibConfig, ...overrides?.adlibConfig },
    callResponse: { ...base.callResponse, ...overrides?.callResponse },
    languageMix: { ...base.languageMix, ...overrides?.languageMix }
  };
}

/**
 * Get interjections for a specific language
 */
export function getInterjectionsByLanguage(language: SouthAfricanLanguage): VocalInterjection[] {
  return EXTENDED_VOCAL_INTERJECTIONS[language] || [];
}

/**
 * Get all available languages
 */
export function getAllLanguages(): SouthAfricanLanguage[] {
  return Object.keys(EXTENDED_VOCAL_INTERJECTIONS) as SouthAfricanLanguage[];
}

/**
 * Generate random interjections based on config
 */
export function generateRandomInterjections(
  config: VocalTechniqueConfig,
  count: number = 5
): VocalInterjection[] {
  const primaryInterjects = EXTENDED_VOCAL_INTERJECTIONS[config.languageMix.primary] || [];
  const secondaryInterjects = config.languageMix.secondary.flatMap(
    lang => EXTENDED_VOCAL_INTERJECTIONS[lang] || []
  );
  
  // Weight primary language more heavily
  const pool = [
    ...primaryInterjects,
    ...primaryInterjects, // Double weight
    ...secondaryInterjects
  ];
  
  const selected: VocalInterjection[] = [];
  const usedTexts = new Set<string>();
  
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const item = pool[idx];
    
    if (!usedTexts.has(item.text)) {
      selected.push(item);
      usedTexts.add(item.text);
    }
  }
  
  return selected;
}

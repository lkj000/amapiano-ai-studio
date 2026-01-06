/**
 * Centralized Amapiano Subgenre Profiles
 * Used across the entire application for consistent subgenre handling
 */

export interface SubgenreProfile {
  id: string;
  name: string;
  description: string;
  tempo_range: [number, number];
  core_instruments: string[];
  optional_instruments: string[];
  default_processing: {
    reverb: number;
    warmth: number;
    distortion: number;
    humanization: number;
  };
  characteristics: string[];
  harmonic_style: string;
  region?: string;
}

export const SUBGENRE_PROFILES: Record<string, SubgenreProfile> = {
  private_school: {
    id: 'private_school',
    name: 'Private School Amapiano',
    description: 'Soulful, jazz-influenced with live instrumentation',
    tempo_range: [108, 112],
    core_instruments: ['log_drum', 'rhodes', 'shakers', 'synth_pad', 'sub_bass'],
    optional_instruments: ['saxophone', 'guitar_electric', 'violin', 'trumpet'],
    default_processing: { reverb: 0.35, warmth: 0.6, distortion: 0.1, humanization: 0.7 },
    characteristics: ['soft_drums', 'extended_chords', 'live_instruments'],
    harmonic_style: 'progressive_jazz',
    region: 'johannesburg'
  },
  dust: {
    id: 'dust',
    name: 'Dust Amapiano',
    description: 'Raw, gritty percussion-focused sound from the streets',
    tempo_range: [112, 118],
    core_instruments: ['log_drum', 'kick', 'shakers', 'congas', 'bongos'],
    optional_instruments: ['synth_bass', 'vocal_chops'],
    default_processing: { reverb: 0.2, warmth: 0.4, distortion: 0.3, humanization: 0.4 },
    characteristics: ['raw_drums', 'minimal_melody', 'street_energy'],
    harmonic_style: 'minimal',
    region: 'soweto'
  },
  commercial: {
    id: 'commercial',
    name: 'Commercial Amapiano',
    description: 'Radio-ready, polished production for mainstream appeal',
    tempo_range: [110, 115],
    core_instruments: ['log_drum', 'rhodes', 'synth_pad', 'shakers', 'vocals'],
    optional_instruments: ['saxophone', 'synth_lead', 'guitar_acoustic'],
    default_processing: { reverb: 0.3, warmth: 0.5, distortion: 0.15, humanization: 0.5 },
    characteristics: ['polished_mix', 'catchy_hooks', 'radio_friendly'],
    harmonic_style: 'pop_accessible',
    region: 'johannesburg'
  },
  sgija: {
    id: 'sgija',
    name: 'Sgija',
    description: 'High-energy, bass-heavy township style with aggressive drums',
    tempo_range: [115, 120],
    core_instruments: ['log_drum', 'kick', 'sub_bass', 'shakers', 'claps'],
    optional_instruments: ['synth_bass', 'vocal_chops', 'rimshot'],
    default_processing: { reverb: 0.15, warmth: 0.3, distortion: 0.4, humanization: 0.3 },
    characteristics: ['heavy_bass', 'aggressive_drums', 'township_energy'],
    harmonic_style: 'minimal_dark',
    region: 'pretoria'
  },
  kabza_style: {
    id: 'kabza_style',
    name: 'Kabza Style',
    description: 'Signature Kabza De Small production aesthetic - smooth and groovy',
    tempo_range: [110, 114],
    core_instruments: ['log_drum', 'rhodes', 'shakers', 'synth_pad', 'congas'],
    optional_instruments: ['saxophone', 'guitar_electric', 'vocal_chops'],
    default_processing: { reverb: 0.3, warmth: 0.55, distortion: 0.15, humanization: 0.6 },
    characteristics: ['groovy_bass', 'soulful_keys', 'signature_bounce'],
    harmonic_style: 'jazzy_soulful',
    region: 'johannesburg'
  },
  bacardi: {
    id: 'bacardi',
    name: 'Bacardi',
    description: 'Hybrid style blending Amapiano with Kwaito and House elements',
    tempo_range: [108, 115],
    core_instruments: ['log_drum', 'kick', 'synth_bass', 'vocal_chops', 'shakers'],
    optional_instruments: ['tribal_perc', 'marimba_synth', 'claps'],
    default_processing: { reverb: 0.25, warmth: 0.45, distortion: 0.2, humanization: 0.5 },
    characteristics: ['vocal_chops', 'melodic_bass', 'tribal_elements'],
    harmonic_style: 'hybrid',
    region: 'johannesburg'
  },
  vocal_deep: {
    id: 'vocal_deep',
    name: 'Vocal Deep',
    description: 'Emotive vocal-driven productions with deep basslines',
    tempo_range: [108, 114],
    core_instruments: ['log_drum', 'rhodes', 'synth_pad', 'vocals', 'sub_bass'],
    optional_instruments: ['strings', 'saxophone', 'guitar_acoustic'],
    default_processing: { reverb: 0.4, warmth: 0.6, distortion: 0.1, humanization: 0.7 },
    characteristics: ['emotive_vocals', 'deep_bass', 'atmospheric'],
    harmonic_style: 'soulful_deep',
    region: 'durban'
  },
  piano_hub: {
    id: 'piano_hub',
    name: 'Piano Hub',
    description: 'Piano-centric productions showcasing keyboard virtuosity',
    tempo_range: [110, 116],
    core_instruments: ['rhodes', 'acoustic_piano', 'log_drum', 'shakers', 'sub_bass'],
    optional_instruments: ['synth_pad', 'strings', 'kalimba'],
    default_processing: { reverb: 0.35, warmth: 0.55, distortion: 0.1, humanization: 0.65 },
    characteristics: ['piano_focus', 'jazz_chords', 'melodic_runs'],
    harmonic_style: 'jazz_piano',
    region: 'johannesburg'
  },
  three_step: {
    id: 'three_step',
    name: 'Three Step',
    description: 'Classic 3-kick framework with swung hi-hats and tension building',
    tempo_range: [112, 118],
    core_instruments: ['kick', 'log_drum', 'shakers', 'claps', 'synth_pad'],
    optional_instruments: ['congas', 'bongos', 'synth_lead'],
    default_processing: { reverb: 0.25, warmth: 0.45, distortion: 0.2, humanization: 0.45 },
    characteristics: ['3_kick_framework', 'swung_hats', 'tension_building'],
    harmonic_style: 'afro_house',
    region: 'johannesburg'
  },
  soweto_groove: {
    id: 'soweto_groove',
    name: 'Soweto Groove',
    description: 'Authentic Soweto sound with raw energy and street vibes',
    tempo_range: [112, 118],
    core_instruments: ['log_drum', 'kick', 'congas', 'shakers', 'vocal_chops'],
    optional_instruments: ['djembe', 'bongos', 'claps'],
    default_processing: { reverb: 0.2, warmth: 0.4, distortion: 0.25, humanization: 0.4 },
    characteristics: ['raw_energy', 'township_roots', 'street_vibes'],
    harmonic_style: 'minimal_groove',
    region: 'soweto'
  },
  durban_tech: {
    id: 'durban_tech',
    name: 'Durban Tech',
    description: 'Durban-influenced with Gqom undertones and heavy bass',
    tempo_range: [116, 122],
    core_instruments: ['kick', 'sub_bass', 'shakers', 'claps', 'synth_bass'],
    optional_instruments: ['log_drum', 'vocal_chops', 'synth_lead'],
    default_processing: { reverb: 0.15, warmth: 0.35, distortion: 0.35, humanization: 0.35 },
    characteristics: ['gqom_influence', 'heavy_bass', 'dark_atmosphere'],
    harmonic_style: 'dark_minimal',
    region: 'durban'
  },
  kwaito_fusion: {
    id: 'kwaito_fusion',
    name: 'Kwaito Fusion',
    description: 'Blend of classic Kwaito elements with modern Amapiano production',
    tempo_range: [105, 112],
    core_instruments: ['kick', 'log_drum', 'synth_bass', 'vocals', 'shakers'],
    optional_instruments: ['congas', 'claps', 'synth_pad'],
    default_processing: { reverb: 0.25, warmth: 0.5, distortion: 0.2, humanization: 0.5 },
    characteristics: ['kwaito_roots', 'nostalgic_vibes', 'groovy_bass'],
    harmonic_style: 'kwaito_hybrid',
    region: 'johannesburg'
  },
  international: {
    id: 'international',
    name: 'International Amapiano',
    description: 'Global-friendly sound designed for international audiences',
    tempo_range: [110, 116],
    core_instruments: ['log_drum', 'rhodes', 'synth_pad', 'shakers', 'sub_bass'],
    optional_instruments: ['saxophone', 'strings', 'guitar_acoustic', 'vocals'],
    default_processing: { reverb: 0.35, warmth: 0.5, distortion: 0.12, humanization: 0.55 },
    characteristics: ['accessible_sound', 'global_appeal', 'polished_production'],
    harmonic_style: 'contemporary_jazz',
    region: 'johannesburg'
  },
  afro_tech: {
    id: 'afro_tech',
    name: 'Afro Tech',
    description: 'Tech house-influenced Amapiano with driving rhythms',
    tempo_range: [118, 124],
    core_instruments: ['kick', 'shakers', 'synth_bass', 'synth_pad', 'claps'],
    optional_instruments: ['log_drum', 'synth_lead', 'vocal_chops'],
    default_processing: { reverb: 0.2, warmth: 0.4, distortion: 0.25, humanization: 0.4 },
    characteristics: ['tech_house_influence', 'driving_rhythm', 'club_oriented'],
    harmonic_style: 'tech_minimal',
    region: 'johannesburg'
  },
  experimental: {
    id: 'experimental',
    name: 'Experimental Amapiano',
    description: 'Boundary-pushing productions exploring new sonic territories',
    tempo_range: [100, 125],
    core_instruments: ['log_drum', 'synth_pad', 'synth_lead', 'sub_bass', 'vocal_chops'],
    optional_instruments: ['kalimba', 'marimba_synth', 'strings', 'synth_pluck'],
    default_processing: { reverb: 0.4, warmth: 0.45, distortion: 0.2, humanization: 0.5 },
    characteristics: ['innovative', 'boundary_pushing', 'unique_textures'],
    harmonic_style: 'experimental',
    region: 'johannesburg'
  }
};

// Helper to get subgenre options for dropdowns
export const getSubgenreOptions = () => {
  return Object.entries(SUBGENRE_PROFILES).map(([id, profile]) => ({
    value: id,
    label: profile.name,
    description: profile.description,
    tempoRange: profile.tempo_range
  }));
};

// Get subgenre by ID with fallback
export const getSubgenreById = (id: string): SubgenreProfile | undefined => {
  return SUBGENRE_PROFILES[id];
};

// Get all subgenre IDs
export const getSubgenreIds = (): string[] => {
  return Object.keys(SUBGENRE_PROFILES);
};

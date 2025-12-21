// Authentic South African Amapiano Voice Styles

export interface VoiceOption {
  value: string;
  label: string;
  description: string;
}

export interface VoiceCategory {
  category: string;
  voices: VoiceOption[];
}

// Female Amapiano Vocalists
export const FEMALE_VOICES: VoiceOption[] = [
  { value: 'nkosazana', label: 'Nkosazana Daughter Style', description: 'Angelic, soulful, gospel-infused purity with smooth harmonies' },
  { value: 'boohle', label: 'Boohle Style', description: 'Angelic, assured voice with deep gospel roots' },
  { value: 'sha-sha', label: 'Sha Sha Style', description: 'Queen of Amapiano - soulful, emotive singing' },
  { value: 'mawhoo', label: 'Mawhoo Style', description: 'Powerful, versatile with strong storytelling' },
  { value: 'thatohatsi', label: 'Thatohatsi Style', description: 'Transcendent artistry with unique vision and powerful delivery' },
  { value: 'tracey', label: 'Tracey Style', description: 'Distinctive voice with nuanced, relatable lyricism' },
  { value: 'pabi-cooper', label: 'Pabi Cooper Style', description: 'Youthful, commanding with warm delivery' },
  { value: 'lady-du', label: 'Lady Du Style', description: 'Energetic, powerful presence' },
  { value: 'tyla', label: 'Tyla Style', description: 'Global star - smooth R&B-infused Amapiano' },
  { value: 'kamo-mphela', label: 'Kamo Mphela Style', description: 'Energetic dance-focused with Afrobeat rhythms' },
  { value: 'babalwa-m', label: 'Babalwa M Style', description: 'Ethereal, jazzy tones with intricate layering' },
  { value: 'nia-pearl', label: 'Nia Pearl Style', description: 'Smooth, soulful with mature melodic touch' },
];

// Male Amapiano Vocalists & Artists
export const MALE_VOICES: VoiceOption[] = [
  { value: 'kabza', label: 'Kabza De Small Style', description: 'King of Amapiano - deep house roots, genre-defining' },
  { value: 'maphorisa', label: 'DJ Maphorisa Style', description: 'Pioneer blending Kwaito, House, and Bacardi' },
  { value: 'focalistic', label: 'Focalistic Style', description: 'Pitori Maradona - slick flows, motivational lyrics' },
  { value: 'aymos', label: 'Aymos Style', description: 'Soulful vocals with melodic storytelling' },
  { value: 'young-stunna', label: 'Young Stunna Style', description: 'Melodic, emotive with lyrical storytelling' },
  { value: 'murumba-pitch', label: 'Murumba Pitch Style', description: 'Melodic flows, soulful with poignant lyrics' },
  { value: 'kelvin-momo', label: 'Kelvin Momo Style', description: 'Soulful, deep, and emotional Amapiano' },
  { value: 'sir-trill', label: 'Sir Trill Style', description: 'Distinctive featured vocalist delivery' },
  { value: 'blxckie', label: 'Blxckie Style', description: 'Slick melodic bars with effortless flow' },
  { value: 'busta-929', label: 'Busta 929 Style', description: 'Energetic and captivating signature sound' },
];

// Duet combinations
export const DUET_VOICES: VoiceOption[] = [
  { value: 'duet-soulful', label: 'Soulful Duet', description: 'Nkosazana x Aymos style - angelic harmonies' },
  { value: 'duet-energetic', label: 'Energetic Duet', description: 'Lady Du x Focalistic style - powerful energy' },
  { value: 'duet-romantic', label: 'Romantic Duet', description: 'Sha Sha x Young Stunna style - emotive connection' },
  { value: 'duet-gospel', label: 'Gospel Duet', description: 'Boohle x Murumba Pitch style - spiritual depth' },
  { value: 'duet-dance', label: 'Dance Duet', description: 'Kamo Mphela x Kabza style - infectious rhythms' },
  { value: 'duet-transcendent', label: 'Transcendent Duet', description: 'Thatohatsi x Kelvin Momo style - deep emotional artistry' },
  { value: 'duet-storytelling', label: 'Storytelling Duet', description: 'Tracey x Murumba Pitch style - nuanced narratives' },
];

// All voice categories for select components
export const AMAPIANO_VOICE_CATEGORIES: VoiceCategory[] = [
  { category: 'Female Vocalists', voices: FEMALE_VOICES },
  { category: 'Male Vocalists', voices: MALE_VOICES },
  { category: 'Duet Styles', voices: DUET_VOICES },
];

// Flat list of all voices for simple selects
export const ALL_AMAPIANO_VOICES: VoiceOption[] = [
  ...FEMALE_VOICES,
  ...MALE_VOICES,
  ...DUET_VOICES,
];

// South African genres for consistency
export const SA_GENRES = [
  'Amapiano', 'Amapiano (Soweto)', 'Amapiano (Pretoria/Pitori)', 'Amapiano (Durban)', 
  'Afrobeats', 'Afro-House', 'Bacardi', 'Kwaito', 'Deep House SA', 'Gospel House', 
  'R&B', 'Soul', 'Jazz'
];

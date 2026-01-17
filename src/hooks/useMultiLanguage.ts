import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type SupportedLanguage = 'en' | 'zu' | 'xh' | 'st' | 'tn' | 'nso' | 'ts' | 've' | 'ss' | 'nr' | 'af';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  voiceId?: string;
  culturalContext: string;
  province?: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇿🇦', voiceId: 'TX3LPaxmHKxFdv7VOQHJ', culturalContext: 'South African English with local expressions', province: 'Nationwide' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦', voiceId: 'SAz9YHcvj6GT2YYXdXww', culturalContext: 'Traditional Zulu musical expressions and ubuntu philosophy', province: 'KwaZulu-Natal' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', flag: '🇿🇦', voiceId: 'EXAVITQu4vr4xnSDxMaL', culturalContext: 'Xhosa click consonants and storytelling traditions', province: 'Eastern Cape' },
  { code: 'st', name: 'Sotho', nativeName: 'Sesotho', flag: '🇿🇦', voiceId: 'XB0fDUnXU5powFXDhCwa', culturalContext: 'Sotho musical heritage and famo influences', province: 'Free State' },
  { code: 'tn', name: 'Tswana', nativeName: 'Setswana', flag: '🇿🇦', culturalContext: 'Tswana rhythmic traditions and community gatherings', province: 'North West' },
  { code: 'nso', name: 'Pedi', nativeName: 'Sepedi', flag: '🇿🇦', culturalContext: 'Northern Sotho musical heritage, bolobedu influence', province: 'Limpopo' },
  { code: 'ts', name: 'Tsonga', nativeName: 'Xitsonga', flag: '🇿🇦', culturalContext: 'Tsonga rhythmic patterns and traditional dance', province: 'Limpopo/Mpumalanga' },
  { code: 've', name: 'Venda', nativeName: 'Tshivenda', flag: '🇿🇦', culturalContext: 'Venda drum traditions and ancestral connections', province: 'Limpopo' },
  { code: 'ss', name: 'Swati', nativeName: 'siSwati', flag: '🇿🇦', culturalContext: 'Swati royal ceremonies and umhlanga traditions', province: 'Mpumalanga' },
  { code: 'nr', name: 'Ndebele', nativeName: 'isiNdebele', flag: '🇿🇦', culturalContext: 'Ndebele artistic expression and cultural pride', province: 'Mpumalanga' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦', culturalContext: 'Cape jazz fusion and goema rhythms', province: 'Western Cape' }
];

interface TranslationKey {
  [key: string]: Partial<Record<SupportedLanguage, string>>;
}

export const TRANSLATIONS: TranslationKey = {
  // Navigation
  'nav.daw': {
    en: 'Studio',
    zu: 'Isitudiyo',
    xh: 'Isitudiyo',
    st: 'Studio'
  },
  'nav.generate': {
    en: 'Generate',
    zu: 'Khiqiza',
    xh: 'Velisa',
    st: 'Hlahisa'
  },
  'nav.social': {
    en: 'Social',
    zu: 'Abantu',
    xh: 'Intlalo',
    st: 'Sechaba'
  },
  'nav.samples': {
    en: 'Samples',
    zu: 'Amasampula',
    xh: 'Iisampula',
    st: 'Mehlala'
  },

  // Voice to Music Engine
  'voice.title': {
    en: 'Voice to Music Engine',
    zu: 'Injini Yezwi Kuya Kumculo',
    xh: 'Injini Yelizwi Kuya Kumculo',
    st: 'Enjene ya Lentswe ho ya Mmino'
  },
  'voice.prompt.placeholder': {
    en: 'Describe your amapiano track...',
    zu: 'Chaza umculo wakho we-amapiano...',
    xh: 'Chaza umculo wakho we-amapiano...',
    st: 'Hlalosa mmino wa hau wa amapiano...'
  },
  'voice.or.speak': {
    en: 'Or speak your idea',
    zu: 'Noma khuluma ngombono wakho',
    xh: 'Okanye thetha ingcamango yakho',
    st: 'Kapa bua mohopolo wa hau'
  },
  'voice.generate': {
    en: 'Generate Track',
    zu: 'Khiqiza Umculo',
    xh: 'Velisa Umculo',
    st: 'Hlahisa Mmino'
  },

  // Music Generation
  'music.style.deep': {
    en: 'Deep Amapiano',
    zu: 'I-Amapiano Ejulile',
    xh: 'I-Amapiano Enzulu',
    st: 'Amapiano e Tebileng'
  },
  'music.style.vocal': {
    en: 'Vocal Amapiano',
    zu: 'I-Amapiano Yamazwi',
    xh: 'I-Amapiano Yelizwi',
    st: 'Amapiano ya Mantswe'
  },
  'music.style.private': {
    en: 'Private School',
    zu: 'Isikole Esiyimfihlo',
    xh: 'Isikolo Sabucala',
    st: 'Sekolo sa Poraefete'
  },

  // Cultural Expressions
  'culture.vibe.morning': {
    en: 'Morning Energy',
    zu: 'Amandla Ekuseni',
    xh: 'Amandla Asekuseni',
    st: 'Matla a Hoseng'
  },
  'culture.vibe.township': {
    en: 'Township Vibes',
    zu: 'Imizwa Yaselokishini',
    xh: 'Imvakalelo Yaselokishini',
    st: 'Maikutlo a Motse'
  },
  'culture.vibe.celebration': {
    en: 'Celebration',
    zu: 'Ukubhiyoza',
    xh: 'Ukubhiyozela',
    st: 'Keteko'
  },

  // Social Feed
  'social.like': {
    en: 'Like',
    zu: 'Ngiyakuthanda',
    xh: 'Ndiyakuthanda',
    st: 'Ke a e rata'
  },
  'social.comment': {
    en: 'Comment',
    zu: 'Phawula',
    xh: 'Phawula',
    st: 'Hlokomela'
  },
  'social.share': {
    en: 'Share',
    zu: 'Yabelana',
    xh: 'Yabelana',
    st: 'Arolelana'
  },
  'social.remix': {
    en: 'Remix',
    zu: 'Phinda Uhlanganise',
    xh: 'Phinda Udibanise',
    st: 'Kopanya hape'
  }
};

export const useMultiLanguage = () => {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  // Load saved language preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as SupportedLanguage;
    if (savedLanguage && SUPPORTED_LANGUAGES.find(lang => lang.code === savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = useCallback((language: SupportedLanguage) => {
    setCurrentLanguage(language);
    localStorage.setItem('preferred-language', language);
    
    const languageConfig = SUPPORTED_LANGUAGES.find(lang => lang.code === language);
    if (languageConfig) {
      toast({
        title: `Language changed to ${languageConfig.name}`,
        description: `Now using ${languageConfig.nativeName}`,
      });
    }
  }, [toast]);

  const translate = useCallback((key: string, fallback?: string): string => {
    const translation = TRANSLATIONS[key];
    if (translation) {
      // Try current language, then fall back to English, then Zulu
      return translation[currentLanguage] || translation['en'] || translation['zu'] || fallback || key;
    }
    return fallback || key;
  }, [currentLanguage]);

  const translatePrompt = useCallback(async (
    text: string, 
    targetLanguage: SupportedLanguage = 'en'
  ): Promise<string> => {
    if (currentLanguage === targetLanguage) {
      return text;
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('multi-language-processor', {
        body: {
          text,
          sourceLanguage: currentLanguage,
          targetLanguage,
          context: 'amapiano_music_prompt',
          culturalAdaptation: true
        }
      });

      if (error) throw error;

      return data.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage]);

  const getCulturalContext = useCallback((language: SupportedLanguage): string => {
    const config = SUPPORTED_LANGUAGES.find(lang => lang.code === language);
    return config?.culturalContext || '';
  }, []);

  const getVoiceId = useCallback((language: SupportedLanguage): string | undefined => {
    const config = SUPPORTED_LANGUAGES.find(lang => lang.code === language);
    return config?.voiceId;
  }, []);

  const enhancePromptWithCulture = useCallback((prompt: string, language: SupportedLanguage): string => {
    const culturalContext = getCulturalContext(language);
    const languageConfig = SUPPORTED_LANGUAGES.find(lang => lang.code === language);
    
    if (!languageConfig) return prompt;

    let enhancedPrompt = prompt;

    // Add cultural context based on language
    switch (language) {
      case 'zu':
        enhancedPrompt += ` Incorporate traditional Zulu musical elements, ubuntu philosophy, and authentic isiZulu expressions. Consider traditional instruments like isigubu drums and cultural celebrations.`;
        break;
      case 'xh':
        enhancedPrompt += ` Include Xhosa cultural elements, storytelling traditions, and authentic isiXhosa musical heritage. Consider traditional call-and-response patterns and cultural narratives.`;
        break;
      case 'st':
        enhancedPrompt += ` Incorporate Sotho musical traditions, community gatherings, and authentic Sesotho cultural expressions. Consider traditional harmonies and cultural celebrations.`;
        break;
      case 'en':
        enhancedPrompt += ` Use South African English expressions and local cultural references. Include kasi culture, township vibes, and contemporary South African urban experience.`;
        break;
    }

    return enhancedPrompt;
  }, [getCulturalContext]);

  return {
    currentLanguage,
    changeLanguage,
    translate,
    translatePrompt,
    isTranslating,
    getCulturalContext,
    getVoiceId,
    enhancePromptWithCulture,
    supportedLanguages: SUPPORTED_LANGUAGES
  };
};
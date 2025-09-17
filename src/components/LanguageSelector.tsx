import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Volume2 } from 'lucide-react';
import { useMultiLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '@/hooks/useMultiLanguage';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'buttons' | 'minimal';
  showFlags?: boolean;
  showNativeNames?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  showFlags = true,
  showNativeNames = true,
  className = ''
}) => {
  const { currentLanguage, changeLanguage, supportedLanguages } = useMultiLanguage();

  const currentLangConfig = supportedLanguages.find(lang => lang.code === currentLanguage);

  if (variant === 'minimal') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const currentIndex = supportedLanguages.findIndex(lang => lang.code === currentLanguage);
          const nextIndex = (currentIndex + 1) % supportedLanguages.length;
          changeLanguage(supportedLanguages[nextIndex].code);
        }}
        className={`flex items-center gap-2 ${className}`}
      >
        <Globe className="w-4 h-4" />
        {showFlags && <span>{currentLangConfig?.flag}</span>}
        <span className="text-sm">
          {showNativeNames ? currentLangConfig?.nativeName : currentLangConfig?.name}
        </span>
      </Button>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex gap-2 flex-wrap ${className}`}>
        {supportedLanguages.map((language) => (
          <Button
            key={language.code}
            variant={currentLanguage === language.code ? "default" : "outline"}
            size="sm"
            onClick={() => changeLanguage(language.code)}
            className="flex items-center gap-2"
          >
            {showFlags && <span>{language.flag}</span>}
            <span>{showNativeNames ? language.nativeName : language.name}</span>
            {language.voiceId && (
              <Volume2 className="w-3 h-3 opacity-70" />
            )}
          </Button>
        ))}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="w-4 h-4 text-muted-foreground" />
      <Select
        value={currentLanguage}
        onValueChange={(value: SupportedLanguage) => changeLanguage(value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              {showFlags && <span>{currentLangConfig?.flag}</span>}
              <span>
                {showNativeNames ? currentLangConfig?.nativeName : currentLangConfig?.name}
              </span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {showFlags && <span>{language.flag}</span>}
                  <div className="flex flex-col">
                    <span className="font-medium">{language.nativeName}</span>
                    <span className="text-xs text-muted-foreground">{language.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {language.voiceId && (
                    <Badge variant="secondary" className="text-xs">
                      <Volume2 className="w-3 h-3 mr-1" />
                      Voice
                    </Badge>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
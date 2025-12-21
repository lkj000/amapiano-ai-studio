// South African Languages for vocal/lyrics generation
export const SA_LANGUAGES = [
  { value: 'zulu', label: 'isiZulu', description: 'Most spoken SA language' },
  { value: 'xhosa', label: 'isiXhosa', description: 'Click consonants, Eastern Cape' },
  { value: 'sotho', label: 'Sesotho', description: 'Free State & Lesotho' },
  { value: 'tswana', label: 'Setswana', description: 'North West & Botswana' },
  { value: 'pedi', label: 'Sepedi', description: 'Northern Sotho, Limpopo' },
  { value: 'venda', label: 'Tshivenda', description: 'Limpopo region' },
  { value: 'tsonga', label: 'Xitsonga', description: 'Limpopo & Mpumalanga' },
  { value: 'swati', label: 'siSwati', description: 'Mpumalanga & Eswatini' },
  { value: 'ndebele', label: 'isiNdebele', description: 'Mpumalanga' },
  { value: 'afrikaans', label: 'Afrikaans', description: 'Western Cape & nationwide' },
  { value: 'english', label: 'English', description: 'Lingua franca' },
  { value: 'mixed', label: 'Mixed/Multilingual', description: 'Code-switching style' },
] as const;

export type SALanguage = typeof SA_LANGUAGES[number]['value'];

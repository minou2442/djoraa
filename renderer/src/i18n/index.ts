import fr from './fr.json';
import ar from './ar.json';

type Lang = 'fr' | 'ar';

const messages: Record<Lang, any> = { fr, ar };

export function t(key: string, lang: Lang = 'fr'): string {
  const parts = key.split('.');
  let obj = messages[lang];
  for (const p of parts) {
    obj = obj?.[p];
    if (obj === undefined) return key;
  }
  return obj as string;
}

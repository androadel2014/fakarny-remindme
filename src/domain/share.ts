import type { Language, ShoppingList } from './shopping';
import { getListDisplayName } from './templates.ts';
import { t } from '../i18n/strings.ts';

export const GOOGLE_PLAY_DOWNLOAD_URL = 'https://play.google.com/store/apps/details?id=com.andrewmetry.fakarny';

export function buildSharedListMessage(list: ShoppingList, language: Language): { title: string; message: string } {
  const title = getListDisplayName(list, language);
  const items = list.items.map(item => `${item.checked ? '✓' : '•'} ${item.name}`);
  const footer = `${t(language, 'shareFooter')}\n${t(language, 'shareDownload')}: ${GOOGLE_PLAY_DOWNLOAD_URL}`;
  const message = [
    t(language, 'shareTitle'),
    title,
    ...(items.length ? items : [t(language, 'shareEmpty')]),
    '',
    '────────',
    footer,
  ].join('\n');
  return { title, message };
}

import type { Language, ShoppingItem } from './shopping';

export type TemplateKind = 'weekly' | 'monthly' | 'travel' | 'household';

const TEMPLATE_CONTENT: Record<Language, Record<TemplateKind, { name: string; items: string[] }>> = {
  ar: {
    weekly: { name: 'متجر مشتريات الأسبوع', items: ['بيض', 'لبن', 'عيش', 'فاكهة', 'خضار', 'أرز', 'زيت'] },
    monthly: { name: 'مشتريات الشهر', items: ['أرز', 'زيت', 'سكر', 'شاي', 'قهوة', 'مكرونة', 'مسحوق غسيل', 'مناديل ورقية'] },
    travel: { name: 'متجر مستلزمات السفر', items: ['فرشاة أسنان', 'معجون أسنان', 'شاحن', 'جواز السفر', 'ملابس إضافية', 'أدوية أساسية'] },
    household: { name: 'متجر مستلزمات المنزل', items: ['منظف متعدد الاستخدامات', 'سائل غسيل الأطباق', 'مناديل ورقية', 'أكياس قمامة', 'إسفنج تنظيف', 'مسحوق غسيل'] },
  },
  en: {
    weekly: { name: 'Weekly shopping store', items: ['Eggs', 'Milk', 'Bread', 'Fruit', 'Vegetables', 'Rice', 'Cooking oil'] },
    monthly: { name: 'Monthly shopping', items: ['Rice', 'Cooking oil', 'Sugar', 'Tea', 'Coffee', 'Pasta', 'Laundry detergent', 'Tissues'] },
    travel: { name: 'Travel supplies store', items: ['Toothbrush', 'Toothpaste', 'Phone charger', 'Passport', 'Extra clothes', 'Basic medication'] },
    household: { name: 'Home supplies store', items: ['All-purpose cleaner', 'Dish soap', 'Paper towels', 'Trash bags', 'Cleaning sponges', 'Laundry detergent'] },
  },
};

export function getTemplate(kind: TemplateKind, lang: Language): { name: string; localizedNames: Record<Language, string>; items: ShoppingItem[] } {
  const template = TEMPLATE_CONTENT[lang][kind];
  const now = new Date().toISOString();
  return {
    name: template.name,
    localizedNames: { ar: TEMPLATE_CONTENT.ar[kind].name, en: TEMPLATE_CONTENT.en[kind].name },
    items: template.items.map((name, index) => ({
      id: `template-${kind}-${index + 1}-${Date.now().toString(36)}`,
      name,
      checked: false,
      createdAt: now,
      updatedAt: now,
    })),
  };
}

/** Resolve built-in template names in the active UI language, including pre-v1.3 saved lists. */
export function getListDisplayName(list: { name: string; localizedNames?: Partial<Record<Language, string>> }, lang: Language): string {
  const savedTranslation = list.localizedNames?.[lang]?.trim();
  if (savedTranslation) return savedTranslation;
  for (const kind of ['weekly', 'monthly', 'travel', 'household'] as TemplateKind[]) {
    const ar = TEMPLATE_CONTENT.ar[kind].name;
    const en = TEMPLATE_CONTENT.en[kind].name;
    if (list.name === ar || list.name === en) return lang === 'ar' ? ar : en;
  }
  if (list.name === 'متجر البيت' || list.name === 'Home store') return lang === 'ar' ? 'متجر البيت' : 'Home store';
  return list.name;
}

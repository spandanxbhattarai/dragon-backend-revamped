export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const generateUniqueSlug = (base: string, existingSlugs: string[]): string => {
  const baseSlug = slugify(base);
  if (!existingSlugs.includes(baseSlug)) return baseSlug;
  let counter = 1;
  while (existingSlugs.includes(`${baseSlug}-${counter}`)) counter++;
  return `${baseSlug}-${counter}`;
};

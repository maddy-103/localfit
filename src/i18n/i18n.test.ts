import { describe, expect, it, vi } from 'vitest';
import { createTranslator } from './index';
import { en } from './en';
import { hi } from './hi';

describe('i18n', () => {
  it('has identical English and Hindi keys', () => {
    expect(Object.keys(hi).sort()).toEqual(Object.keys(en).sort());
  });

  it('translates existing Hindi keys', () => {
    const t = createTranslator(hi, 'hi');
    expect(t('nav.home')).toBe(hi['nav.home']);
    expect(t('nav.home')).not.toBe(en['nav.home']);
  });

  it('falls back to English and warns in development when a Hindi key is missing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const t = createTranslator({}, 'hi');

    expect(t('nav.home')).toBe(en['nav.home']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('nav.home'));
  });

  it('interpolates variables in both languages', () => {
    const t = createTranslator(hi, 'hi');
    expect(createTranslator(en, 'en')('offline.updated', { time: '6:42 pm' })).toBe(
      en['offline.updated'].replace('{time}', '6:42 pm'),
    );
    expect(t('offline.updated', { time: 'शाम 6:42' })).toContain('शाम 6:42');
  });

  it('leaves unknown variables untouched', () => {
    const t = createTranslator(en, 'en');
    expect(t('offline.updated', {})).toContain('{time}');
  });
});

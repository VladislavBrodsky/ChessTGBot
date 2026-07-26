/**
 * Helper for `jest.mock('next-intl')` translator mocks.
 *
 * next-intl's `useTranslations()` returns a callable translator that ALSO
 * carries `.has()`, `.rich()`, `.markup()` and `.raw()`. Mocks that return a
 * bare arrow function drop those, so any component using them dies with
 * "TypeError: t.has is not a function" — and the pages lean on
 * `t.has(key) ? t(key) : 'English fallback'` heavily (home, profile,
 * settings, challenges, AcademyProgressCard, …).
 *
 * Wrap mocked translators with this so they keep the real shape.
 *
 * Because jest.mock factories are hoisted above imports, require it lazily
 * inside the factory:
 *
 *   jest.mock('next-intl', () => {
 *     const { asTranslator } = require('./testUtils/nextIntlMock');
 *     return { useTranslations: () => asTranslator((key: string) => key) };
 *   });
 */

type TranslateFn = (key: string, values?: Record<string, unknown>) => string;

export type MockTranslator = TranslateFn & {
    has: (key: string) => boolean;
    rich: (key: string, values?: Record<string, unknown>) => string;
    markup: (key: string, values?: Record<string, unknown>) => string;
    raw: (key: string) => unknown;
};

/**
 * @param translate the mock's own key -> string logic.
 * @param has which keys the mock should report as present. Defaults to "all
 *   keys exist", which preserves the behaviour of identity mocks that return
 *   the key itself. Pass an explicit predicate when the mock has a fixed
 *   dictionary, so `t.has` agrees with what `translate` can actually resolve.
 */
export function asTranslator(
    translate: TranslateFn,
    has: (key: string) => boolean = () => true
): MockTranslator {
    const t = ((key: string, values?: Record<string, unknown>) =>
        translate(key, values)) as MockTranslator;

    t.has = has;
    t.rich = (key, values) => translate(key, values);
    t.markup = (key, values) => translate(key, values);
    t.raw = (key) => translate(key);

    return t;
}

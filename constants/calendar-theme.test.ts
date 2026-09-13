import { describe, expect, test } from '@jest/globals';

import { CALENDAR_DARK_BACKGROUND } from './calendar-theme';

describe('iOS calendar background', () => {
  test('resolves to full black', () => {
    expect(CALENDAR_DARK_BACKGROUND).toBe('#000000');
  });
});

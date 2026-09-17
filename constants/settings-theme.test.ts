import { describe, expect, test } from '@jest/globals';

import { SETTINGS_DARK_BACKGROUND } from './settings-theme';

describe('iOS settings background', () => {
  test('resolves to full black', () => {
    expect(SETTINGS_DARK_BACKGROUND).toBe('#000000');
  });
});

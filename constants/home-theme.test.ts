import { describe, expect, test } from '@jest/globals';

import { HOME_DARK_BACKGROUND } from './home-theme';

describe('iOS home background', () => {
  test('resolves to full black', () => {
    expect(HOME_DARK_BACKGROUND).toBe('#000000');
  });
});

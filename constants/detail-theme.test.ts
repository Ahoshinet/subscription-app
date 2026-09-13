import { describe, expect, test } from '@jest/globals';

import { DETAIL_DARK_BACKGROUND } from './detail-theme';

describe('iOS detail background', () => {
  test('resolves to full black', () => {
    expect(DETAIL_DARK_BACKGROUND).toBe('#000000');
  });
});

import { describe, expect, test } from '@jest/globals';

import { ADD_DARK_HEADER_BACKGROUND } from './add-theme';

describe('iOS add sheet header', () => {
  test('resolves to the full-black content background', () => {
    expect(ADD_DARK_HEADER_BACKGROUND).toBe('#000000');
  });
});

import { describe, expect, test } from '@jest/globals';

import {
  ADD_DARK_BACKGROUND,
  ADD_DARK_CARD_BACKGROUND,
  ADD_DARK_HEADER_BACKGROUND,
  ADD_DARK_SEPARATOR,
} from './add-theme';

describe('iOS add sheet palette', () => {
  test('resolves to the layered Reminders-style dark surfaces', () => {
    expect(ADD_DARK_BACKGROUND).toBe('#1C1C1E');
    expect(ADD_DARK_HEADER_BACKGROUND).toBe('#1C1C1E');
    expect(ADD_DARK_CARD_BACKGROUND).toBe('#2C2C2E');
    expect(ADD_DARK_SEPARATOR).toBe('#3A3A3C');
  });
});

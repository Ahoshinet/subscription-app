import { describe, expect, test } from '@jest/globals';

import packageConfig from '../package.json';
import { THIRD_PARTY_LICENSES, THIRD_PARTY_LICENSES_URL } from './licenses';

describe('third-party licenses', () => {
  test('assets/licenses.json matches package.json dependencies (run `pnpm licenses:generate`)', () => {
    const listed = THIRD_PARTY_LICENSES.map((lib) => lib.name).sort();
    const declared = Object.keys(packageConfig.dependencies).sort();
    expect(listed).toEqual(declared);
  });

  test('every entry carries a license identifier', () => {
    for (const lib of THIRD_PARTY_LICENSES) {
      expect(lib.license).not.toBe('UNKNOWN');
      expect(lib.version).toMatch(/^\d+\.\d+\.\d+/);
    }
  });

  test('full license texts are linked from the app repository', () => {
    expect(THIRD_PARTY_LICENSES_URL).toMatch(
      /^https:\/\/github\.com\/Ahoshinet\/subscription-app\/blob\/main\/THIRD_PARTY_LICENSES\.md$/,
    );
  });
});

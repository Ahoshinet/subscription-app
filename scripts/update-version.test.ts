import { describe, expect, jest, test } from '@jest/globals';

type AppConfig = {
    expo: {
        version: string;
        android: { versionCode?: number };
        ios: { buildNumber?: string };
    };
};

type PackageConfig = { version: string };

type CalculateNextRelease = (
    appConfig: AppConfig,
    packageConfig: PackageConfig,
    increment?: 'build' | 'major' | 'minor' | 'patch',
) => {
    appJson: AppConfig;
    buildNumber: string;
    packageJson: PackageConfig;
    version: string;
    versionCode: number;
};

const { calculateNextRelease } = jest.requireActual(
    '../update-version.js',
) as { calculateNextRelease: CalculateNextRelease };

const appConfig = (): AppConfig => ({
    expo: {
        version: '1.0.0',
        android: { versionCode: 2 },
        ios: { buildNumber: '2' },
    },
});

describe('calculateNextRelease', () => {
    test('increments only native build identifiers for a promoted RC', () => {
        const result = calculateNextRelease(
            appConfig(),
            { version: '1.0.0' },
            'build',
        );

        expect(result).toEqual(expect.objectContaining({
            version: '1.0.0',
            versionCode: 3,
            buildNumber: '3',
        }));
        expect(result.appJson.expo).toEqual(expect.objectContaining({
            version: '1.0.0',
            android: { versionCode: 3 },
            ios: { buildNumber: '3' },
        }));
        expect(result.packageJson.version).toBe('1.0.0');
    });

    test.each([
        { increment: 'patch' as const, expectedVersion: '1.0.1' },
        { increment: 'minor' as const, expectedVersion: '1.1.0' },
        { increment: 'major' as const, expectedVersion: '2.0.0' },
    ])('increments $increment and native build identifiers', ({
        increment,
        expectedVersion,
    }) => {
        const result = calculateNextRelease(
            appConfig(),
            { version: '1.0.0' },
            increment,
        );

        expect(result).toEqual(expect.objectContaining({
            version: expectedVersion,
            versionCode: 3,
            buildNumber: '3',
        }));
        expect(result.packageJson.version).toBe(expectedVersion);
    });

    test('does not mutate the source objects', () => {
        const originalApp = appConfig();
        const originalPackage = { version: '1.0.0' };

        calculateNextRelease(originalApp, originalPackage, 'build');

        expect(originalApp.expo.android.versionCode).toBe(2);
        expect(originalPackage.version).toBe('1.0.0');
    });

    test('rejects invalid versions and native build identifiers', () => {
        expect(() => calculateNextRelease(
            { ...appConfig(), expo: { ...appConfig().expo, version: 'rc.1' } },
            { version: 'rc.1' },
        )).toThrow('Invalid app version');

        expect(() => calculateNextRelease(
            {
                ...appConfig(),
                expo: {
                    ...appConfig().expo,
                    android: { versionCode: 0 },
                },
            },
            { version: '1.0.0' },
        )).toThrow('Native build numbers must be positive integers');
    });
});

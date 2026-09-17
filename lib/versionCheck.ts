import Constants from 'expo-constants';
import { fetchWithTimeout } from './fetchWithTimeout';
import packageConfig from '../package.json';

const REPOSITORY = 'Ahoshinet/subscription-app';
const GITHUB_API_BASE_URL = `https://api.github.com/repos/${REPOSITORY}`;
const GITHUB_REPOSITORY_URL = `https://github.com/${REPOSITORY}`;
const REQUEST_TIMEOUT_MS = 5000;

type GitHubRelease = {
    tag_name?: string;
    html_url?: string;
};

type GitHubTag = {
    name?: string;
};

type VersionParts = {
    release: [number, number, number];
    /** SemVer prerelease identifiers (`2.0.0-beta.3` -> ['beta', 3]); empty for a stable version. */
    prerelease: (string | number)[];
};

export type RepositoryUpdate = {
    currentVersion: string;
    latestVersion: string;
    releaseUrl: string;
};

type LatestRepositoryVersion = {
    version: string;
    url: string;
};

function normalizeVersion(version: string): string {
    return version.trim().replace(/^v/i, '');
}

export function resolveAppVersion(
    releaseVersion: unknown,
    bundledVersion: unknown,
    nativeVersion: unknown,
): string {
    for (const candidate of [releaseVersion, bundledVersion, nativeVersion]) {
        if (typeof candidate !== 'string') continue;
        const normalized = normalizeVersion(candidate);
        if (normalized) return normalized;
    }
    return '0.0.0';
}

export const getCurrentAppVersion = () => resolveAppVersion(
    Constants.expoConfig?.extra?.releaseVersion,
    packageConfig.version,
    Constants.expoConfig?.version,
);

// This project tags betas as `-betaN` (no dot), so a trailing number is split
// off its word to keep `beta10` above `beta9` instead of comparing lexically.
function parsePrerelease(prerelease: string): (string | number)[] {
    return prerelease.split('.').flatMap((identifier) => {
        if (/^\d+$/.test(identifier)) return [Number(identifier)];
        const match = identifier.match(/^([0-9A-Za-z-]*?[A-Za-z-])(\d+)$/);
        return match ? [match[1], Number(match[2])] : [identifier];
    });
}

function parseVersion(version: string): VersionParts | null {
    const match = normalizeVersion(version).match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/);
    if (!match) return null;
    return {
        release: [Number(match[1]), Number(match[2]), Number(match[3])],
        prerelease: match[4] ? parsePrerelease(match[4]) : [],
    };
}

function isStableVersion(version: string): boolean {
    const parts = parseVersion(version);
    return parts !== null && parts.prerelease.length === 0;
}

function compareIdentifiers(left: string | number, right: string | number): number {
    if (typeof left === 'number' && typeof right === 'number') return Math.sign(left - right);
    // Numeric identifiers always have lower precedence than alphanumeric ones.
    if (typeof left === 'number') return -1;
    if (typeof right === 'number') return 1;
    return left < right ? -1 : left > right ? 1 : 0;
}

// SemVer precedence, so `2.0.0-beta32` < `2.0.0` and a beta install is told
// about the stable release, while `2.0.0` never counts as newer than itself.
function compareVersions(left: string, right: string): number {
    const leftParts = parseVersion(left);
    const rightParts = parseVersion(right);
    if (!leftParts || !rightParts) return 0;

    for (let index = 0; index < leftParts.release.length; index += 1) {
        if (leftParts.release[index] > rightParts.release[index]) return 1;
        if (leftParts.release[index] < rightParts.release[index]) return -1;
    }

    if (leftParts.prerelease.length === 0 || rightParts.prerelease.length === 0) {
        return Math.sign(rightParts.prerelease.length - leftParts.prerelease.length);
    }

    const length = Math.min(leftParts.prerelease.length, rightParts.prerelease.length);
    for (let index = 0; index < length; index += 1) {
        const result = compareIdentifiers(leftParts.prerelease[index], rightParts.prerelease[index]);
        if (result !== 0) return result;
    }

    return Math.sign(leftParts.prerelease.length - rightParts.prerelease.length);
}

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetchWithTimeout(url, {
        headers: {
            Accept: 'application/vnd.github+json',
        },
    }, REQUEST_TIMEOUT_MS);

    if (!response.ok) {
        throw new Error(`GitHub request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
}

async function fetchLatestRelease(): Promise<LatestRepositoryVersion | null> {
    try {
        const release = await fetchJson<GitHubRelease>(`${GITHUB_API_BASE_URL}/releases/latest`);
        // GitHub excludes releases flagged as prereleases here, but a beta tag
        // published without the flag would still surface; never offer one.
        if (!release.tag_name || !isStableVersion(release.tag_name)) return null;
        return {
            version: release.tag_name,
            url: release.html_url ?? `${GITHUB_REPOSITORY_URL}/releases/tag/${release.tag_name}`,
        };
    } catch {
        return null;
    }
}

async function fetchLatestTag(): Promise<LatestRepositoryVersion | null> {
    try {
        const tags = await fetchJson<GitHubTag[]>(`${GITHUB_API_BASE_URL}/tags?per_page=100`);
        const semverTags = tags
            .map((tag) => tag.name)
            .filter((name): name is string => !!name && isStableVersion(name))
            .sort((left, right) => compareVersions(right, left));

        const latestTag = semverTags[0] ?? null;
        if (!latestTag) return null;
        return {
            version: latestTag,
            url: `${GITHUB_REPOSITORY_URL}/tree/${latestTag}`,
        };
    } catch {
        return null;
    }
}

export async function checkRepositoryUpdate(currentVersion = getCurrentAppVersion()): Promise<RepositoryUpdate | null> {
    const latest = await fetchLatestRelease() ?? await fetchLatestTag();
    if (!latest || compareVersions(latest.version, currentVersion) <= 0) {
        return null;
    }

    const normalizedLatestVersion = normalizeVersion(latest.version);
    return {
        currentVersion: normalizeVersion(currentVersion),
        latestVersion: normalizedLatestVersion,
        releaseUrl: latest.url,
    };
}

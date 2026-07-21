import Constants from 'expo-constants';
import { fetchWithTimeout } from './fetchWithTimeout';

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

type VersionParts = [number, number, number];

export type RepositoryUpdate = {
    currentVersion: string;
    latestVersion: string;
    releaseUrl: string;
};

type LatestRepositoryVersion = {
    version: string;
    url: string;
};

export const getCurrentAppVersion = () => Constants.expoConfig?.version ?? '0.0.0';

function normalizeVersion(version: string): string {
    return version.trim().replace(/^v/i, '');
}

function parseVersion(version: string): VersionParts | null {
    const match = normalizeVersion(version).match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
    if (!match) return null;
    return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareVersions(left: string, right: string): number {
    const leftParts = parseVersion(left);
    const rightParts = parseVersion(right);
    if (!leftParts || !rightParts) return 0;

    for (let index = 0; index < leftParts.length; index += 1) {
        if (leftParts[index] > rightParts[index]) return 1;
        if (leftParts[index] < rightParts[index]) return -1;
    }

    return 0;
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
        if (!release.tag_name) return null;
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
            .filter((name): name is string => !!name && parseVersion(name) !== null)
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

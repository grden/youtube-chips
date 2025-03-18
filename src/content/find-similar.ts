import { YouTubeChip } from "../utils/interface";

// Types
type ChipMatch = {
    chip: YouTubeChip;
    score: number;
};

// Constants
const MATCH_SCORES = {
    EXACT: 1.0,
    EXACT_SUBSTRING: 0.9,
    SUBSTRING: 0.7,
    PARTIAL: 0.5,
    EDIT_DISTANCE_WEIGHT: 0.3,
} as const;

/**
 * Calculates the Levenshtein distance between two strings
 */
export const calculateLevenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = Array(a.length + 1)
        .fill(null)
        .map(() => Array(b.length + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    // Fill in the rest of the matrix
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,      // deletion
                matrix[i][j - 1] + 1,      // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[a.length][b.length];
};

/**
 * Calculates substring match score between preferred and available chip text
 */
const calculateSubstringScore = (preferred: string, chipText: string): number => {
    // For very short chip texts (like "all"), we should be more strict
    if (chipText.length < 4) {
        // Only give substring score if it's an exact match
        return chipText === preferred ? MATCH_SCORES.EXACT : 0;
    }

    if (chipText.includes(preferred)) {
        return MATCH_SCORES.EXACT_SUBSTRING;
    }

    if (preferred.includes(chipText)) {
        // Adjust score based on length ratio to prevent short substrings from getting high scores
        const lengthRatio = chipText.length / preferred.length;
        return lengthRatio >= 0.5 ? MATCH_SCORES.SUBSTRING : MATCH_SCORES.SUBSTRING * lengthRatio;
    }

    const preferredWords = preferred.split(/\s+/);
    const chipWords = chipText.split(/\s+/);

    const commonWords = preferredWords.filter(word =>
        chipWords.some(chipWord =>
            chipWord.includes(word) || word.includes(chipWord)
        )
    );

    if (commonWords.length > 0) {
        return MATCH_SCORES.PARTIAL * (commonWords.length / Math.max(preferredWords.length, chipWords.length));
    }

    return 0;
};

/**
 * Calculates edit distance based score between preferred and available chip text
 */
const calculateEditDistanceScore = (preferred: string, chipText: string): number => {
    const editDistance = calculateLevenshteinDistance(preferred, chipText);
    const maxLength = Math.max(preferred.length, chipText.length);
    return (1 - editDistance / maxLength) * MATCH_SCORES.EDIT_DISTANCE_WEIGHT;
};

/**
 * Finds the most similar chip to the preferred chip text
 */
export const findSimilarChip = (preferredChip: string, availableChips: YouTubeChip[]): YouTubeChip | null => {
    if (!preferredChip || availableChips.length === 0) return null;

    // Try exact match first
    const exactMatch = availableChips.find(chip => chip.text === preferredChip);
    if (exactMatch) return exactMatch;

    const preferredLower = preferredChip.toLowerCase();

    // Calculate scores for all available chips
    const matches: ChipMatch[] = availableChips.map(chip => {
        const chipLower = chip.text.toLowerCase();
        const substringScore = calculateSubstringScore(preferredLower, chipLower);
        const editScore = calculateEditDistanceScore(preferredLower, chipLower);

        // Use the higher score between substring and edit distance
        return {
            chip,
            score: Math.max(substringScore, editScore)
        };
    });

    // Sort by score and return the best match
    matches.sort((a, b) => b.score - a.score);
    return matches[0].chip;
};
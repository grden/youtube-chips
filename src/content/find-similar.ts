import { YouTubeChip } from "../utils/interface";

const SIMILARITY_API_ENDPOINT = 'http://localhost:8000/api/find-similar';

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
 * Finds the most similar chip to the preferred chip text by calling an external API.
 */
export const findSimilarChip = async (preferredChip: string, availableChips: YouTubeChip[]): Promise<YouTubeChip | null> => {
    if (!preferredChip || availableChips.length === 0) return null;

    // If your API is case-insensitive or handles normalization, you might not need toLowerCase() here.
    // const preferredLower = preferredChip.toLocaleLowerCase(); 

    try {
        const response = await fetch(SIMILARITY_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                preferred_chip_text: preferredChip,
                // Send only the texts to the API, as the server likely doesn't need the full YouTubeChip objects.
                available_chip_texts: availableChips.map(chip => chip.text) 
            })
        });

        if (!response.ok) {
            console.error(`Similarity API error: ${response.status} ${await response.text()}`);
            // Fallback strategy: if API fails, optionally return null or implement local fallback
            // For now, we'll return null to indicate failure to find a match via API.
            return null; 
        }

        const data = await response.json();
        
        // Assuming your server responds with: { best_match_text: "Text of the best chip" }
        const bestMatchText = data.best_match_text;

        if (bestMatchText) {
            // Find the original YouTubeChip object from the availableChips array
            const matchedChip = availableChips.find(chip => chip.text === bestMatchText);
            return matchedChip || null;
        }

        return null; // No best match text returned from API

    } catch (error) {
        console.error('Error calling similarity API:', error);
        // Fallback strategy for network errors or other issues
        return null;
    }
};

// We are removing the local calculation functions (calculateLevenshteinDistance, calculateSubstringScore, calculateEditDistanceScore)
// as the logic is now handled by the external API.
// If you want to keep them as a fallback, we can adjust the logic above.
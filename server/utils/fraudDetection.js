import OrganizerProfile from '../models/organizerProfileModel.js';

// Normalize text for better matching (remove accents, lowercase)
const normalizeText = (text) => {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
};

// Suspicious keywords that indicate potential scams
const SUSPICIOUS_KEYWORDS = {
    urgency: [
        'guaranteed',
        'must pay now',
        'limited time',
        'act fast',
        'urgent',
        'hurry',
        'dont miss',
        "don't miss",
        'limited spots',
        'ending soon',
        'garanti',
        'payer maintenant',
        'temps limite',
        'agir vite',
    ],
    tooGood: [
        'too good to be true',
        'amazing opportunity',
        'once in a lifetime',
        'exclusive offer',
        'special deal',
        'incredible',
        'unbelievable',
        'trop beau',
        'opportunite incroyable',
        'offre exclusive',
    ],
    financial: [
        'cash only',
        'wire transfer',
        'mobile money only',
        'pay upfront',
        'deposit required',
        'non refundable',
        'especes seulement',
        'virement',
        'mobile money seulement',
    ],
};

// Check for suspicious keywords in text
const checkSuspiciousKeywords = (text) => {
    const normalizedText = normalizeText(text);
    const foundKeywords = [];
    let suspicionScore = 0;

    // Check each category
    for (const [category, keywords] of Object.entries(SUSPICIOUS_KEYWORDS)) {
        for (const keyword of keywords) {
            const normalizedKeyword = normalizeText(keyword);
            if (normalizedText.includes(normalizedKeyword)) {
                foundKeywords.push(keyword);

                // Weight by category
                if (category === 'urgency') suspicionScore += 0.15;
                if (category === 'tooGood') suspicionScore += 0.2;
                if (category === 'financial') suspicionScore += 0.25;
            }
        }
    }

    return { foundKeywords, suspicionScore };
};

// Check if price is suspiciously high for unverified organizer
const checkSuspiciousPrice = async (price, organizerId) => {
    const HIGH_PRICE_THRESHOLD = 10000;

    if (price <= HIGH_PRICE_THRESHOLD) {
        return { isSuspicious: false, score: 0, reason: null };
    }

    try {
        const organizerProfile = await OrganizerProfile.findOne({ user: organizerId })
            .select('isVerified')
            .lean();

        const isVerified = organizerProfile?.isVerified || false;

        if (!isVerified) {
            return {
                isSuspicious: true,
                score: 0.3,
                reason: `High price (${price} FCFA) from unverified organizer`,
            };
        }

        return { isSuspicious: false, score: 0, reason: null };
    } catch (error) {
        console.error('[Fraud Detection] Error checking organizer:', error);
        return { isSuspicious: false, score: 0, reason: null };
    }
};

// Check for missing critical information
const checkMissingInfo = (eventData) => {
    const issues = [];
    let suspicionScore = 0;

    // Check location details
    if (!eventData.location?.address || eventData.location.address.length < 10) {
        issues.push('Vague or missing location details');
        suspicionScore += 0.2;
    }

    // Check contact information
    const hasPhone = eventData.contactInfo?.phone && eventData.contactInfo.phone.trim().length > 0;
    const hasEmail = eventData.contactInfo?.email && eventData.contactInfo.email.trim().length > 0;

    if (!hasPhone && !hasEmail) {
        issues.push('Missing contact information');
        suspicionScore += 0.25;
    }

    // Check venue name
    if (!eventData.location?.venue || eventData.location.venue.length < 3) {
        issues.push('Missing or vague venue name');
        suspicionScore += 0.15;
    }

    return { issues, suspicionScore };
};

// Main fraud detection function
export const detectEventFraud = async (eventData) => {
    console.log(`[Fraud Detection] Analyzing event: "${eventData.title}"`);

    const reasons = [];
    let totalScore = 0;

    // Check for suspicious keywords in title and description
    const combinedText = `${eventData.title} ${eventData.description}`;
    const keywordCheck = checkSuspiciousKeywords(combinedText);

    if (keywordCheck.foundKeywords.length > 0) {
        reasons.push(`Contains suspicious keywords: ${keywordCheck.foundKeywords.slice(0, 3).join(', ')}`);
        totalScore += keywordCheck.suspicionScore;
    }

    // Check for suspicious pricing
    const priceCheck = await checkSuspiciousPrice(eventData.price, eventData.organizer);

    if (priceCheck.isSuspicious) {
        reasons.push(priceCheck.reason);
        totalScore += priceCheck.score;
    }

    // Check for missing critical information
    const missingInfoCheck = checkMissingInfo(eventData);

    if (missingInfoCheck.issues.length > 0) {
        reasons.push(...missingInfoCheck.issues);
        totalScore += missingInfoCheck.suspicionScore;
    }

    // Calculate final confidence score (up to 1.0)
    const confidenceScore = Math.min(totalScore, 1.0);

    // Determine if event should be flagged (2 issues or score >= 0.4)
    const shouldFlag = reasons.length >= 2 || confidenceScore >= 0.4;

    console.log(`[Fraud Detection] Result: ${shouldFlag ? 'FLAGGED' : 'CLEAN'}`);
    console.log(`[Fraud Detection] Score: ${confidenceScore.toFixed(2)}`);
    console.log(`[Fraud Detection] Reasons: ${reasons.length}`);

    return {
        isFlagged: shouldFlag,
        confidenceScore: Number(confidenceScore.toFixed(2)),
        flagReasons: reasons,
        flagCount: reasons.length,
        flagReason: shouldFlag ? reasons.join(' | ') : null,
    };
};

// Validate fraud detection result
export const validateFraudResult = (result) => {
    if (typeof result !== 'object' || result === null) {
        throw new Error('Invalid fraud detection result');
    }

    if (typeof result.isFlagged !== 'boolean') {
        throw new Error('isFlagged must be a boolean');
    }

    if (typeof result.confidenceScore !== 'number' || result.confidenceScore < 0 || result.confidenceScore > 1) {
        throw new Error('confidenceScore must be a number between 0 and 1');
    }

    if (!Array.isArray(result.flagReasons)) {
        throw new Error('flagReasons must be an array');
    }

    return true;
};

export default {
    detectEventFraud,
    validateFraudResult,
};
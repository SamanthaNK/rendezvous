export const CATEGORIES = [
    { id: 'Music & Concerts', label: 'Music & Concerts' },
    { id: 'Arts & Culture', label: 'Arts & Culture' },
    { id: 'Sports & Fitness', label: 'Sports & Fitness' },
    { id: 'Food & Drink', label: 'Food & Drink' },
    { id: 'Business & Networking', label: 'Business & Networking' },
    { id: 'Technology', label: 'Technology' },
    { id: 'Health & Wellness', label: 'Health & Wellness' },
    { id: 'Community & Charity', label: 'Community & Charity' },
    { id: 'Entertainment', label: 'Entertainment' },
    { id: 'Education & Workshops', label: 'Education & Workshops' },
    { id: 'Family & Kids', label: 'Family & Kids' },
    { id: 'Nightlife', label: 'Nightlife' },
];

export const CITIES = [
    { id: 'Yaoundé', label: 'Yaoundé', region: 'Centre' },
    { id: 'Douala', label: 'Douala', region: 'Littoral' },
    { id: 'Garoua', label: 'Garoua', region: 'North' },
    { id: 'Bamenda', label: 'Bamenda', region: 'North-West' },
    { id: 'Bafoussam', label: 'Bafoussam', region: 'West' },
    { id: 'Maroua', label: 'Maroua', region: 'Far-North' },
    { id: 'Ngaoundéré', label: 'Ngaoundéré', region: 'Adamawa' },
    { id: 'Bertoua', label: 'Bertoua', region: 'East' },
    { id: 'Limbe', label: 'Limbe', region: 'South-West' },
    { id: 'Buea', label: 'Buea', region: 'South-West' },
    { id: 'Kumba', label: 'Kumba', region: 'South-West' },
    { id: 'Ebolowa', label: 'Ebolowa', region: 'South' },
    { id: 'Kribi', label: 'Kribi', region: 'South' },
];

// Helper to get just the values for Select components
export const getCategoryOptions = () => CATEGORIES.map(c => ({ value: c.id, label: c.label }));
export const getCityOptions = () => CITIES.map(c => ({ value: c.id, label: c.label }));

// Helper to get just IDs for validation
export const CATEGORY_IDS = CATEGORIES.map(c => c.id);
export const CITY_IDS = CITIES.map(c => c.id);
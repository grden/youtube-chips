// Predefined YouTube categories
export const PREDEFINED_CATEGORIES = ["All", "Gaming", "News", "Music", "Recently uploaded", "Watched", "New to you"];
// Custom preference option 
export const CUSTOM_OPTION = "Or write your own category";

// Day names for display
export const DAYS_OF_WEEK = [
    { value: 0, label: 'S', fullName: 'Sunday' },
    { value: 1, label: 'M', fullName: 'Monday' },
    { value: 2, label: 'T', fullName: 'Tuesday' },
    { value: 3, label: 'W', fullName: 'Wednesday' },
    { value: 4, label: 'T', fullName: 'Thursday' },
    { value: 5, label: 'F', fullName: 'Friday' },
    { value: 6, label: 'S', fullName: 'Saturday' },
];

// Hours for dropdown
export const HOURS = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i}:00`,
}));

// Form validation errors
export type FormErrors = {
    days?: string;
    timeRange?: string;
    preference?: string;
    overlap?: string;
};
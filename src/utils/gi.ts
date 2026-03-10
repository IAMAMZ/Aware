import type { GICategory } from '../types';

export const calculateGILoad = (foodGi: number, carbsGrams: number): number => {
    return (foodGi * carbsGrams) / 100;
};

export const getGICategoryColor = (category: GICategory): string => {
    switch (category) {
        case 'low': return 'text-primary-light';
        case 'medium': return 'text-warning';
        case 'high': return 'text-danger';
        case 'zero': return 'text-text-muted';
        default: return 'text-text-main';
    }
};

export const evaluateGIRisk = (lastCategory: GICategory | null, hoursSinceLastMeal: number): 'safe' | 'warning' | 'danger' => {
    if (!lastCategory) return 'safe';

    if (lastCategory === 'high') {
        if (hoursSinceLastMeal < 2) return 'danger'; // Glucose spike
        if (hoursSinceLastMeal >= 2 && hoursSinceLastMeal < 4) return 'warning'; // Reactive hypoglycemia risk
    }

    if (lastCategory === 'medium' && hoursSinceLastMeal > 4) return 'warning';

    return 'safe';
};

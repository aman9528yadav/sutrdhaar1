// Auto-detect and parse unit inputs
export interface ParsedInput {
    value: number;
    unit: string;
    category: string;
}

// Parse natural language inputs like "5 feet 10 inches"
export function parseUnitInput(input: string): ParsedInput[] {
    const patterns = [
        // Feet and inches: "5'10", "5 feet 10 inches", "5ft 10in"
        {
            regex: /(\d+\.?\d*)\s*(?:feet|ft|')\s*(\d+\.?\d*)\s*(?:inches|in|")?/i, handler: (m: RegExpMatchArray) => [
                { value: parseFloat(m[1]), unit: 'Feet', category: 'Length' },
                { value: parseFloat(m[2]), unit: 'Inches', category: 'Length' }
            ]
        },
        // Kg and g: "2kg 500g", "2 kg 500 g"
        {
            regex: /(\d+\.?\d*)\s*kg\s*(\d+\.?\d*)\s*g/i, handler: (m: RegExpMatchArray) => [
                { value: parseFloat(m[1]), unit: 'Kilograms', category: 'Weight' },
                { value: parseFloat(m[2]), unit: 'Grams', category: 'Weight' }
            ]
        },
        // Pounds and ounces: "5 lbs 8 oz"
        {
            regex: /(\d+\.?\d*)\s*(?:lbs?|pounds?)\s*(\d+\.?\d*)\s*(?:oz|ounces?)/i, handler: (m: RegExpMatchArray) => [
                { value: parseFloat(m[1]), unit: 'Pounds', category: 'Weight' },
                { value: parseFloat(m[2]), unit: 'Ounces', category: 'Weight' }
            ]
        },
        // Single units with various formats
        {
            regex: /(\d+\.?\d*)\s*(meters?|m|kilometres?|km|centimeters?|cm|millimeters?|mm|feet|ft|inches?|in|yards?|yd|miles?|mi)/i, handler: (m: RegExpMatchArray) => {
                const unitMap: Record<string, string> = {
                    'meter': 'Meters', 'meters': 'Meters', 'm': 'Meters',
                    'kilometer': 'Kilometers', 'kilometres': 'Kilometers', 'km': 'Kilometers',
                    'centimeter': 'Centimeters', 'centimeters': 'Centimeters', 'cm': 'Centimeters',
                    'millimeter': 'Millimeters', 'millimeters': 'Millimeters', 'mm': 'Millimeters',
                    'feet': 'Feet', 'ft': 'Feet',
                    'inch': 'Inches', 'inches': 'Inches', 'in': 'Inches',
                    'yard': 'Yards', 'yards': 'Yards', 'yd': 'Yards',
                    'mile': 'Miles', 'miles': 'Miles', 'mi': 'Miles',
                };
                return [{ value: parseFloat(m[1]), unit: unitMap[m[2].toLowerCase()] || m[2], category: 'Length' }];
            }
        },
    ];

    for (const pattern of patterns) {
        const match = input.match(pattern.regex);
        if (match) {
            return pattern.handler(match);
        }
    }

    return [];
}

// Quick conversion presets
export interface QuickConversion {
    label: string;
    category: string;
    fromUnit: string;
    toUnit: string;
    value: string;
    icon: string;
    description: string;
}

export const QUICK_CONVERSIONS: QuickConversion[] = [
    {
        label: 'Body Height',
        category: 'Length',
        fromUnit: 'Feet',
        toUnit: 'Centimeters',
        value: '5.9',
        icon: '📏',
        description: '5\'9" to cm'
    },
    {
        label: 'Body Weight',
        category: 'Weight',
        fromUnit: 'Pounds',
        toUnit: 'Kilograms',
        value: '150',
        icon: '⚖️',
        description: 'lbs to kg'
    },
    {
        label: 'Oven Temp',
        category: 'Temperature',
        fromUnit: 'Fahrenheit',
        toUnit: 'Celsius',
        value: '350',
        icon: '🔥',
        description: '350°F to °C'
    },
    {
        label: 'TV Screen',
        category: 'Length',
        fromUnit: 'Inches',
        toUnit: 'Centimeters',
        value: '55',
        icon: '📺',
        description: '55" TV size'
    },
    {
        label: 'Running 5K',
        category: 'Length',
        fromUnit: 'Kilometers',
        toUnit: 'Miles',
        value: '5',
        icon: '🏃',
        description: '5K race'
    },
    {
        label: 'Room Temp',
        category: 'Temperature',
        fromUnit: 'Celsius',
        toUnit: 'Fahrenheit',
        value: '20',
        icon: '🌡️',
        description: '20°C room'
    },
];

// Real-world comparisons
export interface RealWorldComparison {
    value: number;
    unit: string;
    comparison: string;
    icon: string;
}

export function getRealWorldComparison(value: number, unit: string): RealWorldComparison | null {
    const comparisons: Record<string, Array<{ min: number; max: number; comparison: string; icon: string }>> = {
        'Meters': [
            { min: 90, max: 110, comparison: 'Length of a football field', icon: '🏈' },
            { min: 1, max: 2, comparison: 'Height of a person', icon: '🧍' },
            { min: 8, max: 10, comparison: 'Height of a 3-story building', icon: '🏢' },
            { min: 800, max: 900, comparison: 'Height of Burj Khalifa', icon: '🏙️' },
        ],
        'Kilometers': [
            { min: 40, max: 43, comparison: 'Marathon distance', icon: '🏃' },
            { min: 1, max: 2, comparison: '15-minute walk', icon: '🚶' },
            { min: 380000, max: 390000, comparison: 'Distance to the Moon', icon: '🌙' },
        ],
        'Kilograms': [
            { min: 1, max: 1, comparison: 'Weight of 1 liter of water', icon: '💧' },
            { min: 60, max: 80, comparison: 'Average adult weight', icon: '🧍' },
            { min: 5, max: 7, comparison: 'Weight of a newborn baby', icon: '👶' },
        ],
        'Pounds': [
            { min: 140, max: 180, comparison: 'Average adult weight', icon: '🧍' },
            { min: 6, max: 10, comparison: 'Weight of a newborn baby', icon: '👶' },
        ],
        'Celsius': [
            { min: 0, max: 0, comparison: 'Water freezes', icon: '❄️' },
            { min: 100, max: 100, comparison: 'Water boils', icon: '💨' },
            { min: 20, max: 25, comparison: 'Comfortable room temperature', icon: '🏠' },
            { min: 36, max: 38, comparison: 'Human body temperature', icon: '🌡️' },
        ],
        'Fahrenheit': [
            { min: 32, max: 32, comparison: 'Water freezes', icon: '❄️' },
            { min: 212, max: 212, comparison: 'Water boils', icon: '💨' },
            { min: 68, max: 77, comparison: 'Comfortable room temperature', icon: '🏠' },
            { min: 97, max: 99, comparison: 'Human body temperature', icon: '🌡️' },
        ],
    };

    const unitComparisons = comparisons[unit];
    if (!unitComparisons) return null;

    for (const comp of unitComparisons) {
        if (value >= comp.min && value <= comp.max) {
            return {
                value,
                unit,
                comparison: comp.comparison,
                icon: comp.icon
            };
        }
    }

    return null;
}

// Smart suggestions based on context
export interface SmartSuggestion {
    fromUnit: string;
    toUnit: string;
    reason: string;
    icon: string;
}

export function getSmartSuggestions(category: string, userLocation?: string): SmartSuggestion[] {
    const suggestions: Record<string, SmartSuggestion[]> = {
        'Length': [
            { fromUnit: 'Feet', toUnit: 'Meters', reason: 'Most common conversion', icon: '⭐' },
            { fromUnit: 'Inches', toUnit: 'Centimeters', reason: 'Screen sizes, heights', icon: '📱' },
            { fromUnit: 'Miles', toUnit: 'Kilometers', reason: 'Travel distances', icon: '🚗' },
        ],
        'Weight': [
            { fromUnit: 'Pounds', toUnit: 'Kilograms', reason: 'Body weight', icon: '⚖️' },
            { fromUnit: 'Ounces', toUnit: 'Grams', reason: 'Cooking measurements', icon: '🍳' },
        ],
        'Temperature': [
            { fromUnit: 'Fahrenheit', toUnit: 'Celsius', reason: 'Weather & cooking', icon: '🌡️' },
            { fromUnit: 'Celsius', toUnit: 'Fahrenheit', reason: 'US conversions', icon: '🇺🇸' },
        ],
        'Volume': [
            { fromUnit: 'Gallons (US)', toUnit: 'Liters', reason: 'Fuel & liquids', icon: '⛽' },
            { fromUnit: 'Cups', toUnit: 'Milliliters', reason: 'Cooking', icon: '🥤' },
        ],
    };

    return suggestions[category] || [];
}

// Visual scale data for charts
export interface VisualScale {
    percentage: number;
    label: string;
    color: string;
}

export function getVisualScale(value: number, fromUnit: string, toUnit: string, convertedValue: number): VisualScale[] {
    // Create a visual comparison between the two values
    const max = Math.max(value, convertedValue);

    return [
        {
            percentage: (value / max) * 100,
            label: `${value} ${fromUnit}`,
            color: '#3b82f6' // blue
        },
        {
            percentage: (convertedValue / max) * 100,
            label: `${convertedValue} ${toUnit}`,
            color: '#10b981' // green
        }
    ];
}

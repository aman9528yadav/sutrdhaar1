// Unit descriptions with history, usage, and fun facts

export interface UnitInfo {
    name: string;
    history: string;
    commonUse: string;
    funFact: string;
    relatedUnits: string[];
}

export const UNIT_DESCRIPTIONS: Record<string, UnitInfo> = {
    // Length
    'Meters': {
        name: 'Meters',
        history: 'Defined in 1793 during the French Revolution as one ten-millionth of the distance from the equator to the North Pole. Now defined by the speed of light.',
        commonUse: 'Standard unit of length in the metric system, used worldwide in science, engineering, and everyday measurements.',
        funFact: 'The meter was originally meant to be based on Earth\'s dimensions, but is now defined by how far light travels in 1/299,792,458 of a second!',
        relatedUnits: ['Kilometers', 'Centimeters', 'Millimeters', 'Feet']
    },
    'Feet': {
        name: 'Feet',
        history: 'Based on the human foot, standardized in medieval England. The modern foot was defined in 1959 as exactly 0.3048 meters.',
        commonUse: 'Commonly used in the United States, United Kingdom, and Canada for measuring height, room dimensions, and short distances.',
        funFact: 'The average human foot is about 9.4 inches, but the "foot" measurement is 12 inches. It was standardized to make calculations easier!',
        relatedUnits: ['Inches', 'Yards', 'Miles', 'Meters']
    },
    'Miles': {
        name: 'Miles',
        history: 'From the Roman "mille passus" (thousand paces). A Roman mile was 1,000 paces of a Roman soldier, about 4,850 feet.',
        commonUse: 'Used primarily in the US and UK for road distances, running races, and aviation.',
        funFact: 'A marathon is 26.2 miles because that\'s the distance from Marathon to Athens, plus an extra 385 yards added for the 1908 Olympics!',
        relatedUnits: ['Kilometers', 'Feet', 'Yards', 'Nautical Miles']
    },

    // Weight
    'Kilograms': {
        name: 'Kilograms',
        history: 'Defined in 1795 as the mass of one liter of water. Until 2019, it was defined by a physical platinum-iridium cylinder in France.',
        commonUse: 'Standard unit of mass worldwide, used for body weight, food, and most commercial products.',
        funFact: 'The original kilogram prototype, "Le Grand K", lost about 50 micrograms over 100 years. That\'s why it was redefined using fundamental constants in 2019!',
        relatedUnits: ['Grams', 'Pounds', 'Ounces', 'Metric Tonnes']
    },
    'Pounds': {
        name: 'Pounds',
        history: 'From the Roman "libra pondo" (pound weight). The symbol "lb" comes from "libra". Standardized in 1959 as exactly 0.45359237 kg.',
        commonUse: 'Primary unit for body weight and food in the US. Also used in UK alongside kilograms.',
        funFact: 'The British pound sterling (£) got its name because it was originally worth one pound of silver!',
        relatedUnits: ['Ounces', 'Kilograms', 'Stone', 'Grams']
    },

    // Temperature
    'Celsius': {
        name: 'Celsius',
        history: 'Created by Anders Celsius in 1742. Originally, 0° was boiling point and 100° was freezing - it was reversed after his death!',
        commonUse: 'Used worldwide except in the US. Standard for science and weather reporting in most countries.',
        funFact: 'The Celsius scale was originally called "centigrade" (100 steps) but was renamed in 1948 to honor Anders Celsius.',
        relatedUnits: ['Fahrenheit', 'Kelvin']
    },
    'Fahrenheit': {
        name: 'Fahrenheit',
        history: 'Created by Daniel Fahrenheit in 1724. He set 0° as the coldest temperature he could create with ice and salt, and 96° as human body temperature.',
        commonUse: 'Primarily used in the United States, Bahamas, Cayman Islands, and Palau for everyday temperature.',
        funFact: 'Fahrenheit chose 96° for body temperature because it\'s divisible by 2, 3, 4, 6, 8, 12, 16, 24, 32, and 48 - making calculations easier!',
        relatedUnits: ['Celsius', 'Kelvin']
    },
    'Kelvin': {
        name: 'Kelvin',
        history: 'Proposed by William Thomson (Lord Kelvin) in 1848. Based on absolute zero, the coldest possible temperature.',
        commonUse: 'Used in scientific research, especially physics and astronomy. The SI base unit for temperature.',
        funFact: 'Absolute zero (0 K) is -273.15°C. At this temperature, atoms would theoretically stop moving entirely!',
        relatedUnits: ['Celsius', 'Fahrenheit']
    },

    // Energy
    'Joules': {
        name: 'Joules',
        history: 'Named after James Prescott Joule, who studied the relationship between heat and mechanical work in the 1840s.',
        commonUse: 'SI unit of energy, used in physics, engineering, and nutrition labels in some countries.',
        funFact: 'One joule is about the energy needed to lift a small apple one meter. A lightning bolt contains about 1 billion joules!',
        relatedUnits: ['Calories', 'Kilowatt-hours', 'BTU']
    },
    'Calories': {
        name: 'Calories',
        history: 'Defined in the 1820s by Nicolas Clément. The "food calorie" is actually a kilocalorie (1000 calories).',
        commonUse: 'Primarily used for food energy content. When you see "100 calories" on food, it\'s actually 100 kilocalories.',
        funFact: 'A single M&M candy has about 4 calories. To burn it off, you\'d need to walk for about 1 minute!',
        relatedUnits: ['Kilocalories', 'Joules', 'Kilowatt-hours']
    },
    'Kilowatt-hours': {
        name: 'Kilowatt-hours',
        history: 'Became standard in the late 1800s with the rise of electric power distribution.',
        commonUse: 'Used worldwide for measuring electrical energy consumption on utility bills.',
        funFact: 'The average US home uses about 30 kWh per day. That\'s enough energy to power a 100W light bulb for 300 hours!',
        relatedUnits: ['Joules', 'Watt-hours', 'BTU']
    },

    // Power
    'Watts': {
        name: 'Watts',
        history: 'Named after James Watt, inventor of the improved steam engine. Adopted as the SI unit of power in 1960.',
        commonUse: 'Used for electrical power ratings of appliances, light bulbs, and engines.',
        funFact: 'A typical microwave uses 1000W. That means it uses 1000 joules of energy every second!',
        relatedUnits: ['Kilowatts', 'Horsepower', 'BTU per hour']
    },
    'Horsepower (Metric)': {
        name: 'Horsepower',
        history: 'Invented by James Watt in the 1770s to compare steam engines to horses. One HP is the power of one horse lifting 550 pounds one foot per second.',
        commonUse: 'Used for rating car engines, motors, and mechanical equipment.',
        funFact: 'A horse can actually produce up to 15 horsepower in short bursts! The "1 HP" rating is for sustained work.',
        relatedUnits: ['Watts', 'Kilowatts', 'BTU per hour']
    },

    // Angle
    'Degrees': {
        name: 'Degrees',
        history: 'Ancient Babylonians divided circles into 360 degrees because 360 has many divisors and relates to their base-60 number system.',
        commonUse: 'Used in navigation, geometry, geography (latitude/longitude), and everyday angle measurements.',
        funFact: 'Why 360°? Ancient astronomers thought there were 360 days in a year, and the sun moved 1° per day across the sky!',
        relatedUnits: ['Radians', 'Gradians', 'Turns']
    },
    'Radians': {
        name: 'Radians',
        history: 'Introduced by Roger Cotes in 1714. The term "radian" was coined by James Thomson in 1871.',
        commonUse: 'Standard unit in mathematics, physics, and engineering for angular measurements.',
        funFact: 'One radian is the angle where the arc length equals the radius. A full circle is exactly 2π radians!',
        relatedUnits: ['Degrees', 'Gradians', 'Turns']
    },

    // Area
    'Acres': {
        name: 'Acres',
        history: 'Originally the amount of land a yoke of oxen could plow in one day. Standardized in medieval England.',
        commonUse: 'Used in the US, UK, and other countries for measuring land area, especially farms and real estate.',
        funFact: 'An acre is about 90% of an American football field (without the end zones). A football field is 1.32 acres!',
        relatedUnits: ['Hectares', 'Square Meters', 'Square Feet']
    },
    'Hectares': {
        name: 'Hectares',
        history: 'Introduced with the metric system in 1795. "Hect-" means 100, so a hectare is 100 ares (100m × 100m).',
        commonUse: 'Standard unit for land area worldwide, especially for agriculture and forestry.',
        funFact: 'A hectare is about the size of 2.5 American football fields, or roughly 2 soccer fields!',
        relatedUnits: ['Acres', 'Square Meters', 'Square Kilometers']
    },

    // Volume
    'Liters': {
        name: 'Liters',
        history: 'Introduced in France in 1795. Originally defined as the volume of 1 kilogram of water at 4°C.',
        commonUse: 'Used worldwide for beverages, fuel, and liquid measurements.',
        funFact: 'A 2-liter soda bottle was designed to be exactly 2 liters when filled to the brim, but is usually filled to about 1.98 liters!',
        relatedUnits: ['Milliliters', 'Gallons', 'Cubic Meters']
    },
    'Gallons (US)': {
        name: 'Gallons',
        history: 'Derived from medieval English wine measurements. The US gallon (231 cubic inches) differs from the UK gallon (277 cubic inches).',
        commonUse: 'Used in the US for fuel, milk, and other liquids. UK uses imperial gallons.',
        funFact: 'A US gallon is about 3.785 liters, but a UK gallon is 4.546 liters. That\'s why UK cars seem more fuel-efficient!',
        relatedUnits: ['Liters', 'Pints', 'Cubic Meters']
    },

    // Speed
    'Kilometers per hour': {
        name: 'Kilometers per hour',
        history: 'Became standard with the adoption of the metric system and the rise of automobiles in the early 1900s.',
        commonUse: 'Used worldwide for vehicle speeds and speed limits, except in the US and UK.',
        funFact: 'The fastest recorded speed by a human on foot is 44.72 km/h by Usain Bolt!',
        relatedUnits: ['Miles per hour', 'Meters per second', 'Knots']
    },
    'Miles per hour': {
        name: 'Miles per hour',
        history: 'Became common with the rise of railways and automobiles in the 19th century.',
        commonUse: 'Used in the US and UK for vehicle speeds and speed limits.',
        funFact: 'The speed of sound is about 767 mph at sea level. That\'s why we call it "Mach 1"!',
        relatedUnits: ['Kilometers per hour', 'Meters per second', 'Knots']
    },
    'Knots': {
        name: 'Knots',
        history: 'Sailors measured speed by throwing a knotted rope overboard and counting knots that passed in a set time.',
        commonUse: 'Used in maritime and aviation for speed measurements.',
        funFact: 'One knot equals one nautical mile per hour. A nautical mile is based on Earth\'s circumference: 1 minute of latitude!',
        relatedUnits: ['Miles per hour', 'Kilometers per hour', 'Meters per second']
    },

    // Data
    'Bytes': {
        name: 'Bytes',
        history: 'Coined by Werner Buchholz in 1956 at IBM. Originally meant to be a "bite" of data, but spelled differently.',
        commonUse: 'Fundamental unit of digital information storage and transfer.',
        funFact: 'One byte can store one character. This entire description is about 500 bytes!',
        relatedUnits: ['Kilobytes', 'Megabytes', 'Gigabytes', 'Terabytes']
    },
    'Gigabytes': {
        name: 'Gigabytes',
        history: 'Became common in the 1990s with the rise of hard drives and digital media.',
        commonUse: 'Used for file sizes, storage capacity, and data transfer amounts.',
        funFact: 'One gigabyte can store about 230 MP3 songs, or 300 photos, or 1 hour of HD video!',
        relatedUnits: ['Megabytes', 'Terabytes', 'Bytes']
    },
};

// Template presets for quick conversions
export interface ConversionTemplate {
    name: string;
    description: string;
    icon: string;
    conversions: Array<{
        label: string;
        category: string;
        fromUnit: string;
        toUnit: string;
        defaultValue?: string;
    }>;
}

export const CONVERSION_TEMPLATES: ConversionTemplate[] = [
    {
        name: 'Recipe Converter',
        description: 'Convert all cooking measurements',
        icon: '🍳',
        conversions: [
            { label: 'Oven Temperature', category: 'Temperature', fromUnit: 'Fahrenheit', toUnit: 'Celsius', defaultValue: '350' },
            { label: 'Liquid Volume', category: 'Volume', fromUnit: 'Cups (US)', toUnit: 'Milliliters', defaultValue: '1' },
            { label: 'Butter/Sugar', category: 'Weight', fromUnit: 'Ounces', toUnit: 'Grams', defaultValue: '8' },
            { label: 'Flour', category: 'Weight', fromUnit: 'Cups', toUnit: 'Grams', defaultValue: '1' },
        ]
    },
    {
        name: 'Travel Converter',
        description: 'Essential conversions for travelers',
        icon: '✈️',
        conversions: [
            { label: 'Distance', category: 'Length', fromUnit: 'Miles', toUnit: 'Kilometers', defaultValue: '100' },
            { label: 'Speed Limit', category: 'Speed', fromUnit: 'Miles per hour', toUnit: 'Kilometers per hour', defaultValue: '65' },
            { label: 'Temperature', category: 'Temperature', fromUnit: 'Fahrenheit', toUnit: 'Celsius', defaultValue: '75' },
            { label: 'Fuel', category: 'Volume', fromUnit: 'Gallons (US)', toUnit: 'Liters', defaultValue: '10' },
        ]
    },
    {
        name: 'Fitness Converter',
        description: 'Track your fitness metrics',
        icon: '💪',
        conversions: [
            { label: 'Body Weight', category: 'Weight', fromUnit: 'Pounds', toUnit: 'Kilograms', defaultValue: '150' },
            { label: 'Running Distance', category: 'Length', fromUnit: 'Miles', toUnit: 'Kilometers', defaultValue: '5' },
            { label: 'Calories Burned', category: 'Energy', fromUnit: 'Kilocalories', toUnit: 'Joules', defaultValue: '500' },
            { label: 'Height', category: 'Length', fromUnit: 'Feet', toUnit: 'Centimeters', defaultValue: '5.9' },
        ]
    },
    {
        name: 'Construction Converter',
        description: 'Building and construction measurements',
        icon: '🏗️',
        conversions: [
            { label: 'Room Length', category: 'Length', fromUnit: 'Feet', toUnit: 'Meters', defaultValue: '12' },
            { label: 'Floor Area', category: 'Area', fromUnit: 'Square Feet', toUnit: 'Square Meters', defaultValue: '1000' },
            { label: 'Concrete Volume', category: 'Volume', fromUnit: 'Cubic Yards', toUnit: 'Cubic Meters', defaultValue: '5' },
            { label: 'Land Area', category: 'Area', fromUnit: 'Acres', toUnit: 'Hectares', defaultValue: '2' },
        ]
    },
];

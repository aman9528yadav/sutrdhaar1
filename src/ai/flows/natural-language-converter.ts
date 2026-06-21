'use server';
/**
 * @fileOverview An AI agent that performs unit conversions from a natural language query.
 *
 * - convertFromNaturalLanguage - A function that takes a string query and returns a conversion.
 * - NaturalLanguageConversionInputSchema - The input type for the function.
 * - NaturalLanguageConversionOutputSchema - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { CATEGORIES, convert as performConversion } from '@/lib/units';

// Generate a string list of all possible units for the prompt
const allUnits = CATEGORIES.flatMap(category => 
  category.units.map(unit => `${unit.name.toLowerCase()} (${unit.symbol})`)
).join(', ');

const NaturalLanguageConversionInputSchema = z.object({
  query: z.string().describe('The natural language query for unit conversion, e.g., "10km to m".'),
});
export type NaturalLanguageConversionInput = z.infer<typeof NaturalLanguageConversionInputSchema>;

const ParsedConversionSchema = z.object({
    value: z.number().describe('The numerical value to convert.'),
    fromUnit: z.string().describe('The unit to convert from.'),
    toUnit: z.string().describe('The unit to convert to.'),
});

const NaturalLanguageConversionOutputSchema = z.object({
  fromValue: z.number().describe('The original numerical value.'),
  fromUnit: z.string().describe('The original unit.'),
  toValue: z.number().describe('The converted numerical value.'),
  toUnit: z.string().describe('The target unit.'),
  category: z.string().describe('The category of the conversion (e.g., Length, Weight).'),
});
export type NaturalLanguageConversionOutput = z.infer<typeof NaturalLanguageConversionOutputSchema>;

export async function convertFromNaturalLanguage(
  input: NaturalLanguageConversionInput
): Promise<NaturalLanguageConversionOutput | null> {
  const { query } = input;
  if (!query || query.trim().split(' ').length < 3) {
      return null;
  }
  return naturalLanguageConverterFlow(input);
}


const parsingPrompt = ai.definePrompt({
    name: 'parsingPrompt',
    input: { schema: z.object({ query: z.string() }) },
    output: { schema: ParsedConversionSchema },
    prompt: `You are an expert at parsing unit conversion queries. Given the user's query, extract the numerical value, the 'from' unit, and the 'to' unit.
    
    The available units are: ${allUnits}.
    
    Query: {{{query}}}
    
    From the query, identify the value, the source unit, and the target unit. Match the units to the closest available unit from the list provided.
    `,
});


const naturalLanguageConverterFlow = ai.defineFlow(
  {
    name: 'naturalLanguageConverterFlow',
    inputSchema: NaturalLanguageConversionInputSchema,
    outputSchema: z.nullable(NaturalLanguageConversionOutputSchema),
  },
  async ({ query }) => {
    try {
      const { output: parsed } = await parsingPrompt({ query });
      if (!parsed) return null;

      const { value, fromUnit, toUnit } = parsed;

      // Find the category for the given units
      const fromUnitInfo = CATEGORIES.flatMap(c => c.units).find(u => u.name.toLowerCase() === fromUnit.toLowerCase() || u.symbol.toLowerCase() === fromUnit.toLowerCase());
      const toUnitInfo = CATEGORIES.flatMap(c => c.units).find(u => u.name.toLowerCase() === toUnit.toLowerCase() || u.symbol.toLowerCase() === toUnit.toLowerCase());

      if (!fromUnitInfo || !toUnitInfo) return null;
      
      const fromUnitName = fromUnitInfo.name;
      const toUnitName = toUnitInfo.name;

      // Find the category that contains both units
      const category = CATEGORIES.find(c => 
        c.units.some(u => u.name === fromUnitName) && c.units.some(u => u.name === toUnitName)
      );

      if (!category) return null;

      const convertedValue = performConversion(value, fromUnitName, toUnitName, category.name);

      if (convertedValue === null) {
        return null;
      }
      
      const finalResult = Number(convertedValue.toPrecision(5));

      return {
        fromValue: value,
        fromUnit: fromUnitName,
        toValue: finalResult,
        toUnit: toUnitName,
        category: category.name,
      };

    } catch (error) {
      console.error('Error in natural language conversion flow:', error);
      return null;
    }
  }
);

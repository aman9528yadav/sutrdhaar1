'use server';
/**
 * @fileOverview An AI agent that suggests appropriate units for conversion based on user input.
 *
 * - suggestUnits - A function that suggests units based on the input value.
 * - SuggestUnitsInput - The input type for the suggestUnits function.
 * - SuggestUnitsOutput - The return type for the suggestUnits function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestUnitsInputSchema = z.object({
  inputValue: z
    .string()
    .describe('The numerical value entered by the user.'),
  category: z.string().describe('The category of units (e.g., Length, Weight, Temperature).'),
  region: z.string().optional().describe('The region (e.g., International, Local).'),
});
export type SuggestUnitsInput = z.infer<typeof SuggestUnitsInputSchema>;

const SuggestUnitsOutputSchema = z.object({
  fromUnitSuggestions: z.array(z.string()).describe('Suggested "From" units based on the input value.'),
  toUnitSuggestions: z.array(z.string()).describe('Suggested "To" units based on the input value.'),
});
export type SuggestUnitsOutput = z.infer<typeof SuggestUnitsOutputSchema>;

export async function suggestUnits(input: SuggestUnitsInput): Promise<SuggestUnitsOutput> {
  return suggestUnitsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestUnitsPrompt',
  input: {schema: SuggestUnitsInputSchema},
  output: {schema: SuggestUnitsOutputSchema},
  prompt: `You are a unit conversion assistant.  Given the user's input value, the category of units, and the region, suggest appropriate "From" and "To" units for conversion.

Input Value: {{{inputValue}}}
Category: {{{category}}}
Region: {{{region}}}

Consider common units within the specified category and region that are relevant to the input value. For example, if the input value is "10", the category is "Length", and the region is "International", you might suggest "meters" as a "From" unit and "feet" as a "To" unit.

Return the suggestions as arrays of strings for both "From" and "To" units.`,
});

const suggestUnitsFlow = ai.defineFlow(
  {
    name: 'suggestUnitsFlow',
    inputSchema: SuggestUnitsInputSchema,
    outputSchema: SuggestUnitsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

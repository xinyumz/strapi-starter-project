// server/services/grammar-service.ts
import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';

interface GrammarRule {
    sentence: string;
    rules: string[];
}
interface RulesResponse {
    rules: GrammarRule[];
}

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => ({
    async generateRules(text: string, engineChoice: 'stanford' | 'jieba' | 'both' = 'both'): Promise<GrammarRule[]> {
        try {
            const response = await fetch('https://api.pandaist.com/api/v1/rulesgen/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    rule_choice: engineChoice
                })
            });

            if (!response.ok) {
                throw new Error(`Grammar rules generation failed: ${response.statusText}`);
            }

            const data = (await response.json()) as RulesResponse;
            return data.rules;
        } catch (error) {
            console.error('Grammar rules generation error:', error);
            throw error;
        }
    },

    async deleteRule(sentenceIndex: number, ruleIndex: number, rules: GrammarRule[]): Promise<GrammarRule[]> {
        try {
            if (!rules[sentenceIndex]) {
                throw new ApplicationError('Sentence index out of bounds');
            }

            const updatedRules = [...rules];
            const sentenceRules = [...updatedRules[sentenceIndex].rules];

            if (!sentenceRules[ruleIndex]) {
                throw new ApplicationError('Rule index out of bounds');
            }

            sentenceRules.splice(ruleIndex, 1);
            updatedRules[sentenceIndex].rules = sentenceRules;

            return updatedRules;
        } catch (error) {
            console.error('Grammar rule deletion error:', error);
            throw error;
        }
    }
});
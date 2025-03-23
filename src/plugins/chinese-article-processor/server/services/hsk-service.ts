// server/services/hsk-service.ts
import { Strapi } from '@strapi/strapi';

interface HSKResult {
  skillLevel: number;
  skillDistribution: number[];
}
interface HSKResponse {
  skill_data: {
    skill_level: number;
    skill_info: number[];
  };
}

export default ({ strapi }: { strapi: Strapi }) => ({
  async calculateHSK(text: string): Promise<HSKResult> {
    try {
      // First get pinyin analysis
      const pinyinService = strapi.plugin('chinese-article-processor').service('pinyinService');
      const pinyinResult = await pinyinService.generatePinyin(text);

      // Then calculate HSK level using the pinyin result
      const response = await fetch('https://api.pandaist.com/api/v1/hskcalc/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ json: pinyinResult.json })
      });

      if (!response.ok) {
        throw new Error(`HSK calculation failed: ${response.statusText}`);
      }

      const data = (await response.json()) as HSKResponse;
      return {
        skillLevel: data.skill_data.skill_level,
        skillDistribution: data.skill_data.skill_info
      };
    } catch (error) {
      console.error('HSK calculation error:', error);
      throw error;
    }
  }
});
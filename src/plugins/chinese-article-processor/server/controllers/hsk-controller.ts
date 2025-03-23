// server/controllers/hsk-controller.ts
import { Strapi } from '@strapi/strapi';
import { Context } from 'koa';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

interface ExtendedContext extends Context {
  body: any;
  request: Context['request'] & {
    body: {
      text?: string;
    };
  };
}

export default ({ strapi }: { strapi: Strapi }) => ({
  async calculateHSK(ctx: ExtendedContext) {
    try {
      const { text } = ctx.request.body;

      if (!text) {
        return ctx.badRequest('Text content is required');
      }

      const result = await strapi
        .plugin('chinese-article-processor')
        .service('hskService')
        .calculateHSK(text);

      ctx.body = {
        data: {
          skillLevel: result.skillLevel,
          skillDistribution: result.skillDistribution,
          message: `Calculated HSK level: ${result.skillLevel}`,
          success: true
        }
      };
    } catch (error: unknown) {
      if (error instanceof ApplicationError) {
        ctx.throw(400, error.message);
      } else if (error instanceof Error) {
        ctx.throw(500, `HSK calculation failed: ${error.message}`);
      } else {
        ctx.throw(500, 'HSK calculation failed');
      }
    }
  }
});
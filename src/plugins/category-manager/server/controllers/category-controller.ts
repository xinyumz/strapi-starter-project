import { Strapi } from '@strapi/strapi';

export default ({ strapi }: { strapi: Strapi }) => ({
    async find(ctx: any) {
        try {
            const data = await strapi
                .plugin('category-manager')
                .service('categoryService')
                .find(ctx.query);

            ctx.body = { data };
        } catch (err) {
            ctx.throw(500, err);
        }
    },

    async findOne(ctx: any) {
        try {
            const { id } = ctx.params;
            const data = await strapi
                .plugin('category-manager')
                .service('categoryService')
                .findOne(parseInt(id), ctx.query);

            ctx.body = { data };
        } catch (err) {
            ctx.throw(500, err);
        }
    },

    async create(ctx: any) {
        try {
            const data = await strapi
                .plugin('category-manager')
                .service('categoryService')
                .create(ctx.request.body);

            ctx.body = { data };
        } catch (err) {
            ctx.throw(500, err);
        }
    },

    async update(ctx: any) {
        try {
            const { id } = ctx.params;
            const data = await strapi
                .plugin('category-manager')
                .service('categoryService')
                .update(parseInt(id), ctx.request.body);

            ctx.body = { data };
        } catch (err) {
            ctx.throw(500, err);
        }
    },

    async delete(ctx: any) {
        try {
            const { id } = ctx.params;
            const data = await strapi
                .plugin('category-manager')
                .service('categoryService')
                .delete(parseInt(id));

            ctx.body = { data };
        } catch (err) {
            ctx.throw(500, err);
        }
    },

    async findByTaxon(ctx: any) {
        try {
            const { taxonId } = ctx.params;
            const data = await strapi
                .plugin('category-manager')
                .service('categoryService')
                .findByTaxon(parseInt(taxonId), ctx.query);

            ctx.body = { data };
        } catch (err) {
            ctx.throw(500, err);
        }
    }
});
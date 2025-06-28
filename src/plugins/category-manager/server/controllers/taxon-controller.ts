

export default ({ strapi }: any) => ({
    async find(ctx: any) {
        try {
            const data = await strapi
                .plugin('category-manager')
                .service('taxonService')
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
                .service('taxonService')
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
                .service('taxonService')
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
                .service('taxonService')
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
                .service('taxonService')
                .delete(parseInt(id));

            ctx.body = { data };
        } catch (err) {
            ctx.throw(500, err);
        }
    },

    async findWithCategories(ctx: any) {
        try {
            const data = await strapi
                .plugin('category-manager')
                .service('taxonService')
                .findWithCategories(ctx.query);

            ctx.body = { data };
        } catch (err) {
            ctx.throw(500, err);
        }
    }
});
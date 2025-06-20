import { Strapi } from '@strapi/strapi';
import { errors } from '@strapi/utils';

const { ApplicationError } = errors;

export default ({ strapi }: { strapi: Strapi }) => {
    const getEntityService = () => {
        if (!strapi.entityService) {
            throw new ApplicationError('Entity service is not available');
        }
        return strapi.entityService;
    };

    // Helper function to generate URL slug
    const generateSlug = (name: string): string => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
            .substring(0, 50);
    };

    return {
        async find(query: any = {}) {
            try {
                const entityService = getEntityService();
                return await entityService.findMany('plugin::category-manager.taxon' as any, {
                    ...query,
                    sort: ['name:asc'],
                });
            } catch (error) {
                console.error('Error finding taxons:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to find taxons: ${errorMessage}`);
            }
        },

        async findOne(id: number, query: any = {}) {
            try {
                const entityService = getEntityService();
                return await entityService.findOne('plugin::category-manager.taxon' as any, id, query);
            } catch (error) {
                console.error(`Error finding taxon ${id}:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to find taxon: ${errorMessage}`);
            }
        },

        async create(data: any) {
            try {
                const entityService = getEntityService();

                // Auto-generate URL if not provided
                if (!data.url && data.name) {
                    data.url = generateSlug(data.name);
                }

                return await entityService.create('plugin::category-manager.taxon' as any, { data });
            } catch (error) {
                console.error('Error creating taxon:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to create taxon: ${errorMessage}`);
            }
        },

        async update(id: number, data: any) {
            try {
                const entityService = getEntityService();

                // Auto-generate URL if name changed but URL not provided
                if (data.name && !data.url) {
                    data.url = generateSlug(data.name);
                }

                return await entityService.update('plugin::category-manager.taxon' as any, id, { data });
            } catch (error) {
                console.error(`Error updating taxon ${id}:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to update taxon: ${errorMessage}`);
            }
        },

        async delete(id: number) {
            try {
                const entityService = getEntityService();

                // First check if there are categories associated with this taxon
                const categories = await entityService.findMany('plugin::category-manager.category' as any, {
                    filters: { taxon: { id } }
                });

                if (Array.isArray(categories) && categories.length > 0) {
                    // Delete all associated categories first
                    for (const category of categories) {
                        await entityService.delete('plugin::category-manager.category' as any, (category as any).id);
                    }
                    console.log(`Deleted ${categories.length} categories associated with taxon ${id}`);
                }

                // Then delete the taxon
                return await entityService.delete('plugin::category-manager.taxon' as any, id);
            } catch (error) {
                console.error(`Error deleting taxon ${id}:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to delete taxon: ${errorMessage}`);
            }
        },

        async findWithCategories(query: any = {}) {
            try {
                const entityService = getEntityService();
                return await entityService.findMany('plugin::category-manager.taxon' as any, {
                    ...query,
                    populate: {
                        categories: {
                            sort: ['order:asc', 'name:asc']
                        }
                    },
                    sort: ['name:asc'],
                });
            } catch (error) {
                console.error('Error finding taxons with categories:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to find taxons with categories: ${errorMessage}`);
            }
        }
    };
};
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
            .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with single
            .trim()
            .substring(0, 50); // Limit length
    };

    return {
        async find(query: any = {}) {
            try {
                const entityService = getEntityService();
                return await entityService.findMany('plugin::category-manager.category' as any, {
                    ...query,
                    sort: ['order:asc', 'name:asc'],
                    populate: {
                        taxon: true
                    }
                });
            } catch (error) {
                console.error('Error finding categories:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to find categories: ${errorMessage}`);
            }
        },

        async findOne(id: number, query: any = {}) {
            try {
                const entityService = getEntityService();
                return await entityService.findOne('plugin::category-manager.category' as any, id, {
                    ...query,
                    populate: {
                        taxon: true
                    }
                });
            } catch (error) {
                console.error(`Error finding category ${id}:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to find category: ${errorMessage}`);
            }
        },

        async create(data: any) {
            try {
                const entityService = getEntityService();

                // Auto-generate URL if not provided
                if (!data.url && data.name) {
                    data.url = generateSlug(data.name);
                }

                return await entityService.create('plugin::category-manager.category' as any, { data });
            } catch (error) {
                console.error('Error creating category:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to create category: ${errorMessage}`);
            }
        },

        async update(id: number, data: any) {
            try {
                const entityService = getEntityService();

                // Auto-generate URL if name changed but URL not provided
                if (data.name && !data.url) {
                    data.url = generateSlug(data.name);
                }

                return await entityService.update('plugin::category-manager.category' as any, id, { data });
            } catch (error) {
                console.error(`Error updating category ${id}:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to update category: ${errorMessage}`);
            }
        },

        async delete(id: number) {
            try {
                const entityService = getEntityService();
                return await entityService.delete('plugin::category-manager.category' as any, id);
            } catch (error) {
                console.error(`Error deleting category ${id}:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to delete category: ${errorMessage}`);
            }
        },

        async findByTaxon(taxonId: number, query: any = {}) {
            try {
                const entityService = getEntityService();
                return await entityService.findMany('plugin::category-manager.category' as any, {
                    ...query,
                    filters: {
                        taxon: { id: taxonId }
                    },
                    sort: ['order:asc', 'name:asc'],
                    populate: {
                        taxon: true
                    }
                });
            } catch (error) {
                console.error(`Error finding categories for taxon ${taxonId}:`, error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new ApplicationError(`Failed to find categories for taxon: ${errorMessage}`);
            }
        }
    };
};
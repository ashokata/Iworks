import { getPrismaClient } from './prisma.service';
import { PricebookIndustry, PricebookCategory, PricebookService as PricebookServiceModel, PricebookServiceMaterial } from '@prisma/client';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface PricebookCategoryWithRelations extends PricebookCategory {
  children?: PricebookCategory[];
  services?: PricebookServiceModel[];
}

export interface PricebookServiceWithMaterials extends PricebookServiceModel {
  materials?: PricebookServiceMaterial[];
  category?: PricebookCategory;
}

export interface GetCategoriesParams {
  industryId: string;
  page?: number;
  pageSize?: number;
  sortColumn?: 'orderIndex' | 'name' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
  includeServices?: boolean;
}

export interface GetServicesParams {
  categoryId: string;
  page?: number;
  pageSize?: number;
  sortColumn?: 'orderIndex' | 'name' | 'unitPrice' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
  expand?: ('materials' | 'category')[];
}

export interface CreateCategoryInput {
  industryId: string;
  parentId?: string;
  name: string;
  description?: string;
  orderIndex?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  orderIndex?: number;
  isActive?: boolean;
}

export interface CreateServiceInput {
  categoryId: string;
  name: string;
  description?: string;
  sku?: string;
  unitPrice: number;
  unitCost?: number;
  estimatedDuration?: number;
  orderIndex?: number;
  materials?: CreateServiceMaterialInput[];
}

export interface CreateServiceMaterialInput {
  name: string;
  description?: string;
  quantity: number;
  unitCost: number;
  isOptional?: boolean;
}

export interface UpdateServiceInput {
  name?: string;
  description?: string;
  sku?: string;
  unitPrice?: number;
  unitCost?: number;
  estimatedDuration?: number;
  orderIndex?: number;
  isActive?: boolean;
  qboItemId?: string;
  qboSyncedAt?: Date;
}

export interface ImportPricebookInput {
  tenantId: string;
  industrySlug: string;
  includeCategories?: string[]; // Category IDs to import (optional, imports all if not specified)
}

// ============================================================================
// Service Class
// ============================================================================

class PricebookPostgresService {
  // ==========================================================================
  // INDUSTRIES
  // ==========================================================================

  /**
   * Get all active pricebook industries
   */
  async getIndustries(): Promise<PricebookIndustry[]> {
    const prisma = getPrismaClient();

    const industries = await prisma.pricebookIndustry.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    console.log('[PG-Pricebook] Retrieved industries:', industries.length);
    return industries;
  }

  /**
   * Get a specific industry by slug
   */
  async getIndustry(slug: string): Promise<PricebookIndustry | null> {
    const prisma = getPrismaClient();

    const industry = await prisma.pricebookIndustry.findUnique({
      where: { slug },
    });

    console.log('[PG-Pricebook] Retrieved industry:', slug, industry ? 'found' : 'not found');
    return industry;
  }

  // ==========================================================================
  // CATEGORIES
  // ==========================================================================

  /**
   * Get categories for an industry with pagination and sorting
   */
  async getCategories(params: GetCategoriesParams): Promise<{
    data: PricebookCategoryWithRelations[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const prisma = getPrismaClient();
    const {
      industryId,
      page = 1,
      pageSize = 100,
      sortColumn = 'orderIndex',
      sortDirection = 'asc',
      includeServices = false,
    } = params;

    const skip = (page - 1) * pageSize;

    // Build orderBy clause
    const orderBy: any = { [sortColumn]: sortDirection };

    // Get total count
    const total = await prisma.pricebookCategory.count({
      where: {
        pricebookIndustryId: industryId,
        isActive: true,
      },
    });

    // Get categories
    const categories = await prisma.pricebookCategory.findMany({
      where: {
        pricebookIndustryId: industryId,
        isActive: true,
      },
      include: {
        children: true,
        services: includeServices ? {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        } : false,
      },
      orderBy,
      skip,
      take: pageSize,
    });

    console.log('[PG-Pricebook] Retrieved categories:', categories.length, 'of', total);
    return {
      data: categories,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get a single category by ID
   */
  async getCategory(id: string, includeServices: boolean = false): Promise<PricebookCategoryWithRelations | null> {
    const prisma = getPrismaClient();

    const category = await prisma.pricebookCategory.findUnique({
      where: { id },
      include: {
        children: true,
        services: includeServices ? {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        } : false,
      },
    });

    console.log('[PG-Pricebook] Retrieved category:', id, category ? 'found' : 'not found');
    return category;
  }

  /**
   * Create a new category
   */
  async createCategory(input: CreateCategoryInput): Promise<PricebookCategory> {
    const prisma = getPrismaClient();

    // Get the next orderIndex if not provided
    let orderIndex = input.orderIndex;
    if (orderIndex === undefined) {
      const maxOrder = await prisma.pricebookCategory.aggregate({
        where: { pricebookIndustryId: input.industryId },
        _max: { orderIndex: true },
      });
      orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;
    }

    const category = await prisma.pricebookCategory.create({
      data: {
        pricebookIndustryId: input.industryId,
        parentId: input.parentId,
        name: input.name,
        description: input.description,
        orderIndex,
      },
    });

    console.log('[PG-Pricebook] Created category:', category.id, category.name);
    return category;
  }

  /**
   * Update a category
   */
  async updateCategory(id: string, input: UpdateCategoryInput): Promise<PricebookCategory> {
    const prisma = getPrismaClient();

    const category = await prisma.pricebookCategory.update({
      where: { id },
      data: input,
    });

    console.log('[PG-Pricebook] Updated category:', id);
    return category;
  }

  /**
   * Delete a category (soft delete by setting isActive to false)
   */
  async deleteCategory(id: string): Promise<void> {
    const prisma = getPrismaClient();

    await prisma.pricebookCategory.update({
      where: { id },
      data: { isActive: false },
    });

    console.log('[PG-Pricebook] Deleted category:', id);
  }

  /**
   * Reorder categories within an industry
   */
  async reorderCategories(industryId: string, categoryIds: string[]): Promise<void> {
    const prisma = getPrismaClient();

    // Update each category's orderIndex based on position in array
    await prisma.$transaction(
      categoryIds.map((categoryId, index) =>
        prisma.pricebookCategory.update({
          where: { id: categoryId },
          data: { orderIndex: index },
        })
      )
    );

    console.log('[PG-Pricebook] Reordered categories:', categoryIds.length);
  }

  // ==========================================================================
  // SERVICES
  // ==========================================================================

  /**
   * Get services for a category with pagination, sorting, and expansion
   */
  async getServices(params: GetServicesParams): Promise<{
    data: PricebookServiceWithMaterials[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const prisma = getPrismaClient();
    const {
      categoryId,
      page = 1,
      pageSize = 100,
      sortColumn = 'orderIndex',
      sortDirection = 'asc',
      expand = [],
    } = params;

    const skip = (page - 1) * pageSize;

    // Build orderBy clause
    const orderBy: any = { [sortColumn]: sortDirection };

    // Build include clause based on expand parameter
    const include: any = {};
    if (expand.includes('materials')) {
      include.materials = {
        where: { isDiscarded: false },
        orderBy: { createdAt: 'asc' },
      };
    }
    if (expand.includes('category')) {
      include.category = true;
    }

    // Get total count
    const total = await prisma.pricebookService.count({
      where: {
        pricebookCategoryId: categoryId,
        isActive: true,
      },
    });

    // Get services
    const services = await prisma.pricebookService.findMany({
      where: {
        pricebookCategoryId: categoryId,
        isActive: true,
      },
      include,
      orderBy,
      skip,
      take: pageSize,
    });

    console.log('[PG-Pricebook] Retrieved services:', services.length, 'of', total);
    return {
      data: services,
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get a single service by ID with optional expansions
   */
  async getService(id: string, expand: ('materials' | 'category')[] = []): Promise<PricebookServiceWithMaterials | null> {
    const prisma = getPrismaClient();

    const include: any = {};
    if (expand.includes('materials')) {
      include.materials = {
        where: { isDiscarded: false },
        orderBy: { createdAt: 'asc' },
      };
    }
    if (expand.includes('category')) {
      include.category = true;
    }

    const service = await prisma.pricebookService.findUnique({
      where: { id },
      include,
    });

    console.log('[PG-Pricebook] Retrieved service:', id, service ? 'found' : 'not found');
    return service;
  }

  /**
   * Create a new service with optional materials
   */
  async createService(input: CreateServiceInput): Promise<PricebookServiceWithMaterials> {
    const prisma = getPrismaClient();

    // Get the next orderIndex if not provided
    let orderIndex = input.orderIndex;
    if (orderIndex === undefined) {
      const maxOrder = await prisma.pricebookService.aggregate({
        where: { pricebookCategoryId: input.categoryId },
        _max: { orderIndex: true },
      });
      orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;
    }

    const service = await prisma.pricebookService.create({
      data: {
        pricebookCategoryId: input.categoryId,
        name: input.name,
        description: input.description,
        sku: input.sku,
        unitPrice: input.unitPrice,
        unitCost: input.unitCost ?? 0,
        estimatedDuration: input.estimatedDuration ?? 60,
        orderIndex,
        materials: input.materials ? {
          create: input.materials,
        } : undefined,
      },
      include: {
        materials: true,
      },
    });

    console.log('[PG-Pricebook] Created service:', service.id, service.name);
    return service;
  }

  /**
   * Update a service
   */
  async updateService(id: string, input: UpdateServiceInput): Promise<PricebookServiceModel> {
    const prisma = getPrismaClient();

    const service = await prisma.pricebookService.update({
      where: { id },
      data: input,
    });

    console.log('[PG-Pricebook] Updated service:', id);
    return service;
  }

  /**
   * Delete a service (soft delete)
   */
  async deleteService(id: string): Promise<void> {
    const prisma = getPrismaClient();

    await prisma.pricebookService.update({
      where: { id },
      data: { isActive: false },
    });

    console.log('[PG-Pricebook] Deleted service:', id);
  }

  /**
   * Reorder services within a category
   */
  async reorderServices(categoryId: string, serviceIds: string[]): Promise<void> {
    const prisma = getPrismaClient();

    await prisma.$transaction(
      serviceIds.map((serviceId, index) =>
        prisma.pricebookService.update({
          where: { id: serviceId },
          data: { orderIndex: index },
        })
      )
    );

    console.log('[PG-Pricebook] Reordered services:', serviceIds.length);
  }

  // ==========================================================================
  // SERVICE MATERIALS
  // ==========================================================================

  /**
   * Add a material to a service
   */
  async addServiceMaterial(serviceId: string, input: CreateServiceMaterialInput): Promise<PricebookServiceMaterial> {
    const prisma = getPrismaClient();

    const material = await prisma.pricebookServiceMaterial.create({
      data: {
        pricebookServiceId: serviceId,
        ...input,
      },
    });

    console.log('[PG-Pricebook] Added service material:', material.id);
    return material;
  }

  /**
   * Update a service material
   */
  async updateServiceMaterial(id: string, input: Partial<CreateServiceMaterialInput>): Promise<PricebookServiceMaterial> {
    const prisma = getPrismaClient();

    const material = await prisma.pricebookServiceMaterial.update({
      where: { id },
      data: input,
    });

    console.log('[PG-Pricebook] Updated service material:', id);
    return material;
  }

  /**
   * Remove a service material (soft delete)
   */
  async removeServiceMaterial(id: string): Promise<void> {
    const prisma = getPrismaClient();

    await prisma.pricebookServiceMaterial.update({
      where: { id },
      data: { isDiscarded: true },
    });

    console.log('[PG-Pricebook] Removed service material:', id);
  }

  // ==========================================================================
  // IMPORT TO TENANT
  // ==========================================================================

  /**
   * Import pricebook industry catalog to tenant's catalog
   * This creates tenant-specific copies of categories and services
   */
  async importPricebook(input: ImportPricebookInput): Promise<{
    categoriesImported: number;
    servicesImported: number;
    materialsImported: number;
  }> {
    const prisma = getPrismaClient();
    const { tenantId, industrySlug, includeCategories } = input;

    // Get the industry
    const industry = await this.getIndustry(industrySlug);
    if (!industry) {
      throw new Error(`Industry not found: ${industrySlug}`);
    }

    // Get categories to import
    const whereClause: any = {
      pricebookIndustryId: industry.id,
      isActive: true,
    };
    if (includeCategories && includeCategories.length > 0) {
      whereClause.id = { in: includeCategories };
    }

    const pricebookCategories = await prisma.pricebookCategory.findMany({
      where: whereClause,
      include: {
        services: {
          where: { isActive: true },
          include: {
            materials: {
              where: { isDiscarded: false },
            },
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    let categoriesImported = 0;
    let servicesImported = 0;
    let materialsImported = 0;

    // Import in a transaction
    await prisma.$transaction(async (tx) => {
      for (const pricebookCategory of pricebookCategories) {
        // Create tenant category
        const tenantCategory = await tx.category.create({
          data: {
            tenantId,
            name: pricebookCategory.name,
            description: pricebookCategory.description,
            type: 'SERVICE',
            orderIndex: pricebookCategory.orderIndex,
          },
        });
        categoriesImported++;

        // Import services from this category
        for (const pricebookService of pricebookCategory.services) {
          const tenantService = await tx.service.create({
            data: {
              tenantId,
              categoryId: tenantCategory.id,
              name: pricebookService.name,
              description: pricebookService.description,
              sku: pricebookService.sku,
              unitPrice: pricebookService.unitPrice,
              unitCost: pricebookService.unitCost,
              estimatedDuration: pricebookService.estimatedDuration,
              orderIndex: pricebookService.orderIndex,
              isTaxable: true,
              isOnlineBookable: true,
            },
          });
          servicesImported++;

          // Import materials for this service as tenant materials
          for (const pricebookMaterial of pricebookService.materials) {
            await tx.material.create({
              data: {
                tenantId,
                categoryId: tenantCategory.id,
                name: pricebookMaterial.name,
                description: pricebookMaterial.description,
                unitCost: pricebookMaterial.unitCost,
                markupPercent: 50, // Default markup
                isTaxable: true,
                qtyOnHand: 0,
                reorderPoint: 0,
              },
            });
            materialsImported++;
          }
        }
      }
    });

    console.log('[PG-Pricebook] Imported pricebook:', {
      tenantId,
      industrySlug,
      categoriesImported,
      servicesImported,
      materialsImported,
    });

    return { categoriesImported, servicesImported, materialsImported };
  }
}

// Export singleton instance
export const pricebookService = new PricebookPostgresService();
export default pricebookService;

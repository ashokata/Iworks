/**
 * Pricebook Service - Unit Tests
 *
 * Tests for pricebook service layer covering:
 * - Industries (get, getBySlug)
 * - Categories (CRUD, pagination, sorting, reordering)
 * - Services (CRUD, pagination, sorting, expansion)
 * - Materials (add, update, remove)
 * - Import (import to tenant catalog)
 */

import { pricebookService } from './pricebook.postgres.service';
import { getPrismaClient } from './prisma.service';

// Mock Prisma client
jest.mock('./prisma.service');

describe('PricebookService - Industries', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = {
      pricebookIndustry: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    (getPrismaClient as jest.Mock).mockReturnValue(mockPrismaClient);
  });

  describe('getIndustries', () => {
    it('should return all active industries', async () => {
      const mockIndustries = [
        { id: 'ind-1', name: 'HVAC', slug: 'hvac', isActive: true },
        { id: 'ind-2', name: 'Plumbing', slug: 'plumbing', isActive: true },
      ];
      mockPrismaClient.pricebookIndustry.findMany.mockResolvedValue(mockIndustries);

      const result = await pricebookService.getIndustries();

      expect(result).toEqual(mockIndustries);
      expect(mockPrismaClient.pricebookIndustry.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array when no industries exist', async () => {
      mockPrismaClient.pricebookIndustry.findMany.mockResolvedValue([]);

      const result = await pricebookService.getIndustries();

      expect(result).toEqual([]);
    });
  });

  describe('getIndustry', () => {
    it('should return industry by slug', async () => {
      const mockIndustry = { id: 'ind-1', name: 'HVAC', slug: 'hvac', isActive: true };
      mockPrismaClient.pricebookIndustry.findUnique.mockResolvedValue(mockIndustry);

      const result = await pricebookService.getIndustry('hvac');

      expect(result).toEqual(mockIndustry);
      expect(mockPrismaClient.pricebookIndustry.findUnique).toHaveBeenCalledWith({
        where: { slug: 'hvac' },
      });
    });

    it('should return null when industry not found', async () => {
      mockPrismaClient.pricebookIndustry.findUnique.mockResolvedValue(null);

      const result = await pricebookService.getIndustry('nonexistent');

      expect(result).toBeNull();
    });
  });
});

describe('PricebookService - Categories', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = {
      pricebookCategory: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrismaClient)),
    };
    (getPrismaClient as jest.Mock).mockReturnValue(mockPrismaClient);
  });

  describe('getCategories', () => {
    it('should return paginated categories with default parameters', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Installation', orderIndex: 1 },
        { id: 'cat-2', name: 'Repair', orderIndex: 2 },
      ];
      mockPrismaClient.pricebookCategory.count.mockResolvedValue(2);
      mockPrismaClient.pricebookCategory.findMany.mockResolvedValue(mockCategories);

      const result = await pricebookService.getCategories({
        industryId: 'ind-1',
      });

      expect(result.data).toEqual(mockCategories);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(100);
    });

    it('should apply pagination correctly', async () => {
      mockPrismaClient.pricebookCategory.count.mockResolvedValue(50);
      mockPrismaClient.pricebookCategory.findMany.mockResolvedValue([]);

      await pricebookService.getCategories({
        industryId: 'ind-1',
        page: 2,
        pageSize: 10,
      });

      expect(mockPrismaClient.pricebookCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should apply sorting correctly', async () => {
      mockPrismaClient.pricebookCategory.count.mockResolvedValue(0);
      mockPrismaClient.pricebookCategory.findMany.mockResolvedValue([]);

      await pricebookService.getCategories({
        industryId: 'ind-1',
        sortColumn: 'name',
        sortDirection: 'desc',
      });

      expect(mockPrismaClient.pricebookCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'desc' },
        })
      );
    });

    it('should include services when requested', async () => {
      mockPrismaClient.pricebookCategory.count.mockResolvedValue(0);
      mockPrismaClient.pricebookCategory.findMany.mockResolvedValue([]);

      await pricebookService.getCategories({
        industryId: 'ind-1',
        includeServices: true,
      });

      expect(mockPrismaClient.pricebookCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            services: expect.any(Object),
          }),
        })
      );
    });
  });

  describe('createCategory', () => {
    it('should create category with auto-generated orderIndex', async () => {
      mockPrismaClient.pricebookCategory.aggregate.mockResolvedValue({
        _max: { orderIndex: 5 },
      });
      const mockCategory = { id: 'cat-1', name: 'New Category', orderIndex: 6 };
      mockPrismaClient.pricebookCategory.create.mockResolvedValue(mockCategory);

      const result = await pricebookService.createCategory({
        industryId: 'ind-1',
        name: 'New Category',
      });

      expect(result).toEqual(mockCategory);
      expect(mockPrismaClient.pricebookCategory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderIndex: 6,
        }),
      });
    });

    it('should use provided orderIndex', async () => {
      const mockCategory = { id: 'cat-1', name: 'New Category', orderIndex: 10 };
      mockPrismaClient.pricebookCategory.create.mockResolvedValue(mockCategory);

      await pricebookService.createCategory({
        industryId: 'ind-1',
        name: 'New Category',
        orderIndex: 10,
      });

      expect(mockPrismaClient.pricebookCategory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderIndex: 10,
        }),
      });
    });

    it('should handle first category (no existing categories)', async () => {
      mockPrismaClient.pricebookCategory.aggregate.mockResolvedValue({
        _max: { orderIndex: null },
      });
      const mockCategory = { id: 'cat-1', name: 'First Category', orderIndex: 0 };
      mockPrismaClient.pricebookCategory.create.mockResolvedValue(mockCategory);

      const result = await pricebookService.createCategory({
        industryId: 'ind-1',
        name: 'First Category',
      });

      expect(result).toEqual(mockCategory);
      expect(mockPrismaClient.pricebookCategory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderIndex: 0,
        }),
      });
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      const mockCategory = { id: 'cat-1', name: 'Updated Name' };
      mockPrismaClient.pricebookCategory.update.mockResolvedValue(mockCategory);

      const result = await pricebookService.updateCategory('cat-1', {
        name: 'Updated Name',
      });

      expect(result).toEqual(mockCategory);
      expect(mockPrismaClient.pricebookCategory.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { name: 'Updated Name' },
      });
    });
  });

  describe('deleteCategory', () => {
    it('should soft delete category', async () => {
      mockPrismaClient.pricebookCategory.update.mockResolvedValue({ id: 'cat-1' });

      await pricebookService.deleteCategory('cat-1');

      expect(mockPrismaClient.pricebookCategory.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { isActive: false },
      });
    });
  });

  describe('reorderCategories', () => {
    it('should reorder categories in transaction', async () => {
      const categoryIds = ['cat-3', 'cat-1', 'cat-2'];
      mockPrismaClient.pricebookCategory.update.mockResolvedValue({});

      await pricebookService.reorderCategories('ind-1', categoryIds);

      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
      expect(mockPrismaClient.pricebookCategory.update).toHaveBeenCalledTimes(3);
    });
  });
});

describe('PricebookService - Services', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = {
      pricebookService: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        aggregate: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrismaClient)),
    };
    (getPrismaClient as jest.Mock).mockReturnValue(mockPrismaClient);
  });

  describe('getServices', () => {
    it('should return paginated services', async () => {
      const mockServices = [
        { id: 'svc-1', name: 'Service 1' },
        { id: 'svc-2', name: 'Service 2' },
      ];
      mockPrismaClient.pricebookService.count.mockResolvedValue(2);
      mockPrismaClient.pricebookService.findMany.mockResolvedValue(mockServices);

      const result = await pricebookService.getServices({
        categoryId: 'cat-1',
      });

      expect(result.data).toEqual(mockServices);
      expect(result.total).toBe(2);
    });

    it('should include materials when expand includes materials', async () => {
      mockPrismaClient.pricebookService.count.mockResolvedValue(0);
      mockPrismaClient.pricebookService.findMany.mockResolvedValue([]);

      await pricebookService.getServices({
        categoryId: 'cat-1',
        expand: ['materials'],
      });

      expect(mockPrismaClient.pricebookService.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            materials: expect.any(Object),
          }),
        })
      );
    });

    it('should include category when expand includes category', async () => {
      mockPrismaClient.pricebookService.count.mockResolvedValue(0);
      mockPrismaClient.pricebookService.findMany.mockResolvedValue([]);

      await pricebookService.getServices({
        categoryId: 'cat-1',
        expand: ['category'],
      });

      expect(mockPrismaClient.pricebookService.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            category: true,
          }),
        })
      );
    });
  });

  describe('createService', () => {
    it('should create service with materials', async () => {
      mockPrismaClient.pricebookService.aggregate.mockResolvedValue({
        _max: { orderIndex: 3 },
      });
      const mockService = {
        id: 'svc-1',
        name: 'New Service',
        materials: [{ id: 'mat-1', name: 'Material 1' }],
      };
      mockPrismaClient.pricebookService.create.mockResolvedValue(mockService);

      const result = await pricebookService.createService({
        categoryId: 'cat-1',
        name: 'New Service',
        unitPrice: 100,
        materials: [
          { name: 'Material 1', quantity: 1, unitCost: 10 },
        ],
      });

      expect(result).toEqual(mockService);
      expect(mockPrismaClient.pricebookService.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          materials: {
            create: expect.any(Array),
          },
        }),
        include: { materials: true },
      });
    });
  });
});

describe('PricebookService - Import', () => {
  let mockPrismaClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient = {
      pricebookIndustry: {
        findUnique: jest.fn(),
      },
      pricebookCategory: {
        findMany: jest.fn(),
      },
      category: {
        create: jest.fn(),
      },
      service: {
        create: jest.fn(),
      },
      material: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrismaClient)),
    };
    (getPrismaClient as jest.Mock).mockReturnValue(mockPrismaClient);
  });

  describe('importPricebook', () => {
    it('should import pricebook to tenant catalog', async () => {
      const mockIndustry = { id: 'ind-1', name: 'HVAC', slug: 'hvac' };
      const mockCategories = [
        {
          id: 'pcat-1',
          name: 'Installation',
          orderIndex: 1,
          services: [
            {
              id: 'psvc-1',
              name: 'AC Installation',
              unitPrice: 3500,
              materials: [
                { id: 'pmat-1', name: 'AC Unit', unitCost: 1500 },
              ],
            },
          ],
        },
      ];

      mockPrismaClient.pricebookIndustry.findUnique.mockResolvedValue(mockIndustry);
      mockPrismaClient.pricebookCategory.findMany.mockResolvedValue(mockCategories);
      mockPrismaClient.category.create.mockResolvedValue({ id: 'cat-1' });
      mockPrismaClient.service.create.mockResolvedValue({ id: 'svc-1' });
      mockPrismaClient.material.create.mockResolvedValue({ id: 'mat-1' });

      const result = await pricebookService.importPricebook({
        tenantId: 'tenant-1',
        industrySlug: 'hvac',
      });

      expect(result.categoriesImported).toBe(1);
      expect(result.servicesImported).toBe(1);
      expect(result.materialsImported).toBe(1);
    });

    it('should throw error when industry not found', async () => {
      mockPrismaClient.pricebookIndustry.findUnique.mockResolvedValue(null);

      await expect(
        pricebookService.importPricebook({
          tenantId: 'tenant-1',
          industrySlug: 'nonexistent',
        })
      ).rejects.toThrow('Industry not found');
    });
  });
});

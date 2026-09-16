import { Charity, CharitySelection, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export interface ListCharitiesOptions {
  search?: string;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface SetCharitySelectionInput {
  charityId: string;
  contributionPercentage: number;
}

export interface CreateCharityInput {
  name: string;
  slug?: string;
  description: string;
  imageUrl?: string | null;
  websiteUrl?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface UpdateCharityInput {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string | null;
  websiteUrl?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
}

export class CharityService {
  /**
   * Generates a URL-friendly slug from string.
   */
  private static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Lists charities with search, active, and featured filters.
   */
  static async listCharities(options: ListCharitiesOptions = {}): Promise<Charity[]> {
    const { search, isFeatured, isActive = true } = options;

    const where: Prisma.CharityWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (search && search.trim().length > 0) {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    return await prisma.charity.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    });
  }

  /**
   * Retrieves a single charity by ID.
   */
  static async getCharityById(id: string): Promise<Charity | null> {
    return await prisma.charity.findUnique({
      where: { id },
    });
  }

  /**
   * Retrieves a single charity by slug.
   */
  static async getCharityBySlug(slug: string): Promise<Charity | null> {
    return await prisma.charity.findUnique({
      where: { slug },
    });
  }

  /**
   * Retrieves user's active charity selection.
   */
  static async getUserCharitySelection(
    userId: string
  ): Promise<(CharitySelection & { charity: Charity }) | null> {
    return await prisma.charitySelection.findUnique({
      where: { userId },
      include: { charity: true },
    });
  }

  /**
   * Sets or updates a user's charity selection and contribution percentage.
   */
  static async setUserCharitySelection(
    userId: string,
    input: SetCharitySelectionInput
  ): Promise<CharitySelection & { charity: Charity }> {
    const charity = await prisma.charity.findUnique({
      where: { id: input.charityId },
    });

    if (!charity || !charity.isActive) {
      throw new Error("Target charity does not exist or is inactive");
    }

    if (
      typeof input.contributionPercentage !== "number" ||
      input.contributionPercentage < 10 ||
      !Number.isInteger(input.contributionPercentage)
    ) {
      throw new Error("Contribution percentage must be an integer of at least 10%");
    }

    return await prisma.charitySelection.upsert({
      where: { userId },
      create: {
        userId,
        charityId: input.charityId,
        contributionPercentage: input.contributionPercentage,
      },
      update: {
        charityId: input.charityId,
        contributionPercentage: input.contributionPercentage,
      },
      include: { charity: true },
    });
  }

  /**
   * Admin function: Creates a new charity.
   */
  static async createCharity(input: CreateCharityInput): Promise<Charity> {
    const slug = input.slug ? this.slugify(input.slug) : this.slugify(input.name);

    const existingSlug = await prisma.charity.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new Error("A charity with this name or slug already exists");
    }

    return await prisma.charity.create({
      data: {
        name: input.name,
        slug,
        description: input.description,
        imageUrl: input.imageUrl,
        websiteUrl: input.websiteUrl,
        isFeatured: input.isFeatured ?? false,
        isActive: input.isActive ?? true,
      },
    });
  }

  /**
   * Admin function: Updates an existing charity.
   */
  static async updateCharity(id: string, input: UpdateCharityInput): Promise<Charity> {
    const existingCharity = await prisma.charity.findUnique({
      where: { id },
    });

    if (!existingCharity) {
      throw new Error("Charity not found");
    }

    let slug = existingCharity.slug;
    if (input.slug) {
      slug = this.slugify(input.slug);
    } else if (input.name && input.name !== existingCharity.name) {
      slug = this.slugify(input.name);
    }

    if (slug !== existingCharity.slug) {
      const duplicate = await prisma.charity.findFirst({
        where: { slug, id: { not: id } },
      });
      if (duplicate) {
        throw new Error("A charity with this slug already exists");
      }
    }

    return await prisma.charity.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        slug,
        ...(input.description !== undefined && { description: input.description }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
        ...(input.websiteUrl !== undefined && { websiteUrl: input.websiteUrl }),
        ...(input.isFeatured !== undefined && { isFeatured: input.isFeatured }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
  }

  /**
   * Admin function: Deletes or soft-deletes a charity.
   * If user selections exist, soft-deactivates (isActive = false) to preserve data integrity.
   */
  static async deleteCharity(id: string): Promise<{ deleted: boolean; softDeleted: boolean }> {
    const charity = await prisma.charity.findUnique({
      where: { id },
    });

    if (!charity) {
      throw new Error("Charity not found");
    }

    const selectionsCount = await prisma.charitySelection.count({
      where: { charityId: id },
    });

    if (selectionsCount > 0) {
      await prisma.charity.update({
        where: { id },
        data: { isActive: false },
      });
      return { deleted: false, softDeleted: true };
    } else {
      await prisma.charity.delete({
        where: { id },
      });
      return { deleted: true, softDeleted: false };
    }
  }
}

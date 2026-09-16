import { Request, Response } from "express";
import { CharityService } from "../services/charity.service.js";
import {
  createCharitySchema,
  setCharitySelectionSchema,
  updateCharitySchema,
} from "../validators/charity.validator.js";

export async function getCharities(req: Request, res: Response): Promise<void> {
  const { search, featured } = req.query;

  const isFeatured =
    featured === "true" ? true : featured === "false" ? false : undefined;

  const charities = await CharityService.listCharities({
    search: typeof search === "string" ? search : undefined,
    isFeatured,
    isActive: true,
  });

  res.status(200).json({
    success: true,
    data: { charities },
  });
}

export async function getCharityById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  let charity = await CharityService.getCharityById(id);
  if (!charity) {
    charity = await CharityService.getCharityBySlug(id);
  }

  if (!charity || !charity.isActive) {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Charity not found",
      },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: { charity },
  });
}

export async function getMyCharity(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const selection = await CharityService.getUserCharitySelection(user.id);

  res.status(200).json({
    success: true,
    data: {
      selection: selection
        ? {
            id: selection.id,
            contributionPercentage: selection.contributionPercentage,
            charity: selection.charity,
          }
        : null,
    },
  });
}

export async function updateMyCharity(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const parseResult = setCharitySelectionSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid charity selection payload",
        details: parseResult.error.format(),
      },
    });
    return;
  }

  try {
    const selection = await CharityService.setUserCharitySelection(
      user.id,
      parseResult.data
    );

    res.status(200).json({
      success: true,
      data: {
        selection: {
          id: selection.id,
          contributionPercentage: selection.contributionPercentage,
          charity: selection.charity,
        },
      },
    });
  } catch (err: unknown) {
    res.status(400).json({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: err instanceof Error ? err.message : "Failed to update charity selection",
      },
    });
  }
}

// Admin Charity Management Controllers
export async function adminCreateCharity(req: Request, res: Response): Promise<void> {
  const parseResult = createCharitySchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid charity creation payload",
        details: parseResult.error.format(),
      },
    });
    return;
  }

  try {
    const charity = await CharityService.createCharity(parseResult.data);
    res.status(201).json({
      success: true,
      data: { charity },
    });
  } catch (err: unknown) {
    res.status(400).json({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: err instanceof Error ? err.message : "Failed to create charity",
      },
    });
  }
}

export async function adminUpdateCharity(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parseResult = updateCharitySchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid charity update payload",
        details: parseResult.error.format(),
      },
    });
    return;
  }

  try {
    const charity = await CharityService.updateCharity(id, parseResult.data);
    res.status(200).json({
      success: true,
      data: { charity },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update charity";
    const isNotFound = message.includes("not found");
    res.status(isNotFound ? 404 : 400).json({
      success: false,
      error: {
        code: isNotFound ? "NOT_FOUND" : "BAD_REQUEST",
        message,
      },
    });
  }
}

export async function adminDeleteCharity(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  try {
    const result = await CharityService.deleteCharity(id);
    res.status(200).json({
      success: true,
      data: {
        message: result.softDeleted
          ? "Charity deactivated (soft deleted) because user selections exist"
          : "Charity deleted successfully",
        softDeleted: result.softDeleted,
      },
    });
  } catch (err: unknown) {
    res.status(404).json({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: err instanceof Error ? err.message : "Charity not found",
      },
    });
  }
}

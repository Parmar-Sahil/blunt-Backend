import { Request, Response } from "express";
import notificationRepository from "../repositories/notification.repository.js";
import notificationService from "../services/notification.service.js";
import sendResponse from "../utils/responseBuilder.js";
import asyncHandler from "../utils/asyncHandler.js";
import { BadRequestError } from "../utils/errors.js";
import { z } from "zod";

const testEmailSchema = z.object({
  recipient: z.string().email("INVALID RECIPIENT EMAIL ADDRESS"),
  subject: z.string().min(1, "SUBJECT IS REQUIRED").default("BLUNT TEST EMAIL"),
  content: z.string().min(1, "EMAIL CONTENT IS REQUIRED").default("<p>BLUNT Test Email Content</p>"),
});

export const testEmail = asyncHandler(async (req: Request, res: Response) => {
  const payload = testEmailSchema.parse(req.body);

  const result = await notificationService.emailProvider.sendNotification({
    recipient: payload.recipient,
    subject: payload.subject,
    content: payload.content,
  });

  if (!result.success) {
    throw new BadRequestError(`RESEND PROVIDER ERROR: ${result.error}`);
  }

  sendResponse(res, 200, true, "TEST EMAIL DISPATCHED SUCCESSFULLY", result);
});

export const getAdminNotificationsList = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const channel = req.query.channel as string;
  const status = req.query.status as string;
  const type = req.query.type as string;

  const result = await notificationRepository.findPaginatedAdmin({
    page,
    limit,
    channel,
    status,
    type,
  });

  sendResponse(res, 200, true, "ADMIN NOTIFICATIONS RETRIEVED SUCCESSFULLY", result);
});

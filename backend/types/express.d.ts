import { Request } from "express";
import { JWTPayload } from "@shared/types/auth";

declare global {
  interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
  }
}

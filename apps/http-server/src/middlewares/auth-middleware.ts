import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload, JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    // First check Authorization header
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // Fallback to cookie
    if (!token && req.cookies?.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return res.status(401).json({ 
        status: "fail",
        message: "Authentication required. Please log in." 
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("FATAL: JWT_SECRET is not defined");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    // Attach user to request
    req.user = {
      id: decoded.id as string,
      email: decoded.email as string,
    };

    return next();
  } catch (err) {
    // Better error handling for JWT specific errors
    if (err instanceof TokenExpiredError) {
      return res.status(401).json({ status: "fail", message: "Token has expired" });
    }
    if (err instanceof JsonWebTokenError) {
      return res.status(401).json({ status: "fail", message: "Invalid token" });
    }
    
    next(err); // Pass unexpected errors to global error handler
  }
};
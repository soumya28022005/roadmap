import { NextFunction, Request, Response } from "express";
// 1. Error class gulo import theke soriye din
import jwt, { JwtPayload } from "jsonwebtoken"; 

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

    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    req.user = {
      id: decoded.id as string,
      email: decoded.email as string,
    };

    return next();
  } catch (err) {
    // 2. Ekhane jwt. object er theke error gulo check korun
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ status: "fail", message: "Token has expired" });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ status: "fail", message: "Invalid token" });
    }
    
    next(err); 
  }
};
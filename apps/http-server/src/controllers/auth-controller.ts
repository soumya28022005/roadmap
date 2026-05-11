import { Request, Response, NextFunction } from "express";
import { prisma } from "@repo/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { signinSchema, signupSchema } from "@/schemas/auth-schema";

// Helper for signing token to keep code DRY
const generateToken = (userId: string, email: string) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("FATAL: JWT_SECRET is not defined in environment variables");
  }
  return jwt.sign({ id: userId, email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const, // Prevents CSRF attacks
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const signupController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedData = signupSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(422).json({
        status: "fail",
        message: "Invalid input data",
        errors: parsedData.error.flatten().fieldErrors, // Cleaner error format for frontend
      });
    }

    const { name, email, phoneNumber, password } = parsedData.data;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { phoneNumber }] },
    });

    if (existingUser) {
      return res.status(409).json({ // 409 Conflict is standard for already exists
        status: "fail",
        message: "User with this email or phone number already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: { name, email, phoneNumber, passwordHash: hashedPassword },
    });

    const token = generateToken(newUser.id, newUser.email);

    res.cookie("auth_token", token, cookieOptions);

     return res.status(200).json({
      message: "Signin successful",
      token:token,
      user:{id: newUser.id}
    });
  } catch (err) {
    next(err); // Pass to global error handler
  }
};

export const signinController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedData = signinSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(422).json({
        status: "fail",
        message: "Invalid input data",
        errors: parsedData.error.flatten().fieldErrors,
      });
    }

    const { email, phoneNumber, password } = parsedData.data;

    const user = await prisma.user.findFirst({
      where: { OR: [{ email }, { phoneNumber }] },
    });

    if (!user) {
      // Don't reveal if the user exists or password is wrong in production (Security best practice)
      return res.status(401).json({ status: "fail", message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ status: "fail", message: "Invalid credentials" });
    }

    const token = generateToken(user.id, user.email);

    res.cookie("auth_token", token, cookieOptions);

    return res.status(200).json({
      message: "Signin successful",
      token:token,
      user:{id: user.id}
    });
  } catch (err) {
    next(err); 
  }
};
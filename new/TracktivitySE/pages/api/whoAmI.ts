import { getCookie } from "cookies-next";
import jwt from "jsonwebtoken";
import type { NextApiRequest, NextApiResponse } from "next";
import { JWTPayload } from "../../types/JWTPayload";
import { CmuOAuthBasicInfo } from "@/types/CmuOAuthBasicInfo";

type SuccessResponse = CmuOAuthBasicInfo & {
  ok: true;
};

type ErrorResponse = {
  ok: false;
  message: string;
};

export type WhoAmIResponse = SuccessResponse | ErrorResponse;

export default async function handler(req: NextApiRequest, res: NextApiResponse<WhoAmIResponse>) {
  if (req.method !== "GET") return res.status(404).json({ ok: false, message: "Invalid HTTP method" });

  const token = getCookie("cmu-oauth-example-token", { req, res });

  //validate token
  if (typeof token !== "string") return res.status(401).json({ ok: false, message: "Invalid token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;

    return res.json({
      ok: true,
      ...decoded,
    });
  } catch (error) {
    return res.status(401).json({ ok: false, message: "Invalid token" });
  }
}

import { string } from "joi";
import { type JwtPayload } from "jsonwebtoken";
export interface CustomPayload extends JwtPayload {
  userInfo: {
    id: string;
    role: string;
  };
}

export interface ReqUserType {
  id: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: ReqUserType;
    }
  }
}

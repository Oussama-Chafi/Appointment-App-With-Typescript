import { type JwtPayload } from "jsonwebtoken"
export interface CustomPayload extends JwtPayload {
    userInfo : {
        id : string;
        role : string;
    }
}
import cors, { type CorsOptions } from "cors";
import allowedOrigens from "./allowedOrigens.js";

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigens.indexOf(origin as string) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by cors."));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

export default corsOptions;

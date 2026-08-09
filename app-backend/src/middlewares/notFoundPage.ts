import type { Request, Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const notFoundPage = (req: Request, res: Response) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "../views/404.html"));
  } else if (req.accepts("json")) {
    res.status(404).json({ message: "this page not found!" });
  } else {
    res.type("txt").send("this page not found");
  }
};

export default notFoundPage;

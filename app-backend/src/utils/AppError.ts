export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
  }
}

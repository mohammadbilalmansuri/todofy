class ApiResponse {
  constructor(statusCode, message = "Success", data = null, metadata = null) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.metadata = metadata;
    this.success = statusCode < 400;
  }

  send(res) {
    res.status(this.statusCode).json({
      statusCode: this.statusCode,
      message: this.message,
      ...(this.data ? { data: this.data } : {}),
      ...(this.metadata ? { metadata: this.metadata } : {}),
      success: this.success,
    });
  }
}

export default ApiResponse;

class ApiResponse{
  constructor(statusCode, message="success", data, success) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.success = success;
  }
}
export {ApiResponse};
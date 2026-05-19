export class ApiResponse {
  constructor({ success = true, data = null, message = "" }) {
    this.success = success;
    this.data = data;
    this.message = message;
  }
}
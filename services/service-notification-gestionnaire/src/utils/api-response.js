'use strict';

class ApiResponse {
  static success(data, message = 'Succès', statusCode = 200) {
    return {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  static error(statusCode, message, details = null) {
    return {
      success: false,
      statusCode,
      message,
      details,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ApiResponse;

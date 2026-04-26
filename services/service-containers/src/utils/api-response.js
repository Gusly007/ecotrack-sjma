/**
 * Formatage standardisé des réponses API
 */
class ApiResponse {
  /**
   * Réponse de succès
   */
  static success(data, message = 'Succès', statusCode = 200) {
    return {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Réponse d'erreur
   */
  static error(statusCode, message, details = null) {
    return {
      success: false,
      statusCode,
      message,
      details,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Réponse de pagination
   */
  static paginated(items, page, limit, total, message = 'Succès') {
    return {
      success: true,
      statusCode: 200,
      message,
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page * limit < total
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = ApiResponse;

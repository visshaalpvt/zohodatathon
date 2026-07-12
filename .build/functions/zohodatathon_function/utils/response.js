/**
 * Common Response Format Helpers
 */

function sendSuccess(res, data, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  });
}

function sendError(res, rawErrorMsg, statusCode = 500) {
  // Log the detailed diagnostic error securely on the backend only
  console.error(`[API Error] Status ${statusCode}:`, rawErrorMsg);

  // Mask 500 errors to prevent exposing Catalyst SDK details
  let message = rawErrorMsg;
  if (statusCode >= 500) {
    message = "An internal server error occurred while processing your request. Please try again later.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  sendSuccess,
  sendError
};

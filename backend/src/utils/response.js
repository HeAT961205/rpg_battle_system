function successResponse(res, data, message = null) {
    return res.status(200).json({
      success: true,
      data,
      message
    });
  }
  
  function errorResponse(res, statusCode, message) {
    return res.status(statusCode).json({
      success: false,
      data: null,
      message
    });
  }
  
  module.exports = {
    successResponse,
    errorResponse
  };
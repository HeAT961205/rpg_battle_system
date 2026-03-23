function successResponse(data) {
    return {
        success: true,
        data,
        error: null
    };
}

function errorResponse(message) {
    return {
        success: false,
        data: null,
        error: message
    };
}

module.exports = {
    successResponse,
    errorResponse
};

class ResponseHelper {
  parseError(err) {
    let error = {
      status: 500,
      message: '',
      data: null,
    };

    if (err && err.response.status) {
      error.status = err.response.status;
    }
    if (err && err.response && err.response.statusText) {
      error.message = err.response.statusText;
    } else if (err && err.message) {
      error.message = err.message;
    }

    if (err && err.response && err.response.data) {
      error.data = err.response.data;
      if (typeof err.response.data === 'string') {
        error.message = err.response.data;
      } else if (err.response.data.message) {
        error.message = err.response.data.message;
      } else if (err.response.data.error) {
        error.message = err.response.data.error.message;
      }
    }

    return error;
  }
}
module.exports = new ResponseHelper();

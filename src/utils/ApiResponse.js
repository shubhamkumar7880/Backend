class ApiResponse {      //not inheriting res class from node because for req and res, we need to work on core node but we are using framework express.js
constructor(statusCode, data, message = "Success"){
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
}
}

export default ApiResponse;
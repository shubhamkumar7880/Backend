class ApiError extends Error {   // inheriting error class from node.
    constructor(
        statusCode, 
        message= "Something went wrong",
        errors = [],
        stack = ""
        ){
            super(message);
            this.statusCode = statusCode;
            this.data = null;
            this.message = message;
            this.errors = errors;
            this.success = false;
        

        if(stack){
        this.stack = stack;
        } else {
         Error.captureStackTrace(this, this.constructor)  //passing the reference in stack trace(reffered by node.js documentation)
        }
    }

}

export default ApiError;
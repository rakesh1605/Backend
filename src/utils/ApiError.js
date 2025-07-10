class ApiError extends Error{
  constructor(status, message="something went wrong",errors=[],stack="") {
    super(message);
    this.statusCode = status;
    this.message = message;
    this.data = null;
    this.success=false;
    this.errors=errors;
  if(stack){
    this.stack=stack;
  }else{
    Error.captureStackTrace(this,this.constructor);
  }
}
}
export {ApiError};

// how to do with promise
// const asynchandler=(requestHandler)=>{
//   return (req,res,next)=>{
//     Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err));
//   }
// }
const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      res.status(500).json({
        message: error.message,
        success: false,
      });
    }
  };
};

export { asyncHandler };

// this same as const asyncHandler = (fn) => (
//   async (req, res, next) => {
//     try {
//       await fn(req, res);
//     } catch (error) {
//       res.status(500).json({
//         message: error.message,
//         success: false,
//       });
//     }
//   }
// );
// () is not mandatory for return implicitly it is used only for clarity
// higher order function -:  A function that takes another function as an argument, or returns a function, or both.


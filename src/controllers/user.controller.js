import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import User from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessTokenAndRefreshToken=async(userId)=>{
  try {
   const user= await User.findById(userId);
    const accessToken=user.generateAccessToken();
    const refreshToken=user.generateRefreshToken();
    user.refreshToken=refreshToken;
   await user.save({validateBeforeSave:false});
    return {accessToken,refreshToken};
  } catch (error) {
    throw new ApiError(500,"some thig went wrong while generating token");
  }
}
const registerUser=asyncHandler(async(req,res)=>{
  //get user detyails from frontend
  //validation-not empty
  //check if user already exist
  //check for image,check for avatar
  //upload them to cloudinary
  // create user object
  //create entry in db
  //remove password and refresh token from response
  //check for user creation
  // return response
  const {username,email,password,fullname}=req.body;
console.log("email",email);
console.log("password",password);
console.log("username",username);
console.log("fullname",fullname);
if([fullname,email,password,username].some((field)=> field?.trim()===""))
  {
  throw new ApiError(400,"All fields are required");
}
const existingUser=await User.findOne({
  $or:[{email:email},{usrname:username}]
})
if(existingUser){
  throw new ApiError(409,"User already exist");
}
console.log("req.files",req.files);
const avatarLocalpath=req.files?.avatar[0]?.path;
//const coverImageLocalpath=req.files?.coverImage[0]?.path;
console.log("avatarlocalpath",avatarLocalpath);
let coverImageLocalpath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
  coverImageLocalpath=req.files.coverImage[0].path
}
if(!avatarLocalpath){
  throw new ApiError(400,"Avatar is required");
  


}
const avatar=await uploadOnCloudinary(avatarLocalpath);
const coverImage=await uploadOnCloudinary(coverImageLocalpath);
if(!avatar){
  throw new ApiError(400,"Avatar upload failed");
}
if(!coverImage){
  throw new ApiError(400,"Cover image upload failed");
}

const user=await User.create({
  fullname,
  email,
  password,
  avatar:avatar.secure_url,
  coverImage:coverImage?.secure_url || "",
  usrname:username.toLowerCase()
})
const createdUser=await User.findById(user._id).select("-password -refreshToken");
if(!createdUser){
  throw new ApiError(500,"User creation failed");
}
return res.status(201).json(
  new ApiResponse(
    201,
    "User created successfully",
    createdUser
  )
)
})
const loginUser=asyncHandler(async(req,res)=>{
  //req body-> data
  //username or email
  //find the user
  //password check
  //access and refresh token
  // send cookie

  const {email,username,password}=req.body;
  //console.log("email",email);
  if( !email && !username  ){
    throw new ApiError(400,"Username or email is required");
  }
  const user=await User.findOne({
    $or:[{email},{username}]
  });
  if(!user){
    throw new ApiError(404,"User not found");
  }
const isPasseordValid= await user.isPasswordCorrect(password);
  if(!isPasseordValid){
    throw new ApiError(401,"Password is incorrect");
  }
 const {accessToken,refreshToken  }= await generateAccessTokenAndRefreshToken(user._id)
 const loggedInUser=await User.findById(user._id).select("-fullname -password -refreshToken");
 const options={
  httpOnly:true,
  secure:true,
  
 }
 return res.status(200).
 cookie("accessToken",accessToken,options)
 .cookie("refreshToken",refreshToken,options)
 .json(
  new ApiResponse(
    200,
    "User logged in successfully",
    {
      user:loggedInUser,
      accessToken,refreshToken
    }
  )
 )

   
 

})
const logoutUser=asyncHandler(async(req,res)=>{
 await User.findByIdAndUpdate(req.user._id,
    {
      $set:{refreshToken:undefined}
    },
    {
      new:true
    }
  )
  const options={
    httpOnly:true,
    secure:true,
    sameSite:"none"
  }
  res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(
    new ApiResponse(
      200,
      "User logged out successfully",
      null
    )
  )
})
const refreshAccessToken=asyncHandler(async(req,res)=>{
  const incomingRefreshToken=req.cookies?.refreshToken || req.body?.refreshToken;
  if(incomingRefreshToken){
    throw ApiError(400,"Refresh token is required");
  }
 try {
  const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
  const user=await User.findById(decodedToken._id);
  if(!user){
   throw new ApiError(401,"Invalid refresh token");
  }
  if(incomingRefreshToken!==user.refreshToken){
   throw new ApiError(401,"Invalid refresh token");
  }
  const options={
   httpOnly:true,
   secure:true,
   
 }
 const {accessToken,newrefreshToken}=await generateAccessTokenAndRefreshToken(user._id);
 return res.status(200).
  cookie("accessToken",accessToken,options)
  .cookie("refreshToken",newrefreshToken,options).json(
   new ApiResponse(
     200,
     "Access token refreshed successfully",
     {
       accessToken,refreshToken:newrefreshToken
     }
   )
  )
 } catch (error) {
  throw new ApiError(401,"Invalid refresh token");
  
 }
 
  
 

})
const changeCurrentPassword=asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword}=req.body;
  const user=await User.findById(req.user._id);
 const isPasswordValid=await user.isPasswordCorrect(oldPassword)
 if(!isPasswordValid){
  throw new ApiError(401,"Old password is incorrect");
 }
 user.password=newPassword;
 await user.save({validateBeforeSave:false});
 return res.status(200).json(
  new ApiResponse(
    200,
    "Password changed successfully",
    null
  )
 )
})
const getCurrentUser=asyncHandler(async(req,res)=>{
  return res.status(200).json(
    new ApiResponse(
      200,
      "User fetched successfully",
      req.user
    )
  )
})
const updateAccountDetails=asyncHandler(async(req,res)=>{
  const {fullname,email}=req.body;
  if(!fullname || !email){
    throw new ApiError(400,"Fullname and email is required");
  }
 const user= User.findByIdAndUpdate(req.user._id,
    {
      $set:{fullname,
        email:email}
    },
    {
      new:true
    }
  ).select("-password");
  return res.status(200).json(
    new ApiResponse(
      200,
      "Account details updated successfully",
      null
    )
  )
})
const updateUserAvatar=asyncHandler(async(req,res)=>{
 const avatarLocalpath =req.file?.path
 if(!avatarLocalpath){
  throw new ApiError(400,"Avatar is required");
 }
 const avatar=await uploadOnCloudinary(avatarLocalpath);
 if(!avatar.url){
  throw new ApiError(500,"Avatar upload failed");
 }
  await User.findByIdAndUpdate(req.user._id,
    {
      $set:{avatar:avatar.url}
    },
    {
      new:true
    }
  ).select("-password");
  return res.status(200).json(
    new ApiResponse(
      200,
      "Avatar updated successfully",
      null
    )
  )

})
const updateCoverImage=asyncHandler(async(req,res)=>{
  const coverImageLocalpath =req.file?.path
  if(!coverImageLocalpath){
   throw new ApiError(400,"Cover image is required");
  }
  const coverImage=await uploadOnCloudinary(coverImageLocalpath);
  if(!coverImage.url){
   throw new ApiError(500,"Cover image upload failed");
  }
   await User.findByIdAndUpdate(req.user._id,
     {
       $set:{coverImage:coverImage.url}
     },
     {
       new:true
     }
   ).select("-password");
   return res.status(200).json(
     new ApiResponse(
       200,
       "Cover image updated successfully",
       null
     )
   )
})
const getUserChannelProfile=asyncHandler(async(req,res)=>{
  const {username}=req.params;
  if(!username.trim()){
    throw new ApiError(400,"Username is required");
  }
const channel= await User.aggregate([
  {
    $match:{usrname:username?.toLowerCase()}
  },
  {
    $lookup:{
      from:"subscriptions",
      localField:"_id",
      foreignField:"channel",
      as:"subscribers"
    }
  },
  {
    $lookup:{
      from:"subscriptions",
      localField:"_id",
      foreignField:"subscriber",
      as:"subscribedTo"
    }
  },
  {
    $addFields:{
      subscribersCount:{$size:"$subscribers"},
      subscribedToCount:{$size:"$subscribedTo"},
      isSubscribed:{
        $cond:{
          if:{$in:[req.user?._id,"$subscribers.subscriber"]},
          then:true,
          else:false
        }
      }
    }
  },
  {
    $project:{
      fullname:1,
      avatar:1,
      subscribersCount:1,
      subscribedToCount:1,
      isSubscribed:1,
      coverImage:1,
    }
  }

 //aggregate returns an array
 ])
  if(!channel?.length){
    throw new ApiError(404,"Channel not found");
  }
  return res.status(200).json(
    new ApiResponse(
      200,
      "Channel profile fetched successfully",
      channel[0]
    )
  )
})
const getWatchHistory=asyncHandler(async(req,res)=>{
const user=await User.aggregate([
  {
    $match:{
      _id:new mongoose.Types.ObjectId(req.user._id)
    }
  },
  {
    $lookup:{
      from:"videos",
      localField:"watchHistory",
      foreignField:"_id",
      as:"watchHistory",
      pipeline:[{
           $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
           pipeline:[{
            $project:{
              username:1,
              fullname:1,
              avatar:1
            }
           }]
          

        }
      },
      {
        $addFields:{
          owner:{
            $first:"$owner"
          }
        }
      }
       
      ]
    }
  }
])
return res.status(200).json(
  new ApiResponse(
    200,
    "Watch history fetched successfully",
    user[0].getWatchHistory
  )
)
})
const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }
const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})


export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateCoverImage,getUserChannelProfile,getWatchHistory,updateUserCoverImage};
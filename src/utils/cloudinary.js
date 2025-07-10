// cloudinary.config.js
import pkg from 'cloudinary'; // CommonJS module imported correctly
import fs from "fs";
const { v2: cloudinary } = pkg;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

 const uploadOnCloudinary = async (localFilePath) => {
  try {
    console.log("inside cloudinary");
    if(!localFilePath) return null;
    const result = await cloudinary.uploader.upload(localFilePath,{
      resource_type:"auto",
    });
   
    //file has been uploaded
  //  console.log("file has uploaded on cloudinary",result.secure_url);
  fs.unlinkSync(localFilePath);
    return result;
    
  } catch (error) {
    console.log("cloudinary error",error);
    fs.unlinkSync(localFilePath);
    // remove the locally saved file as the operation got failed
    
  }
  
}
export { uploadOnCloudinary };
import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema=new Schema({
  usrname:{
    type:String,
    required:true,
    lowercase:true,
    trim:true,
    index:true, //optimzes the search operation
    
     unique:true
  },
  email:{
    type:String,
    required:true,
    lowercase:true,
    trim:true,
    
    unique:true
  },
  fullname:{
    type:String,
    required:true,
  
    trim:true,
    index:true
  },
  avatar:{
    type:String,//cloudinary url
    required:true,
    
  }
  ,
  coverImage:{
    type:String,//cloudinary url
    
  },
  watchHistory:[{
    type:Schema.Types.ObjectId,
    ref:"Video"
  }],
 password:{
type:String,
required:[true,"Password is required"],

 },
 refreshToken:{
  type:String
 }
},{timestamps:true})
userSchema.pre("save",async function(next){
  if(!this.isModified("password")){
    return next();
  }
 // const salt=await bcrypt.genSalt(10);
  this.password=await bcrypt.hash(this.password,10);
  next();
})
userSchema.methods.isPasswordCorrect=async function(password){
 return  await bcrypt.compare(password,this.password);
  
}
userSchema.methods.generateAccessToken=function(){
return  jwt.sign({
    _id:this._id,
    email:this.email,
    usrname:this.usrname,
    fullname:this.fullname
  },
process.env.ACCESS_TOKEN_SECRET,
{expiresIn:process.env.ACCESS_TOKEN_EXPIRY})
}
userSchema.methods.generateRefreshToken=function(){
  return  jwt.sign({
    _id:this._id,
    
  },
process.env.REFRESH_TOKEN_SECRET,
{expiresIn:process.env.REFRESH_TOKEN_EXPIRY}
  
  )
}
export default mongoose.model("User",userSchema);
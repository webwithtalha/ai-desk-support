import { Schema, model, models } from "mongoose";

const orgSchema = new Schema({
    name:{type:String, required:true, trim:true},
    slug:{type:String, required:true, trim:true, unique:true, index:true},
    plan:{type:String, required:true, enum:["FREE", "PRO"], default:"FREE"},
}, { timestamps: true });

export default models.Org || model("Org", orgSchema);
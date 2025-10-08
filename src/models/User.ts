import { Schema, model, models, Types } from "mongoose";

const userSchema = new Schema({
    orgId: { type: Types.ObjectId, ref: "Org", required: true, index: true },
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, index: true },
    hashedPassword: { type: String, required: true },
    role: { type: String, enum: ["OWNER", "ADMIN", "AGENT"], default: "AGENT" },
}, { timestamps: true });

export default models.User || model("User", userSchema);
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  account: string;
  gold: number;
}

const UserSchema: Schema<IUser> = new Schema({
  account: { type: String, required: true, unique: true },
  gold: { type: Number, default: 0 },
});

// 기존 모델이 있으면 사용하고, 없으면 새로 생성
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
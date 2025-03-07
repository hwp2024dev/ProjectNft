import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { IItem } from "./Item"; // 위에서 정의한 IItem 인터페이스 import

// IUser 인터페이스 정의 (User 문서에 포함될 필드)
interface IUser extends Document {
  username: string;
  password: string;
  account: string; // 메타마스크 주소
  inventory: IItem[];
  comparePassword: (password: string) => Promise<boolean>;
}

// User 스키마 정의
const UserSchema: Schema<IUser> = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  account: { type: String, required: true, unique: true },
  inventory: { 
    type: [{
      itemId: { type: String, required: true },
      itemName: { type: String, required: true },
      quantity: { type: Number, required: true },
      type: { type: String, required: true },
      emoji: { type: String, required: true },
      price: { type: String, required: true },
      isTrading: { type: Boolean, default: false }  // 추가
    }], 
    default: [] 
  },
});

// 비밀번호 해싱 (password가 변경될 때만)
UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();

  console.log("기존 비밀번호:", this.password);
  this.password = await bcrypt.hash(this.password, 10);
  console.log("새로운 해싱된 비밀번호:", this.password);

  next();
});

// 비밀번호 비교 메서드
UserSchema.methods.comparePassword = function (password: string) {
  return bcrypt.compare(password, this.password);
};

// User 모델 생성 및 export
const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;
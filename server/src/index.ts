import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import inventoryRoutes from "./routes/inventory";
import userRoutes from "./routes/user"; // 유저 라우트 추가

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/user", userRoutes); // 유저 API 경로 추가

const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGO_URI as string, { 
    dbName: "nekov099_loginDB"
  })
  .then(() => {
    console.log("MongoDB 연결 성공");
    app.listen(PORT, () => {
      console.log(`🚀 서버 실행: http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB 연결 실패:", error);
    process.exit(1);
  });
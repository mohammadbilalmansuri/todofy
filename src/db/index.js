import mongoose from "mongoose";
import { DB_NAME, MONGODB_URI } from "../constant.js";

const connectDB = async () => {
  try {
    const connectionString = `${MONGODB_URI}/${DB_NAME}`;
    const connectionInstance = await mongoose.connect(connectionString);
    console.log(
      `MongoDB Connected !! DB Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MongoDB Connection Failed: ", error);
    process.exit(1);
  }
};

export default connectDB;

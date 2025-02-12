import { configDotenv } from "dotenv";
configDotenv();

import { PORT } from "./constants.js";
import app from "./app.js";
import connectDB from "./db.js";

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.error("Server Error:", error);
    });

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Failed:", error);
  });

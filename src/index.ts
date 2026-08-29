import dotenv from "dotenv";
import { createApp } from "./app.js";

dotenv.config({ quiet: true });

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`Server is running on the port : ${PORT}`);
});

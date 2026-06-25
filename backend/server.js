require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const app = require("./src/app");  

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());

const characterRoutes = require("./routes/characters");
const enemyRoutes = require("./routes/enemies");
const battleRoutes = require("./routes/battle");

app.use(cors());

app.use("/characters", characterRoutes);
app.use("/enemies", enemyRoutes);
app.use("/battle", battleRoutes);

app.listen(3001, () => {
  console.log("Server running on port 3001");
});


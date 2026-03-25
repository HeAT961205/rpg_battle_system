const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());

const characterRoutes = require("./routes/characters");
const enemyRoutes = require("./routes/enemies");
const battleRoutes = require("./routes/battle");
const partyRoutes = require("./routes/party");
const skillRoutes = require("./routes/skills");

app.use(cors());

app.use("/characters", characterRoutes);
app.use("/enemies", enemyRoutes);
app.use("/battle", battleRoutes);
app.use("/party", partyRoutes);
app.use("/skills", skillRoutes);

app.listen(3001, () => {
  console.log("Server running on port 3001");
});


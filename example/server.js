const express = require("express");
const serverFunc = require("../serverInjection/serverInjection");

const app = express();

// not sure how to do all this
const solidWs = serverFunc(app);

app.listen(8080, () => {
  console.log(`running on port 8080!`);
});

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// define counter schema and model
const counterSchema = new mongoose.Schema({
  _id: String,
  sequence_value: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));
app.use("/api/shorturl", bodyParser.urlencoded({ extended: false }));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// receive new url, shorten and return it
app.post("/api/shorturl", function (req, res) {
  const longUrl = req.body.url;
  // need to handle simultaneous posts
  const shortUrl = new Date().getTime().toString(36);
  res.json({ original_url: longUrl, short_url: shortUrl });
});

// redirect to shortened url
app.get("/api/shorturl/:url", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

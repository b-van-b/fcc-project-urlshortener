require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const validator = require("validator");
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

// define url schema and model
const urlSchema = new mongoose.Schema({
  _id: Number,
  original_url: String,
});
const Url = mongoose.model("URL", urlSchema);

// increment and return the value of some sequence, such as an ID number
const getNextSequenceValue = (sequenceName, done) => {
  console.log("attempting to get next number in sequence: " + sequenceName);
  Counter.findOneAndUpdate(
    { __id: sequenceName },
    { $inc: { sequence_value: 1 } },
    { new: true },
    (err, doc) => {
      if (err) return console.log(err);
      console.log("successfully got next number in sequence: " + doc);
      done(null, doc.sequence_value);
    }
  );
};

// create new url document with auto-incremented
// id representing short url and return it
const addNewUrl = (url, done) => {
  console.log("trying to add new url: " + url);
  getNextSequenceValue("url_id", (err, sequence_value) => {
    if (err) return console.log(err);
    const doc = new Url({
      _id: sequence_value,
      original_url: url,
    });
    console.log("trying to save url...");
    doc.save((err, data) => {
      if (err) return console.log(err);
      console.log("successfully saved new url: " + data);
      done(null, data);
    });
  });
};

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));
app.use("/api/shorturl", bodyParser.urlencoded({ extended: false }));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// receive new url, shorten and return it
app.post("/api/shorturl", function (req, res) {
  const original_url = req.body.url;
  console.log("Received URL to shorten: " + original_url);
  // if url is invalid, return an error message
  if (!validator.isURL(original_url)){
    console.log("- invalid; sending error message to client")
    res.json({ error: 'invalid url' });
    return;
  }
  // if url already exists, return the data directly
  
  // otherwise, create a new shortened url and return it
  console.log("Attempting to shorten url...");
  addNewUrl(original_url, (err, data) => {
    if (err) return console.log(err);
    console.log("Successfully shortened url: " + data);
    res.json({ original_url: data.original_url, short_url: data._id });
  });
});

// redirect to shortened url
app.get("/api/shorturl/:url", function (req, res) {
  console.log("Incoming shortened URL: " + req.params.url);
  res.json({ url: req.params.url });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

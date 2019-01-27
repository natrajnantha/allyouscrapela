var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var noteschema = new Schema({
  title: {
    type: String
  },
  body: {
    type: String
  }
});

var note = mongoose.model("note", noteschema);
module.exports = note;

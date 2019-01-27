var express = require("express");
var method = require("method-override");
var body = require("body-parser");
var exphbs = require("express-handlebars");
var mongoose = require("mongoose");
var logger = require("morgan");
var cheerio = require("cheerio");
var request = require("request");

var Note = require("./models/Note");
var Article = require("./models/Article");
var databaseUrl = "mongodb://localhost/scrap";

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI);
} else {
  mongoose.connect(databaseUrl);
}

mongoose.Promise = Promise;
var db = mongoose.connection;

db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

db.once("open", function() {
  console.log("Mongoose connection successful.");
});

var app = express();
var port = process.env.PORT || 3000;

app.use(logger("dev"));
app.use(express.static("public"));
app.use(body.urlencoded({ extended: false }));
app.use(method("_method"));
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

app.listen(port, function() {
  console.log("Listening on port " + port);
});

app.get("/", function(req, res) {
  Article.find({}, null, { sort: { created: -1 } }, function(err, data) {
    if (data.length === 0) {
      res.render("placeholder", {
        message: "No articles found. Perform a new scraping"
      });
    } else {
      res.render("index", { articles: data });
    }
  });
});

app.get("/scrape", function(req, res) {
  request("https://www.latimes.com/local", function(error, response, html) {
    var $ = cheerio.load(html);
    var result = {};
    $("ul.tag-list-wrapper").each(function(i, element) {
      var title,
        link,
        img,
        summary = "";
      title = $(element)
        .parent()
        .children()
        .next()
        .children("a")
        .text();
      link =
        "https://www.latimes.com" +
        $(element)
          .parent()
          .children()
          .next()
          .children("a")
          .attr("href");
      img = $(element)
        .parent()
        .prev()
        .children("figure")
        .children()
        .children("a")
        .children("img")
        .attr("data-src");
      summary = $(element)
        .parent()
        .children(".preview-text")
        .text();
      result.link = link;
      result.title = title;
      if (summary) {
        result.summary = summary;
      } else {
        result.summary = title;
      }
      if (img) {
        result.img = img;
      } else {
        result.img = "";
      }

      console.log(result);
      var entry = new Article(result);
      if (title.length > 0 && result.img != "") {
        Article.find({ title: result.title }, function(err, data) {
          if (data.length === 0) {
            entry.save(function(err, data) {
              if (err) throw err;
            });
          }
        });
      }
    });
    console.log("Scrape finished.");
    res.redirect("/");
  });
});

app.get("/saved", function(req, res) {
  Article.find({ issaved: true }, null, { sort: { created: -1 } }, function(
    err,
    data
  ) {
    if (data.length === 0) {
      res.render("placeholder", {
        message: "No saved articles found"
      });
    } else {
      res.render("saved", { saved: data });
    }
  });
});

app.post("/save/:id", function(req, res) {
  Article.findById(req.params.id, function(err, data) {
    if (data.issaved) {
      Article.findByIdAndUpdate(
        req.params.id,
        { $set: { issaved: false, status: "Save Article" } },
        { new: true },
        function(err, data) {
          res.redirect("/");
        }
      );
    } else {
      Article.findByIdAndUpdate(
        req.params.id,
        { $set: { issaved: true, status: "Saved" } },
        { new: true },
        function(err, data) {
          res.redirect("/saved");
        }
      );
    }
  });
});

app.get("/note/:id", function(req, res) {
  var id = req.params.id;
  Article.findById(id)
    .populate("note")
    .exec(function(err, data) {
      res.send(data.note);
    });
});

app.get("/:id", function(req, res) {
  Article.findById(req.params.id, function(err, data) {
    res.json(data);
  });
});

app.post("/note/:id", function(req, res) {
  var note = new Note(req.body);
  note.save(function(err, doc) {
    if (err) throw err;
    Article.findByIdAndUpdate(
      req.params.id,
      { $set: { note: doc._id } },
      { new: true },
      function(err, newdoc) {
        if (err) throw err;
        else {
          res.send(newdoc);
        }
      }
    );
  });
});

//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


/* ------------ MongoDB stuff ------------*/
//Creating DB
mongoose.connect("mongodb+srv://admin-gabi:604916@cluster0.7l9icfk.mongodb.net/toDoListDB", { autoIndex: true });

//Create a Schema. Every schema maps to a DB collection
const itemsSchema = new mongoose.Schema({
  name: String
});

//To use the schema defintion, create a model. Name MUST be singular! 
const Item = mongoose.model("Item", itemsSchema);

//Create new documents (default items)
const item1 = new Item({ name: "Welcome to your todolist!" });
const item2 = new Item({ name: "Hit the + button to add a new item." });
const item3 = new Item({ name: "<-- Hit this to delete an item." });

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);


Item.count((err, count) => {
  if (!err && count === 0) {
    Item.insertMany(defaultItems, (err) => {
      if (err) {
        console.log(err);
      }
      else {
        console.log("Added default items to list.")
      }
    });
  }
});


//Routes
app.get("/", function (req, res) {

  const day = date.getDate();
  Item.find({}, (err, docs) => {
    res.render("list", { listTitle: day, newListItems: docs });
  })

});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  })

  if (listName === date.getDate()) {
    item.save();
    res.redirect("/");
  }
  else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
})


app.post("/delete", (req, res) => {
  if(req.body.listName === date.getDate()) {
      Item.deleteOne({ "_id": req.body.checked }, (err, res) => {
      if (err) {
        console.log(err);
      }
      else {
        console.log(res);
      }
    });
    res.redirect("/");
  }
  else {
    List.findOneAndDelete({name : req.body.listName}, (err) => {
      if(err) {
        console.log(err);
      }
    });
    res.redirect("/" + req.body.listName);
  }  
}
);

app.get("/:customListName", (req, res) => {
  let customListName = _.capitalize(req.params.customListName);
  setTimeout(() => {
    List.findOne({ name: customListName }, (err, result) => {
      if (err) {
        console.log(err);
      }
      else if (!result && customListName != "favicon.ico") {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();

        res.redirect("/" + customListName);
      }
      else if (result && customListName != "favicon.ico") {
        res.render("list", { listTitle: customListName, newListItems: result.items });
      };
    });
  }, 1000)
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.port || 3000, function () {
  console.log("Server started on port 3000");
});

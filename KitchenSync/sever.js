const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose").default;
console.log("passportLocalMongoose:", passportLocalMongoose);
console.log("type:", typeof passportLocalMongoose);
const app = express();
const port = 3000;
require("dotenv").config(); 

app.use(express.static(__dirname));


app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.DB_SECRET,
    resave: false,
    saveUninitialized: false
}));

mongoose.connect("mongodb://127.0.0.1:27017/kitchensync").then(() => console.log("MongoDB connected"));

const userSchema = new mongoose.Schema({
  username: String,
 
});

const foodSchema = new mongoose.Schema({
  name:String,
  quantity:Number,
  expiryDate: Date, 
  storage: {
    type:String,
    enum: ["pantry","fridge","freezer"]
  },
  imageUrl:String

});

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);
const Food = mongoose.model("Food", foodSchema);

app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get("/", (req, res) => {
  res.sendFile(__dirname + "/login.html");
});


app.post("/loginForm",
  passport.authenticate("local", {
    successRedirect: "/dashboard.html",
    failureRedirect: "/"
  })
);


app.post("/register", async (req, res) => {
  console.log( "User " + req.body.username + " is attempting to register" );

  const oldUser = await User.findOne({
    username: req.body.username
  });
  if(oldUser){
    return res.redirect("/");
  }else{
    const user = new User({username: req.body.username});
    await User.register( user, req.body.password); 

   req.login(user, (err) => {
     if (err) return res.redirect("/");
     res.sendFile(__dirname + "/dashboard.html");
   });
  }

});
app.get("/dashboard-summary", async (req, res) => {
  try {
    const foods = await Food.find();

    const today = new Date();
    const soonDate = new Date();
    soonDate.setDate(today.getDate() + 3);

    const totalItems = foods.length;

    const expiredItems = foods.filter(item =>
      item.expiryDate && new Date(item.expiryDate) < today
    ).length;

    const expiringSoonItems = foods.filter(item =>
      item.expiryDate &&
      new Date(item.expiryDate) >= today &&
      new Date(item.expiryDate) <= soonDate
    ).length;

    const lowStockItems = foods.filter(item =>
      item.quantity <= 1
    ).length;

    res.json({
      totalItems,
      expiredItems,
      expiringSoonItems,
      lowStockItems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/recipes/expiring-soon", async (req, res) => {
  try {
    const foods = await Food.find();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const soonDate = new Date();
    soonDate.setHours(0, 0, 0, 0);
    soonDate.setDate(soonDate.getDate() + 3);

    const expiringSoonFoods = foods.filter(item => {
      if (!item.expiryDate) return false;

      const expiry = new Date(item.expiryDate);
      expiry.setHours(0, 0, 0, 0);

      return expiry >= today && expiry <= soonDate;
    });

    const ingredientNames = expiringSoonFoods
      .map(item => item.name?.trim())
      .filter(Boolean);

    if (ingredientNames.length === 0) {
      return res.json([]);
    }

    const ingredient = ingredientNames[0];

    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`
    );

    const data = await response.json();

    res.json(data.meals || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
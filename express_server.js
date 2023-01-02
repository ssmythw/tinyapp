const express = require("express");
var cookieSession = require("cookie-session");
const { findUser, filterURLs, generateRandomString } = require("./helpers");
const { urlDatabase } = require("./database");
const { users } = require("./users");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: [""],
    maxAge: 24 * 60 * 60 * 1000,
  })
);

app.get("/", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.status(404).send("You need to be logged in to shorten URLs");
  }
  //if user exists, filter the URLS and send them as template variables to ejs template
  //then render the urls_index page
  const filteredURLs = filterURLs(req.session.user_id, urlDatabase);
  const templateVars = { user, urls: filteredURLs };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.send("You need to be logged in to shorten URLs");
  }
  // if user exists, generate a randoms string, set the longURL and userID values
  //into a new item object in the urlDatabase. Afterwards, redirect to the urls/generatedString
  const id = generateRandomString();
  urlDatabase[id] = {};
  urlDatabase[id].longURL = req.body.longURL;
  urlDatabase[id].userID = req.session.user_id;
  res.redirect(`/urls/${id}`);
});

app.get("/register", (req, res) => {
  const user = users[req.session.user_id];
  //if user exists redirect to /urls else render the urls_register template
  if (user) {
    res.redirect("/urls");
  }
  const templateVars = { user };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const user = users[req.session.user_id];
  //if user exists redirect to /urls else render the urls_login template
  if (user) {
    res.redirect("/urls");
  }
  const templateVars = { user };
  res.render("urls_login", templateVars);
});

app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Email and password are required.");
  } else if (findUser(req.body.email, users)) {
    res.status(400).send("User already exists.");
  } else {
    //get users password, hash it. Then generate id for the user and store the new user
    //in the users object.
    const password = req.body.password;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user_id = generateRandomString();
    users[user_id] = {
      id: user_id,
      email: req.body.email,
      password: hashedPassword,
    };
    req.session.user_id = user_id;
    res.redirect("/urls");
  }
});

app.get("/urls/new", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.redirect("/login");
  } else {
    const templateVars = { user };
    res.render("urls_new", templateVars);
  }
});

app.post("/login", (req, res) => {
  const user = findUser(req.body.email, users);
  if (!user) {
    res.status(403).send("A user with that email can't be found");
  } else if (bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(403).send("Incorrect password");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const user = users[req.session.user_id];
  if (urlDatabase[req.params.id] === undefined) {
    res.status(404).send("ID does not exist");
  } else if (!user) {
    res.status(404).send("Need to be logged in to view this page.");
  } else if (
    urlDatabase[req.params.id] &&
    urlDatabase[req.params.id].userID !== req.session.user_id
  ) {
    res.status(404).send("User does not own the URL");
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  }
});

app.post("/urls/:id", (req, res) => {
  //check if ID even exists in the database
  //take the id from the URL and check if it is in the DB (use function)
  const user = users[req.session.user_id];
  if (urlDatabase[req.params.id] === undefined) {
    res.status(404).send("ID does not exist");
  } else if (!user) {
    res.status(404).send("Need to be logged in to view this page.");
  } else if (
    urlDatabase[req.params.id] &&
    urlDatabase[req.params.id].userID !== req.session.user_id
  ) {
    res.status(404).send("User does not own the URL");
  } else {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  }
});

app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id] === undefined) {
    res.status(404).send("ID does not exist");
  } else {
    const longURL = urlDatabase[req.params.id];
    res.redirect(longURL);
  }
});

app.get("/urls/:id", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.status(404).send("Need to be logged in to view this page.");
  } else if (urlDatabase[req.params.id] === undefined) {
    res.status(404).send("ID does not exist");
  } else if (
    urlDatabase[req.params.id] &&
    urlDatabase[req.params.id].userID !== req.session.user_id
  ) {
    res.status(404).send("User does not own the URL");
  } else {
    const templateVars = {
      id: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user,
    };
    res.render("urls_show", templateVars);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

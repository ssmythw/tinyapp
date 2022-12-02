const express = require("express");
var cookieSession = require("cookie-session");
const { findUser } = require("./helpers");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "session",
    keys: ["key1"],
  })
);

function filterURLs(id) {
  let filteredList = {};
  for (let key in urlDatabase) {
    if (urlDatabase[key].userID === id) {
      filteredList[key] = urlDatabase[key];
    }
  }
  return filteredList;
}

function generateRandomString() {
  // string code taken from stack overflow
  // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
  let string = Math.random().toString(36).slice(2, 8);
  return string;
}

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
  const filteredURLs = filterURLs(req.session.user_id);
  const templateVars = { user, urls: filteredURLs };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.send("You need to be logged in to shorten URLs");
  }
  const id = generateRandomString();
  urlDatabase[id] = {};
  urlDatabase[id].longURL = req.body.longURL;
  urlDatabase[id].userID = req.session.user_id;
  res.redirect(`/urls/${id}`);
});

app.get("/register", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    res.redirect("/urls");
  }
  const templateVars = { user };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const user = users[req.session.user_id];
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
  }
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.post("/login", (req, res) => {
  const user = findUser(req.body.email);
  if (!user) {
    res.status(403).send("A user with that email can't be found");
  }
  if (bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    res.status(403).send("Incorrect password");
  }
});

app.post("/urls/:id/delete", (req, res) => {
  if (urlDatabase[req.params.id] === undefined) {
    res.status(404).send("ID does not exist");
  }
  const user = users[req.session.user_id];
  if (!user) {
    res.status(404).send("Need to be logged in to view this page.");
  }
  if (
    urlDatabase[req.params.id] &&
    urlDatabase[req.params.id].userID !== req.session.user_id
  ) {
    res.status(404).send("User does not own the URL");
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  //check if ID even exists in the database
  //take the id from the URL and check if it is in the DB (use function)
  if (urlDatabase[req.params.id] === undefined) {
    res.status(404).send("ID does not exist");
  }
  const user = users[req.session.user_id];
  if (!user) {
    res.status(404).send("Need to be logged in to view this page.");
  }
  if (
    urlDatabase[req.params.id] &&
    urlDatabase[req.params.id].userID !== req.session.user_id
  ) {
    res.status(404).send("User does not own the URL");
  }
  urlDatabase[req.params.id] = {};
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id] === undefined) {
    res.status(404).send("ID does not exist");
  }

  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  const user = users[req.session.user_id];
  if (!user) {
    res.status(404).send("Need to be logged in to view this page.");
  }
  if (urlDatabase[req.params.id] === undefined) {
    res.status(404).send("ID does not exist");
  }
  if (
    urlDatabase[req.params.id] &&
    urlDatabase[req.params.id].userID !== req.session.user_id
  ) {
    res.status(404).send("User does not own the URL");
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user,
  };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

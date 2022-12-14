function findUser(email, database) {
  for (let key in database) {
    if (database[key].email === email) return database[key];
  }
  return null;
}

function filterURLs(id, database) {
  let filteredList = {};
  for (let key in database) {
    if (database[key].userID === id) {
      filteredList[key] = database[key];
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

module.exports = { findUser, filterURLs, generateRandomString };

//findUSer takes in an email and a database object and loops through the database until the user
//with the supplied email is found. If no user is found then null is returned.
function findUser(email, database) {
  for (let key in database) {
    if (database[key].email === email) return database[key];
  }
  return null;
}

//filterURLs takes in an id and a database object and loops through the database to check for
//URLS that are owned by the user with the supplied id. A new object is created and populated
//with a new URL each time a matching one is found (userID === id).

function filterURLs(id, database) {
  let filteredList = {};
  for (let key in database) {
    if (database[key].userID === id) {
      filteredList[key] = database[key];
    }
  }
  return filteredList;
}

//generateRandomString uses a simple algorithm to create a random string
//that is 6 characters long

function generateRandomString() {
  // string code taken from stack overflow
  // https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
  let string = Math.random().toString(36).slice(2, 8);
  return string;
}

module.exports = { findUser, filterURLs, generateRandomString };

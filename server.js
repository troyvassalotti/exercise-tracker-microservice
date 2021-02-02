const express = require('express')
const app = express()
const cors = require('cors')
const crypto = require('crypto');
require('dotenv').config()
const bodyParser = require('body-parser'); // needed for form submissions
const Database = require("@replit/database"); // require the replit database
const db = new Database(); // create a replit database

app.use(cors())
app.use(express.static('public'))

app.use(bodyParser.urlencoded({extended: false})); // activate body-parser middleware

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});

var users = []; // until I figure out a way to extract an array of users from the database, this will have to do

app.post("/api/exercise/new-user", (req, res) => {
  let user = req.body.username;
  let hash = crypto.createHash("sha256"); // create a user id using the node crypto module
  hash.update(user);
  let userId = hash.digest('hex');
  // push the user to the previously mentioned array of users
  users.push({
    _id: userId,
    username: user
  });
  // set the user in the database, then return the json
  db.set(userId, {
    _id: userId,
    username: user,
    log: []
  }).then(() => {
    res.json({
      username: user,
      _id: userId
    })
  })
});


app.get("/api/exercise/users", (req, res) => {
  // as I said, I don't have a better method of returning all users yet
  res.json(users)
});


app.post("/api/exercise/add", (req, res) => {
  // get all the form inputs
  let userId = req.body.userId;
  let eDescription = req.body.description;
  let eDuration = parseInt(req.body.duration);
  let eDate;
  // create a date string from the given date or empty date
  if (req.body.date === "" || null) {
    eDate = new Date().toDateString();
  } else {
    eDate = new Date(req.body.date).toDateString()
  }
  // grab the information from the database for the json response
  db.get(userId).then(value => {
    let tempLog = value.log;
    tempLog.push({
      description: eDescription,
      duration: eDuration,
      date: eDate
    });
    res.json({
      _id: value['_id'],
      username: value['username'],
      date: eDate,
      duration: eDuration,
      description: eDescription
    });
    db.set(value['_id'], {
      _id: userId,
      username: value['username'],
      log: tempLog
    })
  })
});

// do everything to grab the exercise log
app.get("/api/exercise/log", (req, res) => {
  let userId = req.query.userId;
  let fromDate = req.query.from;
  let toDate = req.query.to;
  let limit = req.query.limit;
  if (userId == null) {
    res.json({
      error: 'a user id is required'
    })
  } else {
    let queries = req.query;
    db.get(userId).then(value => {
      let log = value.log;
      let filteredLog;
      if (fromDate) {
        filteredLog = log.filter(e => new Date(e.date) > new Date(fromDate));
        log = filteredLog;
      }
      if (toDate) {
        filteredLog = log.filter(e => new Date(e.date) < new Date(toDate));
        log = filteredLog;
      }
      if (limit) {
        filteredLog = log.slice(0, limit);
        log = filteredLog;
      }
      queries.log = log;
      queries.username = value.username;
      queries.count = log.length;
      res.json(queries);
    })
  }
});

// TESTING HOW TO GET ALL THE USERS FROM THE DATABASE INSTEAD OF AN ARRAY
// var userList;
// var userListRes = [];
// db.getAll().then(list => {
//   userList = Object.keys(list);
// }).then(() => {
//   userList.forEach(user => {
//     db.get(user).then(value => {
//       userListRes.push({
//         _id: value['_id'],
//         username: value['username']
//       })
//     })
//   })
// })
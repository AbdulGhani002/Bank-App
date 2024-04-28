const session = require('express-session');
require('dotenv').config()
const MongoDBStore =require('connect-mongodb-session')(session)
const store = new MongoDBStore({
    uri:process.env.MONGO_URI,
    collection:'sessions'
})

store.on('error', function(error) {
    console.log(error);
  });

  
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie:{
    maxAge:3600*24000,
    secure: true
  },
  store:store
};
module.exports = {sessionConfig};
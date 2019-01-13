var express = require('express');
var mysqlConnection = require('../middlewares/mysqlConnection')
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/**
 * Create User Account
 */
router.post('/', (req,res)=>{
  var body = req.body
  
  mysqlConnection.query("INSERT INTO Users (name, account, password) VALUES ("+body.name + "," + body.account + ","+ body.password + ")" , (err, res, field)=>{
    if(err){
      console.log(err)
    }else {
      console.log(res)
    }
  })
})

/**
 * Get User Account
 */
router.get('/', (req,res)=>{
  var body = req.body

  mysqlConnection.query("SELECT FROM Users WHERE account = " + body.account + " AND password=" +body.password, (err, res, field)=>{
    if(err){
      console.log(err)
    }else {
      console.log(res)
    }
  })
})

module.exports = router;

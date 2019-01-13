var express = require('express');
var mysqlConnection = require('../middlewares/mysqlConnection')
var router = express.Router();
var async = require('async')


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/**
 *  유저 계정 생성
 */
router.post('/', (req,res)=>{
  var body = req.body
  var params = [ body.account ,body.password, body.name]

  var task = [(cb) =>{
    mysqlConnection.query("SELECT * FROM Users WHERE account = ?", [body.account], (err, result, fields)=>{
        if(result.length > 0){
          return res.json({"status": "success", "message": "이미 등록된 계정입니다."})
        }else {
          cb(err)
        }
    })
  }, (cb) =>{
    mysqlConnection.query("CALL ddd.User_Add(?,?,?)", params, (err, result, field)=>{
      cb(err, result[0][0].userId)
    })
  }]

  async.waterfall(task, (err, result)=>{
    if(err){
      return res.json({"status": "fail", "error": err.code})
    }else{
      return res.json({"status": "success", "userId": result})
    }
  })
})

module.exports = router;

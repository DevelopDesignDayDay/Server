var express = require('express');
var router = express.Router();
var mysqlConnection = require('../middlewares/mysqlConnection')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/**
 *  Login
 */
router.post('/login', (req,res)=>{
  var body = req.body
  var params = [body.account, body.password]

  mysqlConnection.query("SELECT id, name, account FROM Users WHERE account = ? AND password= ?", params,(err, result, field)=>{
    if(err){
      return res.json({"status": "fail", "error": err.code})
    }else{
      if(result.length > 0){
        return res.json({"status": "success", "user": result[0]})
      }else {
        return res.json({"status": "success", "user": null, "message": "잘못된 계정 정보입니다"})
      }
    }
  })
})

module.exports = router;

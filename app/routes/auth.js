var express = require('express');
var router = express.Router();
var mysqlConnection = require('../middlewares/mysqlConnection')


/**
 * @swagger
 *  /auth/login:
 *    post:
 *      tags: [Auth]
 *      summary: 로그인
 *      consumes:
 *        - application/x-www-form-urlencoded
 *      parameters:
 *        - in: formData
 *          required: true
 *          type: string
 *          name: account
 *          description: 계정 ID (testing DDD1)
 *        - in: formData
 *          required: true
 *          type: string
 *          name: password
 *          description: 계정 비밀번호 (testing ddd1)
 *      responses:
 *        200 :
 *           description: 로그인 성공
 *           example:
 *              status: success
 *              user: {
 *                  id: 5,
 *                  name: 유저 이름,
 *                  account: 계정 ID
 *              }
 * 
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
          return res.json({"status": "fail", "user": null, "message": "잘못된 계정 정보입니다"})
        }
      }
    })
  })

module.exports = router;

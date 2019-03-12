require('dotenv').config({ path: __dirname + '/../../.env' });
var express = require('express');
var mysqlConnection = require('../middlewares/mysqlConnection')
var jwtMiddleware = require('../middlewares/jwtMiddleware');
var router = express.Router();
var async = require('async')


/**
 * @swagger
 *  /users:
 *    post:
 *      tags: [User]
 *      summary: 유저 등록 
 *      security:
 *        - basicAuth: 
 *            type: basic
 *      consumes:
 *        - application/x-www-form-urlencoded
 *      parameters:
 *        - in: formData
 *          required: true
 *          type: string
 *          name: account
 *          description: 계정 ID 
 *        - in: formData
 *          required: true
 *          type: string
 *          name: password
 *          description: 계정 비밀번호
 *        - in: formData
 *          required: true
 *          type: string
 *          name: name
 *          description: 유저 이름
 *        - in: formData
 *          required: true
 *          type: string
 *          name: email
 *          description: 이메일
 *        - in: formData
 *          required: true
 *          type: string
 *          name: code
 *          description: 가입 코드
 *        - in: formData
 *          required: true
 *          type: number
 *          name: type
 *          description: '유저 타입 (1: 일반; 2: 운영진)'     
 *      responses:
 *        '200' :
 *           description: success
 *           example:
 *              status: success
 *              userId: 3
 *        '400' :
 *           description: failed
 *           example:
 *              status: failed
 *              message: 이미 등록된 계정입니다/ 유효하지 않은 유저 타입입니다
 *        '401':
 *          description: Unauthorized
 *          example:
 *            status: failed
 *            message: Unauthorized
 * 
 */
router.post('/', (req, res) => {
  const auth = { username: process.env.AUTH_USERNAME, password: process.env.AUTH_PASSWORD }
  const base64Credentials = (req.headers.authorization || '').split(' ')[1] || ''
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
  const [username, password] = credentials.split(':')

  if (!username || !password || username != auth.username || password != auth.password) {
    res.status(401).json({ "status": "failed", "message": "Unauthorized" })
    return
  } else {
    var body = req.body
    var params = [body.account, body.password, body.name, body.type, body.email]

    if(body.code != process.env.JOIN_SECRET_CODE){
      res.status(400).json({ "status": "failed", "message": "가입 코드가 일치하지 않습니다." })
      return
    }

    var task = [(cb) => {
      mysqlConnection.query("SELECT * FROM Users WHERE account = ?", [body.account], (err, result, fields) => {
        if (result.length > 0) {
          res.status(400).json({ "status": "failed", "message": "이미 등록된 계정입니다." })

        } else {
          cb(err)
        }
      })
    }, (cb) => {
      mysqlConnection.query("CALL ddd.User_Add(?,?,?,?,?)", params, (err, result, field) => {
        var userId = result[0][0].userId
        if (userId > 0) {
          cb(err, userId)
        } else {
          res.status(400).json({ "status": "failed", "message": "유효하지 않은 유저 타입입니다." })
        }
      })
    }]

    async.waterfall(task, (err, result) => {
      if (err) {
        res.status(500).json({ "status": "failed", "error": err.message })
        return
      } else {
        return res.json({ "status": "success", "userId": result })
      }
    })
  }

})

module.exports = router;

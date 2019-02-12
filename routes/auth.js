require('dotenv').config({ path: __dirname + '/../../.env' });
var express = require('express');
var router = express.Router();
var mysqlConnection = require('../middlewares/mysqlConnection')
var jwt = require('jsonwebtoken')

const ACCESS_TOKEN_EXPIRES = 3600 * 3
const REFRESH_TOKEN_EXPIRES = 3600 * 5
const TYPE_ADMIN = 1

/**
 * @swagger
 *  /auth/login:
 *    post:
 *      tags: [Auth]
 *      summary: 로그인 (토큰 발급)
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
 *          description: 계정 ID (testing ddd1)
 *        - in: formData
 *          required: true
 *          type: string
 *          name: password
 *          description: 계정 비밀번호 (testing ddd1)
 *      responses:
 *        200 :
 *           description: success
 *           example:
 *              status: success
 *              user: {
 *                  id: 5,
 *                  name: 유저 이름,
 *                  account: 계정 ID,
 *                  type: 유저 타입
 *              }
 *              isProgress: true 
 *              accessToken: ..
 *              refreshToken: ..
 *        401:
 *          description: failed
 *          example:
 *            status: failed
 *            message: Authentication Error
 * 
 */
router.post('/login', (req, res) => {
  const auth = { username: 'ddd', password: "dddAdmin123" }
  const base64Credentials = (req.headers.authorization || '').split(' ')[1] || ''
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
  const [username, password] = credentials.split(':')

  if (!username || !password || username != auth.username || password != auth.password) {
    res.status(401).json({ "status": "failed", "message": "Authentication Error" })
    return
  } else {
    var body = req.body
    var params = [body.account, body.password]

    mysqlConnection.query("SELECT id, name, account, type_id as type FROM Users WHERE account = ? AND password= ?", params,
      (err, result, field) => {
        if (err) {
          return res.json({ "status": "failed", "error": err.code })
        } else {
          if (result.length > 0) {
            // get jwt access token 
            var json = JSON.parse(JSON.stringify({
              user: result[0]
            }))

            var accessToken = getTokens(json, ACCESS_TOKEN_EXPIRES)
            var refreshToken = getTokens(json, REFRESH_TOKEN_EXPIRES)

            if(result[0].type == TYPE_ADMIN){
              return res.json({
                "status": "success", "user": result[0],
                "isProgress": global.number == -1 ? false : true,
                "accessToken": accessToken, "refreshToken": refreshToken
              })
            }else {
              return res.json({
                "status": "success", "user": result[0],
                "accessToken": accessToken, "refreshToken": refreshToken
              })
            }
            
          } else {
            return res.json({ "status": "failed", "user": null, "message": "잘못된 계정 정보입니다" })
          }
        }
      })
  }
})

function getTokens(json, expiresIn) {
  const key = process.env.JWT_SECRET_KEY
  var token = jwt.sign(json, key, {
    expiresIn: expiresIn,
    algorithm: 'HS512'
  })
  return token
}

module.exports = router;

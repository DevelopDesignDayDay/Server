require('dotenv').config({ path: __dirname + '/../../.env' });
var express = require('express');
var mysqlConnection = require('../middlewares/mysqlConnection')
var jwtMiddleware = require('../middlewares/jwtMiddleware');
var router = express.Router();
var async = require('async')
var url = require('url')
var queryString = require('querystring')


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
 *        - in: formData
 *          required: false
 *          type: number
 *          name: team
 *          description: '팀 (1: AOS; 2: IOS, 3: 서버, 4: 디자인)' 
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
  if (!isAuthorized(req)) {
    return res.status(401).json({ "status": "failed", "message": "Unauthorized" })
  } else {
    var body = req.body
    var params = [body.account, body.password, body.name, body.type, body.email, body.team]

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
    },(cb)=>{
      if(body.team != null){
        mysqlConnection.query("SELECT * FROM Teams WHERE id = ?", [body.team], (err, result, fields)=>{
          if(result.length > 0){ 
            cb(err)
          }else {
            res.status(400).json({ "status": "failed", "message": "유효하지 않은 팀 id 입니다." })
          }
        })
      }else {
        cb(null)
      }
    },
     (cb) => {
      mysqlConnection.query("CALL ddd.User_Add(?,?,?,?,?,?)", params, (err, result, field) => {
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

/**
 * @swagger
 *  /users/find:
 *    get:
 *      tags: [User]
 *      summary: 유저 아이디 검색
 *      security:
 *        - basicAuth: 
 *            type: basic
 *      parameters:
 *        - in: query
 *          required: true
 *          type: string
 *          name: name
 *          description: 유저 명
 *      responses:
 *        '200' :
 *           description: success
 *           example:
 *              status: success
 *              name: 김유저 
 *              account: 아이디
 *              team: 소속 섹션 팀
 *        '400' :
 *           description: failed
 *           example:
 *              status: failed
 *              message: 존재하지 않는 유저 명 입니다.
 *        '401':
 *          description: Unauthorized
 *          example:
 *            status: failed
 *            message: Unauthorized
 */
router.get("/find", (req,res)=>{
  if (!isAuthorized(req)) {
    return res.status(401).json({ "status": "failed", "message": "Unauthorized" })
  }else {
    var parseUrl = url.parse(req.url)
    var parseQuery =  queryString.parse(parseUrl.query, '&', '=')
    var query = "SELECT	u.name as name, u.account as account, if(t.name is null, '미지정', t.name) as team FROM Users u  LEFT JOIN	Teams t ON u.team_id = t.id WHERE	u.name = ?"

    mysqlConnection.query(query, [parseQuery.name], (err, result)=>{
      if(err){
        return res.status(500).json({ "status": "failed", "error": err.message })
      }else {
        if(result.length > 0){
          return res.json({ "status": "success", "account": result[0].account, "name": result[0].name, "team": result[0].team})
        }else{
          return res.status(400).json({ "status": "failed", "message": "존재하지 않는 유저 명 입니다."})
        }
      }
    })
  }
})

function isAuthorized(req){
  const auth = { username: process.env.AUTH_USERNAME, password: process.env.AUTH_PASSWORD }
  const base64Credentials = (req.headers.authorization || '').split(' ')[1] || ''
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
  const [username, password] = credentials.split(':')

  if (!username || !password || username != auth.username || password != auth.password) {
    return false
  }else {
    return true
  }
}
module.exports = router;

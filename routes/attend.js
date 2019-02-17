var express = require('express')
var async = require('async')
var mysqlConnection = require('../middlewares/mysqlConnection')
var jwtMiddleware = require('../middlewares/jwtMiddleware');
var router = express.Router();
require('date-utils')

const SECOND = 1000
var INTERVAL = SECOND * 60
var IS_CLOSED = -1
global.number = IS_CLOSED

/**
 * @swagger
 *  /attends/start :
 *    post:
 *      tags: [Attend]
 *      summary: 출석 시작
 *      responses:
 *        '200' :
 *           description: success
 *           example:
 *              status: success
 *              number: 53
 *              expire: 2019-01-01 15:03:58
 *        '400' :
 *           description: failed
 *           example:
 *              status: failed
 *              message: 이미 출석 체크가 시작되었습니다.
 * 
 */
router.post("/start", jwtMiddleware(), (req, res) => {
    var current = new Date()
    var date = current.toFormat('YYYY-MM-DD')
    var time = current.toFormat('HH24:MI:SS')

    if (global.number == IS_CLOSED) {
        mysqlConnection.query("CALL ddd.Date_Add(?, ?)", [date, time],
            (err, result, fields) => {
                if (err) {
                    return res.status(err.code).json({ "status": "failed", "error": err.code })
                } else {
                    global.number = Math.floor(Math.random() * (99 - 10)) + 10
                    setTimeout(() => { number = IS_CLOSED }, INTERVAL)

                    var expire = new Date(current.setMinutes(current.getMinutes() + (INTERVAL / 60000))).toFormat('YYYY-MM-DD HH24:MI:SS')
                    return res.json({ "status": "success", "number": global.number, "expire": expire })
                }
            })
    } else {
        res.status(400).json({ "status": "failed", "number": global.number, "message": "이미 출석 체크가 시작되었습니다." })
        return
    }
})

/**
 * @swagger
 *  /attends/end :
 *    post:
 *      tags: [Attend]
 *      summary: 출석 종료
 *      responses:
 *        200 :
 *           description: success
 *           example:
 *              status: success
 *        '400' :
 *           description: failed
 *           example:
 *              status: failed
 *              message: 이미 출석 체크가 종료되었습니다.
 * 
 */
router.post("/end", jwtMiddleware(), (req, res) => {
    var current = new Date()
    var date = current.toFormat('YYYY-MM-DD')
    var time = current.toFormat('HH24:MI:SS')

    if (global.number == IS_CLOSED) {
        res.status(400).json({ "status": "failed", "number": global.number, "message": "이미 출석 체크가 종료되었습니다." })
        return
    } else {
        mysqlConnection.query('CALL ddd.Date_Update_ForEndTime(?,?)', [date, time],
            (err, result, fields) => {
                if (err) {
                    res.status(err.code).json({ "status": "failed", "message": err.message })
                    return
                } else {
                    global.number = IS_CLOSED
                    return res.json({ "status": "success" })
                }
            })
    }
})

/**
* @swagger
*  /attends/check:
*    post:
*      tags: [Attend]
*      summary: 출석 체크 
*      consumes:
*        - application/x-www-form-urlencoded
*      parameters:
*        - in: formData
*          required: true
*          type: string
*          name: userId
*          description: 유저 ID
*        - in: formData
*          required: true
*          type: string
*          name: number
*          description: 출석 입력 숫자
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
*              message: 출석체크가 종료되었습니다/ 이미 출석체크가 완료되었습니다/ 유효하지 않은 번호입니다
* 
*/
router.post("/check", jwtMiddleware(), (req, res) => {
    var body = req.body
    var userId = body.userId
    var checkNum = body.number

    if (global.number == IS_CLOSED) {
        res.status(400).json({ "status": "failed", "message": "출석체크가 종료되었습니다." })
        return
    } else if (global.number == checkNum) {
        var date = new Date().toFormat('YYYY-MM-DD')

        var task = [(cb) => {
            mysqlConnection.query('SELECT id FROM Dates WHERE date=?', [date], (err, result, fields) => {
                var dateId = result[0].id
                cb(err, dateId)
            })
        }, (dateId, cb) => {
            mysqlConnection.query('SELECT * FROM Attendances WHERE user_id = ? AND date_id = ?', [userId, dateId], (err, result, fields) => {
                if (result.length > 0) {
                    res.status(400).json({ "status": "failed", "message": "이미 출석체크가 완료되었습니다." })
                    return
                } else {
                    cb(err, dateId)
                }
            })
        }, (dateId, cb) => {
            mysqlConnection.query('INSERT INTO Attendances (user_id, date_id) VALUES (?, ?)', [userId, dateId], (err, result, fields) => {
                cb(err)
            })
        }]

        async.waterfall(task, (err, result) => {
            if (err) {
                res.status(err.code).json({ "status": "failed", "message": err.message })
                return
            } else {
                return res.json({ "status": "success", "message": "출석체크가 완료되었습니다." })
            }
        })
    }
    else {
        res.status(400).json({ "status": "failed", "message": "유효하지 않은 번호입니다." })
        return
    }
})

/**
* @swagger
*  /attends/time:
*    put:
*      tags: [Attend]
*      summary: 출석 입력 번호 유효 시간 
*      parameters:
*        - in: query
*          required: true
*          type: integer
*          name: minutes
*          description: 분 단위로 입력
*      responses:
*        '200' :
*           description: success
*           example:
*              status: success
*              minutes: 3
* 
*/
router.put('/time', jwtMiddleware(), (req, res) => {
    var minutes = req.query.minutes
    if (typeof minutes != global.number) {
        minutes = parseInt(minutes)
    }

    INTERVAL = (10000 * 6) * minutes
    return res.json({ "status": "success", "minutes": minutes })
})

module.exports = router;
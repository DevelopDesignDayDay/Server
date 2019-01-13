var express = require('express')
var async = require('async')
var mysqlConnection = require('../middlewares/mysqlConnection')
var router = express.Router();
require('date-utils')

var INTERVAL = 10000 * 6
var IS_CLOSED = -1
var number = IS_CLOSED

/**
 * 출석 시작 (시간: KST)
 */
router.post("/start",(req, res)=>{
    var current = new Date()
    var date = current.toFormat('YYYY-MM-DD')
    var time = current.toFormat('HH24:MI:SS')

    mysqlConnection.query("CALL ddd.Date_Add(?, ?)", [date, time],
        (err, result, fields) =>{
            if(err){
                return res.json({"status": "fail", "error": err.code})
            }else {
                number = Math.floor(Math.random() * (99 - 10)) + 10
                setTimeout(()=>{number = IS_CLOSED}, INTERVAL)
                return res.json({"status": "success", "dateId": result[0][0].id, "number": number})
            }
        })
})

 /**
 * 출석 종료 (시간: KST)
 */
router.post("/end", (req, res)=>{
    var current = new Date()
    var date = current.toFormat('YYYY-MM-DD')
    var time = current.toFormat('HH24:MI:SS') 

    if(number == IS_CLOSED){
        return res.json({"status": "success", "message": "이미 출석이 종료되었습니다."})
    }else {
        mysqlConnection.query('CALL ddd.Date_Update_ForEndTime(?,?)', [date, time],
        (err, result, fields) =>{
            if(err){
                return res.json({"status": "fail", "error": err.code})
            }else {
                number = IS_CLOSED
                return res.json({"status": "success"})
            }
        })
    }
   
})

 /**
 * 출석 체크
 */
router.post("/:id/check", (req,res)=>{
    var dateId = req.params.id
    var userId = req.query.userId
    var checkNum = req.query.number

    if(number == IS_CLOSED){
        return res.json({"status": "success", "message": "출석체크가 종료되었습니다."})
    }else if(number == checkNum){
        var task = [(cb)=>{
            mysqlConnection.query('SELECT * FROM Attendances WHERE user_id = ?', [userId], (err, result, fields)=>{
                if(result.length > 0){
                    return res.json({"status": "success", "message" : "이미 출석체크가 되었습니다."})
                }else {
                    cb(err)
                }
            })
        }, (cb)=>{
            mysqlConnection.query('INSERT INTO Attendances (user_id, date_id) VALUES (?, ?)', [userId, dateId], (err, result, fields)=>{
                cb(err)
            })
        }]

        async.waterfall(task, (err, result)=>{
            if(err){
                return res.json({"status": "fail", "error" : err.code})
            }else {
                return res.json({"status": "success", "message" : "출석체크가 완료되었습니다."})
            }
        })
    }
    else {
        return res.json({"status": "success", "message": "유효하지 않은 번호입니다."})
    }
})

module.exports = router;
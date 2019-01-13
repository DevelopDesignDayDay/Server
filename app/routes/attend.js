var express = require('express');
var mysqlConnection = require('../middlewares/mysqlConnection')
var router = express.Router();


/**
 * 출석 시작
 *  - query: 현재 날짜 (IF 날짜 등록이 안되어있으면 날짜 등록)
 */
router.post((req, res)=>{
    // 1. 랜덤 숫자 생성 
    // 2. attend start time 등록
})

 /**
 * 출석 종료 
 *  - 종료 시간 등록
 *  - query: 현재 시간 
 */
router.post((req, res)=>{
    
})

 /**
 * 출석 체크
 *  - query: 유저 Id, attend Id
 */
router.post((req,res)=>{

})
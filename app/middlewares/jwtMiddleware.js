require('dotenv').config({path:__dirname+'/../../.env'});

const jwtMiddleware = require("jsonwebtoken")
const mysqlConnection = require('../middlewares/mysqlConnection')

module.exports = ()=> function verifyToken(req,res,next) {
    const token = req.headers.authorization
    const jwt = req.jwtid;
    const key = process.env.JWT_SECRET_KEY
    jwtMiddleware.verify(token, key, (err, decode)=>{
        if(err){
           return res.json({"status": "fail", "message" : "Unauthorized" })
        }else {
            next()
        }
    })
}


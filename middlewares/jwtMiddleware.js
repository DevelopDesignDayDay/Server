require('dotenv').config({path:__dirname+'/../../.env'});

const jsonwebtoken = require("jsonwebtoken")
const mysqlConnection = require('../middlewares/mysqlConnection')

module.exports = ()=> function verifyToken(req,res,next) {
    const token = req.headers.authorization
    const jwt = req.jwtid;
    const key = process.env.JWT_SECRET_KEY
    jsonwebtoken.verify(token, key, {algorithms: ['HS512']},(err, decode)=>{
        if(err){
           return res.status(401).json({"status": "failed", "message" : "Invalid Token" })
        }else {
            next()
        }
    })
}


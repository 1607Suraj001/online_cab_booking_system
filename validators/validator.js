const JOI = require('joi')

exports.signup = (req, res, next) => {
  console.log("validator")
    const schema = JOI.object().keys({
        email: JOI.string().email({ minDomainAtoms: 2 }).required(),
        phone: JOI.number().min(1000000000).max(9999999999),
        password: JOI.string().regex(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{5,30}$/).required(),
        confrm_password: JOI.string().regex(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{5,30}$/).required(),
        fname: JOI.string().min(3).max(20).required(),
        lname: JOI.string().optional(),
    });
    console.log("resqust body ",req.body)
    JOI.validate(req.body, schema, (err, result) => {
        if (err) {
            console.log("ER +++",err.details[0].message)
            res.json({
                "statusCode": 400,
                "error": "Bad Request",
                "message": err.details[0].message
            });
        }
        else {
            console.log('write_place')
            if (req.body.password === req.body.confrm_password) {
               next();  
            }
            else
            {
                console.log("Password Not Matched ")
                res.json({
                    "status_code":400,
                    "error":"Bad Request",
                    "message" : "Confirm Password Not Matched"
                })
            }

        }
    });
};

/******LOGIN VALIDATION****/
exports.login = (req, res, next)=>{
    const schema = JOI.object().keys({
        email : JOI.string().email({minDomainAtoms:2}).required(),
        password : JOI.string().regex(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{5,30}$/).required()
    })
    JOI.validate(req.body, schema, (err,result)=>{
        if(err){
            console.log("ERR ++",err.details[0].message)
            res.json({
                "ststusCode" : 400,
                "error" : "Bad Request",
                "Message" : err.message
            })
        }
        else
         next();
    })
}
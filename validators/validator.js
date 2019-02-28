const JOI = require('joi')
const response = require('../services/responses.js')
exports.signup = (req, res, next) => {
  console.log("validator")
    const schema = JOI.object().keys({
        email: JOI.string().email({ minDomainAtoms: 2 }).required(),
        phone: JOI.number().min(1000000000).max(9999999999).required(),
        password: JOI.string().regex(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{5,30}$/).required(),
        confrm_password: JOI.string().regex(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{5,30}$/).required(),
        fname: JOI.string().min(3).max(20).required(),
        lname: JOI.string().required()
    });
    console.log("resqust body ",req.body)
    JOI.validate(req.body, schema, (err, result) => {
        if (err) {
            console.log("ER +++",err.details[0].message)
            response.bad_request(res,err);
        }
        else {
            console.log('write_place')
            if (req.body.password === req.body.confrm_password) {
               next();  
            }
            else
            {
                console.log("Password Not Matched ")
                response.bad_success(res,"Bad Request","Confirm Password Not Matched")
              
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
    JOI.validate(req.query, schema, (err,result)=>{
        if(err){
            console.log("ERR ++",err.details[0].message)
           response.bad_request(res,err);
        }
        else
         next();
    })
}
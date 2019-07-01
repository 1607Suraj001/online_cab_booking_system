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

/*********Card Validation ****/
exports.card_validation = (req,res,next)=>{
    const schema = JOI.object().keys({
        number : JOI.number().min(1000000000000000).max(9999999999999999).required(),
        exp_month : JOI.number().min(1).max(12).required(),
        exp_year : JOI.number().min(2019).max(2050).required(),
        cvc : JOI.number().min(000).max(999).required()
    })
    JOI.validate({number:req.query.number,exp_month:req.query.exp_month,exp_year:req.query.exp_year,cvc:req.query.cvc},schema,(err,result)=>{
        if(err){
            console.log("ERR ++ ",err.details[0].message)
            response.bad_request(res,err)
        }
        else
        next()
    })
}

/**************VAlidate Payment ****/
exports.validate_payment = (req,res,next)=>{
const schema = JOI.object().keys({
    amount : JOI.number().min(0).required(),
    currency : JOI.string().valid('usd').required(),
    description : JOI.string().required()    
})

JOI.validate({amount:req.body.amount,currency:req.body.currency,description:req.body.description},schema,(err,result)=>{
    if(err){
        console.log("ERR ++ ",err.details[0].message)
        response.bad_request(res,err)
    }
    else if(result)
    next()
})
}
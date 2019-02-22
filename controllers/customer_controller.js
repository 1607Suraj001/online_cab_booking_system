const BCRYPT = require('bcryptjs')
const JWT = require('jsonwebtoken')
const DBSTATEMENT = require('../constants/dbquery.js')
const DBA = require('../config/libs.js')
const Promise = require('bluebird')

const SECRET_KEY= '1234@abcd';

/////////////  CUSTOMER HANDLER ///////////

let customer_id;
let email;
let rest;
/*********CUSTOMER is already registered */
exports.customer_is_already_registered = async (req, res, next) => {
    console.log("customer is already registered")
     email = req.body.email;
     rest;
    try{
     rest = await DBA.execQuery(DBSTATEMENT.customer_data, email)
    }
    catch(err)
    {
        res.json({
            "status_code":400,
            "message":"Customer Not registred",
            "data" : rest
        })
    }
    finally{
    if (rest) {
        if (rest.length) {
            res.json({
                "statusCode": 400,
                "Error": "Bad Request",
                "message": "User Already Registered"
            })
        }
        else {
            next();
        }
    }
}
}

/****************CUSTOMER signup */
exports.customer_signup = async (req, res, next) => {
    console.log("customer_signup")
    
    let salt = BCRYPT.genSaltSync(10);
    let password = BCRYPT.hashSync(req.body.password, salt);
    let obj = [req.body.fname, req.body.lname, req.body.email, password, req.body.phone];
    console.log("In sign up function")
    try{
    rest = await DBA.execQuery(DBSTATEMENT.customer_signup, obj)
    }
    catch(err)
    {
        res.json({
            "status_code":400,
            "message":"error in customer signup",
            "data":rest
        })
    }
    finally{
    if (rest) {
        console.log("Rest ++++ ", rest)
        let data = { User_Id: rest.insertId, firstname: obj[0], lastname: obj[1], email: obj[2], phone: obj[4] };

        res.json({
            "status": 201,
            "Message": 'Registered succesfully',
            "Data": data
        });
    }
    else {
        res.json({
            "status": 400,
            "Message": 'Invalid Username or Password',
            "ERROR": rest.ERROR
        });
    }
}
}
/**********CUSTOMER LOGIN ******/
exports.customer_login = async (req, res, next) => {
     email = req.query.email;

     rest = await DBA.execQuery(DBSTATEMENT.customer_data, email)

    if (rest[0]) {
        //saving customer_id for further use 
        customer_id = rest[0].customer_id;
        console.log("customer id from customer login ", customer_id)

        let v = await BCRYPT.compareSync(req.query.password, rest[0].customer_password);
        if (v) {
            let token = await JWT.sign(email, SECRET_KEY)

            if (token) {
                res.json({
                    "status": 200,
                    "Message": 'login successfully',

                    "Data": {
                        Token: token, id: rest[0].customer_id, fname: rest[0].customer_fname, lname: rest[0].customer_lname, email: rest[0].customer_email, phone: rest[0].customer_phone,
                        customer_request: rest[0].customer_request, customer_task_over: rest[0].customer_task_over
                    }
                });
            }
            else {
                res.json({
                    "status_code": 400,
                    "error": "Bad Request",
                    "message": "Token Generation Error"
                });
            }
        }
        else {
            res.json({
                "status_code": 400,
                "error": "Bad Request",
                "message": "Password Not Matched"
            })
        }

    }

    else {
        console.log('error last')
        res.json({
            "status_code": 400,
            "Error": "Bad Request",
            "Message": "Email Do Not Exist"
        })
    } 
}
/************Verify Customer */
exports.verify_customer = function(req,res,next){
    let token;
     token = req.query.token;
     
   
    JWT.verify(token,SECRET_KEY, function (err, decoded) {
        if (err)
        {
        console.log("err]]]]",err)
            res.json({
                "status_code": 400,
                "error": err.name,
                "message": err.message
            })
        }
            else {
            email = decoded;
            next();
        }
    })
}

/***********CUSTOMER BOOKING */
let booking_id;

exports.get_customer_id = async (req, res, next) => {
    try {
    customer_id = await DBA.execQuery(DBSTATEMENT.get_customer_id, email)
     }
     catch(err){
            res.json({
                "status_code": 400,
                "error": err.name,
                "message": err.Message
            })
        }
    finally{
        next();
    }

    console.log("Customer_id +++++++++ ", customer_id[0].customer_id)
}

/**************CUSTOMER BOOKING */

exports.book = async function(req, res, next){
    let obj = [customer_id[0].customer_id, req.body.source_lat, req.body.source_long, req.body.dest_lat, req.body.dest_long]

    console.log("Object ;++++++ ;", obj);
    let rest;
      try{
    rest = await DBA.execQuery(DBSTATEMENT.book, obj) 
}
    catch(err)
        {
            console.log("error section ")
            res.json({
                "status_code": 400,
                "error": "Booking Not Placed",
                "message": err.message
            })
        }
    finally{     
    console.log("rest ++++-------", rest)
    if (rest.insertId != 0) {
        booking_id = rest.insertId;
        res.json({
            "status_code": 200,
            "message" : "Booking Successfully Placed But Not Confirmed",
            "data" : {"booking_id":rest.insertId}
        })
    }
    else{
        res.json({
            "status_code":400,
            "message" : "unable to place booking successfully",
        })
    }
}
}
/**************GET all customer booking */

exports.get_all_confirmed_bookings = function(req,res,next){
    Promise.coroutine(function*(){
        console.log("customer_id")
        return  yield DBA.execQuery(DBSTATEMENT.get_all_confirmed_bookings,[customer_id[0].customer_id]);    
       })().then ((value)=>{
           if(value){
               res.json({
                   "status_code":200,
                   "message":"list of all confirmed bookings",
                   "data" : value
               })
           }
               else
               {
                   res.json({
                       "status_code":400,
                       "message":"Error in getting list of all confirmed the bookings",
                       "data" : value
                   })
               }
           }) 

}

/*************Get all pending booking */
exports.get_all_pending_bookings = function(req,res,next){
    Promise.coroutine(function*(){
        console.log("customer_id .........",customer_id)
        return  yield DBA.execQuery(DBSTATEMENT.get_all_pending_bookings,[customer_id[0].customer_id]);    
       })().then ((value)=>{
           if(value){
               res.json({
                   "status_code":200,
                   "message":"list of all pending bookings",
                   "data" : value
               })
           }
               else
               {
                   res.json({
                       "status_code":400,
                       "message":"Error in getting list of all pending bookings",
                       "data" : value
                   })
               }
           }) 

}

/*/**************UPDATE BOOKING CUSTOMER 
exports.update_booking_customer = async (req, res, next)=>{
  console.log("hit made")
    let rest = await DBA.execQuery(DBSTATEMENT.update_booking_customer,[1,customer_id[0].customer_id],function(err){
        if(err)
        {
            res.json({
                "status_code" : 400,
                "error": "Booking placement error",
                "Message" : err.message
            })
        }
    })

    console.log("hit rest ++++++ ",rest)
    if(rest)
    {
        console.log("update booking customer ++++ ",rest)
    }
}*/


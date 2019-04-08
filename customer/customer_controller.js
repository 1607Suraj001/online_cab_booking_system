const BCRYPT = require('bcryptjs')
const JWT = require('jsonwebtoken')
const DBSTATEMENT = require('../services/dbquery.js')
const DBA = require('../services/libs.js')
const Promise = require('bluebird')
const response = require('../services/responses.js')
const STRIPE = require("stripe")("sk_test_VKx3WB88ZMtNTt9LOueZcvhz00Rnplefkz");
const PAYMENT_FUNCTIONS = require('../services/payment_functions')
const NODEMAILER = require('nodemailer')
const REDIS = require('redis');


const SECRET_KEY = '1234@abcd';

/////////////  CUSTOMER HANDLER ///////////

let customer_id;
let email;
let rest;
let card_token;
let nearest_driver;
let booking_id;

/*********CUSTOMER is already registered */
exports.customer_is_already_registered = async (req, res, next) => {
    console.log("customer is already registered")
    email = req.body.email;
    rest;
    try {
        rest = await DBA.execQuery(DBSTATEMENT.customer_data, email)
    }
    catch (err) {
        response.bad_success(res, rest, "Customer Not Registered")
    }
    finally {
        if (rest) {
            if (rest.length) {
                console.log("current stop")
                response.error(res, "Bad Request", "User Already Registered")
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
    try {
        rest = await DBA.execQuery(DBSTATEMENT.customer_signup, obj)
    }
    catch (err) {
        response.bad_success(res, rest, "error in customer signup")
    }
    finally {
        if (rest) {
            console.log("Rest ++++ ", rest)
            let data = { User_Id: rest.insertId, firstname: obj[0], lastname: obj[1], email: obj[2], phone: obj[4] };

            response.success(res, "Registered succesfully", data)

        }
        else {
            response.bad_success(res, rest, "Invalid Username or Password")
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
                response.error(res, "Bad Request", "Token Generation Error")

            }
        }
        else {
            response.error(res, "Bad Request", "Password Not Matched")
        }

    }

    else {
        console.log('error last')
        response.error(res, "Bad Request", "Email Do Not Exist")

    }
}
/************Verify Customer */
exports.verify_customer = function (req, res, next) {
    let token;
    token = req.query.token;


    JWT.verify(token, SECRET_KEY, function (err, decoded) {
        if (err) {
            console.log("err]]]]", err)
            response.bad_request(res, err)
        }
        else {
            email = decoded;
            next();
        }
    })
}

/*************Creating Customer Payment Dashboard */
exports.create_customer_payment_gateway = async function (req, res, next) {
    let flag;

    try {
        customer_id = await DBA.execQuery(DBSTATEMENT.get_customer_id, email)
        console.log("Customer id ==+++ ", customer_id[0].customer_id)
    }
    catch (err) {
        response.error(res, err)
    }
    finally {
        try {
            flag = await DBA.execQuery(DBSTATEMENT.get_customer_id_from_customer_payment, customer_id[0].customer_id);
        }
        catch (err) {
            response.error(res, err)
        }
        finally {
            console.log("Flahg == :", flag)
            if (flag[0]) {
                console.log("next _)))")
                next()
            }
            else {
                STRIPE.customers.create({
                    description: email,
                    source: card_token.id // obtained with Stripe.js
                }, async function (err, customer) {
                    if (err)
                        response.bad_request(res, err);
                    else {
                        console.log("Customer Details", customer.id);
                        try {
                            let obj = await DBA.execQuery(DBSTATEMENT.create_customer_payment_dashboard, [customer_id[0].customer_id, customer.id, customer.created])
                        }
                        catch (err) {
                            response.error(res, err)
                        }
                        finally {
                            next()
                        }
                    }

                });
            }
        }
    }
}
/*********Generating card token  */
exports.generating_card_token = async (req, res, next) => {
    let flag;

    try {
        customer_id = await DBA.execQuery(DBSTATEMENT.get_customer_id, email);
        if (customer_id[0].customer_id)
            flag = await DBA.execQuery(DBSTATEMENT.get_customer_id_from_customer_payment, customer_id[0].customer_id)
        card_token = await PAYMENT_FUNCTIONS.generate_card_token(req, res);
        next();
    } catch (error) {
        response.error(res, error)
    }
}

/************Check Services Available */
exports.check_service_available = async (req, res,next) => {
    let flag, flag1;
    let source_lat = req.body.source_lat
    let source_long = req.body.source_long
    let dest_lat = req.body.dest_lat
    let dest_long = req.body.dest_long

    try {

        flag = await DBA.execQuery(DBSTATEMENT.check_service_available, [source_lat, source_long]);
        console.log("flag __-- ", flag[2][0][`if(contains(@r, @p),'yes','no')`])
        if (flag[2][0][`if(contains(@r, @p),'yes','no')`] === 'yes')
            flag1 = await DBA.execQuery(DBSTATEMENT.check_service_available, [dest_lat, dest_long]);

        if (flag[2][0][`if(contains(@r, @p),'yes','no')`] === 'yes' && flag1[2][0][`if(contains(@r, @p),'yes','no')`] === 'yes') {
            console.log("got it ")
            nearest_driver = await DBA.execQuery(DBSTATEMENT.get_nearest_driver, [1, customer_id[0].customer_id])
            console.log("Nearest_driver 000 ", nearest_driver)
            next();
        }
        else {
            response.error(res, "Uncovered Location", "No Services Available");
        }
    }
    catch (err) {
        console.log("Didnt got ", err)
        response.bad_request(res, err)
    }
}

/**************Save in redis  */
exports.save_in_redis = async function (req, res, next) {

    let CLIENT = REDIS.createClient();
    available_driver = nearest_driver[0].driver_id;

    console.log("booking_id 888",booking_id)
    try {
        customer_id = await DBA.execQuery(DBSTATEMENT.get_customer_id_from_booking, booking_id)
    }
    catch (err) {
        responses.error(res, err)
    }
    finally {
        CLIENT.on('error', function (err) {
            console.log('Something went wrong ', err)
        });

        CLIENT.hset(booking_id, 'driver_id', available_driver, REDIS.print);
        CLIENT.hset(booking_id, 'customer_id', customer_id[0].customer_id, REDIS.print);
        CLIENT.hset(booking_id, 'admin_id', "assigned_automatically", REDIS.print);

        let flag = await CLIENT.hgetall(booking_id, function (err, result) {
            console.log("REDIS DATA STORED :: ", result); // {"key":"value","second key":"second value"}
        });
       console.log("next executed;",flag)
        next();
    }
}

/***** Get booking details from redis  */
exports.redis_details = function (req, res) {

    let CLIENT = REDIS.createClient();

    
    CLIENT.hgetall(booking_id, function (err, result) {
        console.log("REDIS DATA STORED :: ", JSON.stringify(result)); // {"key":"value","second key":"second value"}
        res.json({
            "status_code": 200,
            "data": result
        })
    });
}

/************Update Driver Avilable */
exports.update_driver_available = async (req, res, next) => {
    console.log("In update driver available")
    let rest
    let available_driver = nearest_driver[0].driver_id;
    console.log("available drivers , bookingid", available_driver, booking_id)

    try {
        rest = await DBA.execQuery(DBSTATEMENT.update_driver_available, [0, booking_id, available_driver])

    }
    catch (err) {
        console.log("ERROR ", err)
        response.error(res, "Error in assigning booking to driver", err.message)

    }
    finally {
        console.log("rest -----", rest)
        if (rest.changedRows === 1) {
            next();
        }
    }
}


/*******Assign Driver Automatically */
exports.assign_nearest_driver_automatically = async (req, res, next) => {
   try {
        available_driver = nearest_driver[0].driver_id;
        console.log("adasd ,, dad", available_driver, booking_id)

        //checking whether resquest pending or not , if pending then assign driver independently otherwise free current driver 
        let data = await DBA.execQuery(DBSTATEMENT.check_whether_request_pending, [booking_id])
        console.log("data 0000", data[0].request_pending)
        if (data[0].request_pending === 1) {
            rest = await DBA.execQuery(DBSTATEMENT.assign_driver, [available_driver, 0, -1, booking_id])
        }
        else {  //case when request is being hold by another driver

            //getting current driver_id which is assigned to pending  request
            let data = await DBA.execQuery(DBSTATEMENT.get_current_assigned_driver_id, [booking_id])

            //assign new dreiver to pending request
            rest = await DBA.execQuery(DBSTATEMENT.assign_driver, [available_driver, 0, -1, booking_id])

            //update the row in driver_id of old driver
            rest = await DBA.execQuery(DBSTATEMENT.update_driver_available, [1, null, data[0].driver_id])
        }
    }

    catch (err) {
        console.log("lasr rest +++++===", rest)
        response.error(res, err.name, err.message)
    }
    finally {
        if (rest.changedRows === 1) {
            response.success(res, "Driver Successfully assigned and Booking Confirmed", {})
        }
        else {
            response.error(res, "Driver Not Assigned", "Internal Error")
        }
    }
}

/*********Send Email to Driver  */
exports.send_email_to_driver = async (req, res, next) => {
    let available_driver_email;
    let details;

    console.log("password ))) ", req.body.password)
    let transporter = NODEMAILER.createTransport({
        service: 'gmail',
        auth: {
            user: email,
            pass: req.body.password
        }
    });

    try {
        console.log("Available_driver_id : ", nearest_driver[0].driver_id)
        available_driver_email = await DBA.execQuery(DBSTATEMENT.get_driver_email, nearest_driver[0].driver_id)
        console.log("Available _ driver _ email : ", available_driver_email)
    }
    catch (err) {
        response.error(res, err)
    }
    finally {
        console.log("Available_driver_email : ", available_driver_email)

        try {
            details = await DBA.execQuery(DBSTATEMENT.get_booking_and_customer_details, booking_id)
        }
        catch (err) {
            responses.error(res, err)
        }
        finally {
            console.log("Request Email , available_driver_email", email, available_driver_email[0].driver_email)
            let mailOptions = {
                from: email,
                to: available_driver_email[0].driver_email,
                subject: 'New Booking Assigned',
                text: JSON.stringify(details[0])
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    response.bad_request(res, error)
                }
                else {
                    console.log('Email sent: ' + info.response);
                    next();
                    //response.success(res,info.response,info)
                }
            });
        }
    }
}

/*********** Storing card details of customer*/
exports.generating_customer_card_token_storing_card_details_of_customer = async (req, res, next) => {
    try {
        console.log("Customer Id ))) ", customer_id[0].customer_id)
        rest = await DBA.execQuery(DBSTATEMENT.get_customer_gateway, customer_id[0].customer_id)

    }
    catch (err) {
        console.log("Error ", err)
        response.bad_request(res, err)
    }
    finally {

        console.log("customer_gateway : ", rest[0].customer_gateway, "card _ toke : ", card_token.id)
        if (rest[0].customer_gateway) {

            card_token = await PAYMENT_FUNCTIONS.generate_card_token(req, res);

            STRIPE.customers.createSource(
                rest[0].customer_gateway,
                { source: card_token.id },
                async function (err, card) {
                    if (err) {
                        console.log("BBBB : ", err)
                        response.bad_request(res, err)
                    }
                    else {
                        console.log("token _ card : ", card)
                        try {
                            rest = await DBA.execQuery(DBSTATEMENT.store_customer_card, [customer_id[0].customer_id, card.id, card.object, card.exp_month, card.exp_year, card.fingerprint, card.funding, card.last4])
                        }
                        catch (err) {
                            response.bad_request(res, err)
                        }
                        finally {
                            console.log("rest 000 ", rest)
                            if (rest) {
                                response.success(res, "Customer Card Successfully Added", rest)
                            }
                            else {
                                response.error(res, "Error In Adding Customer Card", "Customer Card Not Added")
                            }
                        }
                    }
                }
            );
        }
    }
}
/***********CUSTOMER BOOKING */

exports.get_customer_id = async (req, res, next) => {
    try {
        customer_id = await DBA.execQuery(DBSTATEMENT.get_customer_id, email)
    }
    catch (err) {
        response.bad_request(res, err)
    }
    finally {
        next();
    }

    console.log("Customer_id +++++++++ ", customer_id[0].customer_id)
}

/**************CUSTOMER BOOKING */

exports.book = async function (req, res, next) {
    let obj = [customer_id[0].customer_id, req.body.source_lat, req.body.source_long, req.body.dest_lat, req.body.dest_long]

    console.log("Object ;++++++ ;", obj);
    let rest;
    try {
        rest = await DBA.execQuery(DBSTATEMENT.book, obj)
    }
    catch (err) {
        console.log("error section ")
        response.bad_success(res, err, "Booing Not Placed")

    }
    finally {
        console.log("rest ++++-------", rest)
        if (rest.insertId != 0) {
            booking_id = rest.insertId;

            next();
        }
        else {
            res.json({
                "status_code": 400,
                "message": "unable to place booking successfully",
            })
        }
    }
}

/**************GET all customer booking */

exports.get_all_confirmed_bookings = function (req, res, next) {
    Promise.coroutine(function* () {
        console.log("customer_id")
        return yield DBA.execQuery(DBSTATEMENT.get_all_confirmed_bookings, [customer_id[0].customer_id]);
    })().then((value) => {
        if (value) {
            response.success(res, "list of all confirmed bookings", value)

        }
        else {
            response.error(res, "Error in getting list of all confirmed the bookings", value)

        }
    })

}

/*************Get all pending booking */
exports.get_all_pending_bookings = function (req, res, next) {
    Promise.coroutine(function* () {
        console.log("customer_id .........", customer_id)
        return yield DBA.execQuery(DBSTATEMENT.get_all_pending_bookings, [customer_id[0].customer_id]);
    })().then((value) => {
        if (value) {
            response.success(res, "List of the pending bookings", value)

        }
        else {
            response.bad_success(res, value, "Error in getting list of all pending bookings")
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


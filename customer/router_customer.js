const EXPRESS = require('express')
const VALIDATOR = require('../validators/validator.js')
const BODYPARSER = require('body-parser')
const ROUTE = require('./customer_controller.js')

const ROUTER = EXPRESS.Router();

ROUTER.use(BODYPARSER.json());
ROUTER.use(BODYPARSER.urlencoded({extended : true}))

/*********USER API */
ROUTER.post('/signup',VALIDATOR.signup,ROUTE.customer_is_already_registered,ROUTE.customer_signup)
ROUTER.get('/login',VALIDATOR.login, ROUTE.customer_login);
ROUTER.post('/book',ROUTE.verify_customer,ROUTE.get_customer_id,ROUTE.book)
ROUTER.get('/all_confirmed_bookings',ROUTE.verify_customer,ROUTE.get_customer_id,ROUTE.get_all_confirmed_bookings)
ROUTER.get('/all_pending_bookings',ROUTE.verify_customer,ROUTE.get_customer_id,ROUTE.get_all_pending_bookings)
module.exports = ROUTER;

const EXPRESS = require('express')
const DB = require('./databases/mysql_connection.js')
const ROUTE = require('./admin/admin_controller.js')
const APP = EXPRESS();
const PORT = require('./config/port_config')

const ROUTER = require('./admin/router_admin')
const ROUTER_CUSTOMER = require('./customer/router_customer')
const ROUTER_DRIVER = require('./driver/router_driver')

const SWAGGERUI = require('swagger-ui-express')
const SWAGGERDOCUMENT = require('./swagger.json');
APP.use('/api-docs', SWAGGERUI.serve, SWAGGERUI.setup(SWAGGERDOCUMENT));

/******ADMIN API*****/
APP.use('/admin',ROUTER)
APP.use('/customer',ROUTER_CUSTOMER)
APP.use('/driver',ROUTER_DRIVER)
/******CUSTOMER API */

APP.listen(PORT.p.p0,function(err)
{
    if(err)
    console.log("Error in starting the server : ");
    else
    {
    console.log("Server started successfully on port : ",PORT.p.p0)
     DB.connection.connect((err) => {
         
         if(err)console.log('error while connecting to database')
         else
         console.log('database connected')
        }) 
}
})

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
         
         if(err)console.log('error while connecting to database',err)
         else
         console.log('database connected')
        }) 
}
})

/*set @r = GeomFromText('POLYGON((30.725471 76.675637,30.662898 76.735002,30.726582 76.827737,30.780039 76.783146,30.725471 76.675637))');
set @p = GeomFromText('POINT(30.725600 76.764208)');
select if(contains(@r, @p), 'yes', 'no');

SELECT ( 3959 * acos( cos( radians(42.290763) ) * cos( radians( 30.725600 ) ) 
   * cos( radians(76.764208) - radians(-71.35368)) + sin(radians(42.290763)) 
   * sin( radians(30.725600)))) AS distance
   

   ( 3959 * acos( cos( radians(42.290763) ) * cos( radians( locations.lat ) ) 
   * cos( radians(locations.lng) - radians(-71.35368)) + sin(radians(42.290763)) 
   * sin( radians(locations.lat)))) AS distance 
   * 
   * 
   * SELECT driver_id FROM `driver` WHERE (SELECT ( 3959 * acos( cos( radians(X(driver.driver_location)) ) * cos( radians(30.725600) ) ) 
   * cos( radians(Y(driver.driver_location))) - radians(-71.35368)) + sin(radians(X(driver.driver_location))) 
   * sin( radians(30.725600)) AS distance)
   * 
   /// Minimum Distance 
   SELECT DISTINCT  driver.driver_id ,booking.customer_id,MIN((SELECT ( 3959 * acos( cos( radians(X(driver.driver_location)) ) * cos( radians(booking.source_lat) ) ) 
   * cos( radians(Y(driver.driver_location))) - radians(booking.source_long)) + sin(radians(X(driver.driver_location))) 
   * sin( radians(booking.source_lat)) ))AS distance FROM `driver`,`booking` WHERE driver_available = 1 AND booking.customer_id = 3 ORDER BY distance ASC
    */
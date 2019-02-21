/***********************DATABASE Connection */

const MYSQL = require('mysql')

exports.connection = MYSQL.createConnection(
    {
        host : 'localhost',
        user : 'root',
        password : '',
        database : 'car_pooling'
    }

)
/***********************DATABASE Connection */

const MYSQL = require('mysql')

exports.connection = MYSQL.createConnection(
    {
        multipleStatements: true,
        host : 'localhost',
        user : 'root',
        password : '',
        database : 'car_pooling'
    }

)
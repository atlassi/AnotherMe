//<-------Require dependencies------>
const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

//<------configuring dependencies------->
const sequelize = new Sequelize('another-me', process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, {
    host: 'localhost',
    dialect: 'postgres',
    storage: './session.postgres'
})
app.use(express.static('../public'))
app.use(bodyParser.urlencoded({ extended: true }))

app.set('view engine', 'pug')
app.set('views', './views')

//<--------session store--------->
app.use(session({
    store: new SequelizeStore({
        db: sequelize,
        checkExpirationInteral: 15 * 60 * 1000,
        expiration: 24 * 60 * 60 * 1000
    }),
    secret: "another-me",
    saveUninitialized: true,
    resave: false
}))

//<----Defining models-------->
const User = sequelize.define('users',{
	name: Sequelize.STRING,
	email: Sequelize.STRING,
	password: Sequelize.STRING,
	phone: Sequelize.INTEGER,
	city: Sequelize.STRING
	address: Sequelize.STRING,
	availability: Sequelize.STRING
	service-provider: Sequelize.BOOLEAN,
},{ timestamps: false
})

const Role = sequelize.define('roles',{
	service: Sequelize.STRING,
	price: Sequelize.STRING,
},{timestamps: false
})

//<<-----------ROUTES------------->>

app.get('/', function(req,res){
	res.render("index")
})
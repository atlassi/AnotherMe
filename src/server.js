//<-------Require dependencies------>
const express = require('express');
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);

//<------configuring dependencies------->

const app = express();


const sequelize = new Sequelize('anotherme', process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, {
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

//<----------Defining models------------>
const User = sequelize.define('users',{
	name: Sequelize.STRING,
	email: Sequelize.STRING,
	password: Sequelize.STRING,
	phone: Sequelize.INTEGER,
	city: Sequelize.STRING,
	address: Sequelize.STRING,
	availability: Sequelize.STRING,
	serviceProvider: Sequelize.BOOLEAN
},{ timestamps: false
})

const Role = sequelize.define('roles',{
	service: Sequelize.STRING,
	price: Sequelize.STRING
},{timestamps: false
})

//<----defining relation between tables---->
User.hasMany(Role)

//<<-----------------ROUTES-------------------->>

//<----default page------->
app.get('/', function(req,res){
	let user = req.session.user
	res.render("index")
})

//<----search page(get)------>
app.get('search',function(req,res){
	res.render("search")
})

//<-----SIGNUP(post)------>
app.post('/signup',function(req,res){

let inputname = req.body.name;
    let email = req.body.email;
    let password = req.body.password;

    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
            User.create({
                name: inputname,
                email: email,
                password: hash
            }).then((user) => {
                req.session.user = user;
                res.render('index.pug')
            })

        });
    }) 

})

//<---------LOGIN(post)--------->
app.post('/login',function(req,res){
	res.redirect('/')
})

//<----Search for service providers(post)-->
app.post('/search',function(req,res){
	res.render('index')
})

//<-------ADD DETAILS(post)-------->
app.post('/addDetals',function(req,res){
	res.render('index')
})



sequelize.sync()
//<--------SERVER PORT----------->
app.listen(4000, function() {
    console.log("app is listening at port 4000")
})
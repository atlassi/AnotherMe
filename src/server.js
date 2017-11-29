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
	availability: Sequelize.BOOLEAN,
	serviceProvider: Sequelize.BOOLEAN
},{ timestamps: false
})

const Role = sequelize.define('roles',{
	service: Sequelize.STRING,
	price: Sequelize.STRING
},{timestamps: false
})

//<----defining relation between tables---->
User.hasMany(Role);
Role.belongsTo(User);

//<<-----------------ROUTES-------------------->>

//<----default page------->
app.get('/', (req,res)=>{
	let user = req.session.user
	res.render("home.pug")
})
app.get('/signup',(req,res)=>{
    let user = req.session.user
    res.render("signup.pug")
})
app.get('/login',(req,res)=>{
    let user = req.session.user
    res.render("login.pug")
})


//<-----SIGNUP(post)------>
app.post('/signup',function(req,res){

let inputname = req.body.name;
    let email = req.body.email;
    let city = req.body.city;
    let password = req.body.password;

    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(password, salt, function(err, hash) {
            User.create({
                name: inputname,
                email: email,
                password: hash,
                city:city
            }).then((user) => {
                req.session.user = user;
                res.render('signup.pug')
            })

        });
    }) 

})

//<---------LOGIN(post)--------->
app.post('/login',function(req,res){
	res.redirect('/')
})

//<--------------Search GET------------->
app.get('/search',function(req,res){
	res.render('search')
})

//<-------AJAX request search bar--------->
app.get('/submit',(req,res)=>{
    var service = req.query.service;
    console.log(`service input----------->${service}`)
    Role.findAll({
        where:{
            service: service
        },
        include:[{
            model: User
        }]
    }).then(users=>{
        users = users.map(data=>{
            return{
                users: data.user
            }
        })
        var output = users;
        console.log(`users with service---------->${JSON.stringify(users)}`)
        res.send({output:output})
    }).catch(err=>{
        console.log(err)
    })
    
})
app.get('/selected',(req,res)=>{
    let input = req.query.selected;
    console.log(`SELECTED NAME-------->${input}`)
    let message =`hello ${input}` 
    res.send({message: message})

})

//<--------add roles-------->
app.post('/addroles',function(req,res){
    let role = req.body.role;
    let price = req.body.price;
    let id = req.body.id;
    User.findOne({
        where:{
            id: id
        }
    }).then(user=>{
        user.createRole({
            service: role,
            price: price

        })
        res.redirect('/search')
    })

})

//<-------ADD DETAILS(post)-------->
app.post('/addDetails',function(req,res){
	res.render('index')
})



sequelize.sync()
//<--------SERVER PORT----------->
app.listen(3001, function() {
    console.log("app is listening at port 3000")
})
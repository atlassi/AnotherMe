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

//<----------Defining users table------------>
const User = sequelize.define('users', {
  firstname: Sequelize.STRING,
  lastname: Sequelize.STRING,
  postalcode: Sequelize.STRING,
  housenumber: Sequelize.STRING,
  street: Sequelize.STRING,
  city: Sequelize.STRING,
	email: Sequelize.STRING,
	password: Sequelize.STRING,
	phone: Sequelize.INTEGER,
  aboutme: Sequelize.TEXT,
  motto:Sequelize.TEXT,
	availability: Sequelize.BOOLEAN,
	serviceProvider: Sequelize.BOOLEAN
}, {
    timestamps: false
   })

//<----------Defining user roles table------------>
const Role = sequelize.define('roles',{
	service: Sequelize.STRING,
	price: Sequelize.STRING
},{timestamps: false
})

//<----defining relation between tables---->
User.hasMany(Role);
Role.belongsTo(User);

//------------------------------------------------------------------------------
//Routing
//------------------------------------------------------------------------------
//Home route
app.get('/', (req, res) => {
  res.render('index');

})

app.get('/sessionUpdate', (req, res) => {
res.send(req.session.user.firstname)
})


//<----default page------->
app.get('/home', (req,res)=>{
	let user = req.session.user
	res.render("home.pug")
})

//Signup page
app.get('/signup', (req, res) => {
  // console.log(req.session)
  res.render('signup')
})

//Create new user using data from signup page
app.post('/createuser', (req, res) => {
  if (req.body.password != req.body.password) {
    res.redirect('/?message=' + encodeURIComponent('Passwords need match'));
    return;
  }
  if (
    req.body.inputFirstname &&
    req.body.inputLastname &&
    req.body.inputEmail &&
    req.body.password &&
    req.body.password2
  ) {
    User.create({
        firstname: req.body.inputFirstname,
        lastname: req.body.inputLastname,
        email: req.body.inputEmail,
        password: req.body.password
      })
      .catch((error) => {
        console.log(error);
      })
    res.redirect('/');
  }
})
//<----------Profile------------->
app.get('/profile', (req, res) => {

  if (req.query.updateProfile){
    User.findOne({
      where: {
        id:req.session.user.id
      }
    })
    .then((user)=>{
      res.send({
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email
      })
    })
  }
  else res.render('profile', {
    usrProfile: req.session.user
  })
})



//<---------LOGIN(post)--------->
//Login route
app.post('/login', (req, res) => {
  let inputEmail = req.body.inputEmail;
  let inputPassword = req.body.password;
  if (inputEmail.length === 0) {
    res.redirect('/?message=' + encodeURIComponent('Please fill out your email'));
    return;
  }

  if (inputPassword.length === 0) {
    res.redirect('/?message=' + encodeURIComponent('Please fill out your password'));
    return;
  }

  User.findOne({
      where: {
        email: inputEmail
      }
    })
    .then((user) => {
      if (user != null && user.password === inputPassword) {
        req.session.user = user;
        res.redirect('profile')
      } else {
        res.redirect('/?message=' + encodeURIComponent('Invalid username or password'));
      }

    })
    .catch((error) => {
      console.error(error);
      res.redirect('/?message=' + encodeURIComponent('Invalid username or password'));
    });


});

//Profile route
app.get('/profile', (req, res) => {
  if (req.query.updateProfile){
    User.findOne({
      where: {
        id:req.session.user.id
      }
    })
    .then((user)=>{
      res.send({
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        postalcode: postalcode,
        housenumber: housenumber,
        street: street,
        city: city,
        email: email,
        phone: phone,
        aboutme: aboutme,
        motto:motto,
        availability:availability,
        serviceProvider:serviceProvider

      })
    })
  }
  else res.render('profile', {
    usrProfile: req.session.user
  })
})
// Update route: Updates the profile details
app.post('/updateUser', (req, res) => {
  User.update({
    email: req.body.inputEmail,
    firstname: req.body.inputFirstname,
    lastname: req.body.inputLastname
  }, {
    where: {
      id: req.session.user.id
    }
  })

    .catch(function(error) {
      console.error(error)
    })
    res.send();

})

//Upgrade route: Upgrades account to a seller-account
app.post('/upgradeUser', (req, res) => {
  if (req.session.user.id){
  User.update({
    postalcode: req.body.postalcode,
    housenumber: req.body.housenumber,
    street: req.body.street,
    city: req.body.city,
    phone: req.body.phone,
    aboutme: req.body.aboutme,
    motto:req.body.motto,
    availability: req.body.availability,
    serviceProvider: true
  }, {
    where: {
      id: req.session.user.id
    }
  })
    .catch(function(error) {
      console.error(error)
    })
    console.log(req.session.user + ' Account upgraded!');
    res.send();
  }
  else return;

})

app.post('/addService', (req, res) => {
  if (req.session.user.id){
  Role.create({
    service: req.body.service,
    price: req.body.price,
    userId:req.session.user.id
  })
  .catch(function(error) {
    console.error(error)
  })
  res.send({
    service: 'wqef',
    price: "req.body.price",
  });
}
})




//<--------------Search GET------------->
app.get('/search',function(req,res){
    Role.findAll()
    .then(allroles=>{
        console.log(`all roles--------------<${allroles}`)

        res.render('search',{roles:allroles})

    })

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

//<---test purpose--->
app.get('/selected',(req,res)=>{
    let input = req.query.selected;
    console.log(`SELECTED NAME-------->${input}`)
    let message =`hello ${input}`
    res.send({message: message})

})
//<--------Mumtaz's code-------->
//
// //<--------add roles-------->
// app.post('/addroles',function(req,res){
//     let role = req.body.role;
//     let price = req.body.price;
//     let id = req.body.id;
//     User.findOne({
//         where:{
//             id: id
//         }
//     }).then(user=>{
//         user.createRole({
//             service: role,
//             price: price
//
//         })
//         res.redirect('/search')
//     })
//
// })
//<--------Mumtaz's code-------->



app.post('/addService', (req, res) => {
  if (req.session.user.id){
  Role.create({
    service: req.body.service,
    price: req.body.price,
    userId:req.session.user.id
  })
  .catch(function(error) {
    console.error(error)
  })
  res.send({
    service: 'wqef',
    price: "req.body.price",
  });
}
})


app.get('/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      throw error;
    }
    res.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
  })
})



sequelize.sync({
  force:  false
  }
)
//<--------SERVER PORT----------->
app.listen(3001, function() {
    console.log("app is listening at port 3000")
})

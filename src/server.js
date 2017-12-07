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
app.use(bodyParser.urlencoded({
  extended: true
}))

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

//<--------Multer----------->
const multer = require('multer')
const myStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, '../public/images/user-images')
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
})
const upload = multer({
  storage: myStorage
});





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
  motto: Sequelize.TEXT,
  availability: Sequelize.BOOLEAN,
  serviceProvider: Sequelize.BOOLEAN,
  profilePicture: Sequelize.STRING
}, {
  timestamps: false
})

//<----------Defining user roles table------------>
const Role = sequelize.define('roles', {
  service: Sequelize.STRING,
  price: Sequelize.STRING
}, {
  timestamps: false
})

//<----defining relation between tables---->
User.hasMany(Role);
Role.belongsTo(User);

//------------------------------------------------------------------------------
//Routing
//------------------------------------------------------------------------------
// Home route
app.get('/', (req, res) => {
  res.render('index');

})

app.get('/sessionUpdate', (req, res) => {
  res.send(req.session.user.firstname)
})


//<----default page------->
app.get('/home', (req, res) => {
  // let user = req.session.user < What is the purpose of this?
  res.render("home.pug")
})


//Signup page
app.get('/signup', (req, res) => {
  // console.log(req.session)
  res.render('signup')
})

//Create new user using data from signup page
app.post('/createuser', upload.single('profileImage'), (req, res,next) => {
  let path = req.file.path.replace('public', '')
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

        password: req.body.password,
        profilePicture: path
      })
      .catch((error) =>
       {
        console.log(error);
      })
    res.redirect('/');
  }
})
//<-------------- Retrieve all user data rendering - NOT DONE
app.get('/rolesData', (req, res) => {
    Role.findAll({
        where: {
          userId: req.session.user.id
        }
      })
      .then((role) => {
        res.send({
          role: role
        })
      })


})


//<--------------retrieve all user data for rendering

//<---------- Handle Sync request for recent user data------------>
app.get('/syncUpdateRequest', (req, res) => {

  if (req.query.syncUpdateRequest) {
    User.findOne({
        where: {
          id: req.session.user.id
        }
      })
      .then((user) => {
        res.send({
          user: user
        })
      })

  } else return;
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
  if (req.session.user) {
    User.findOne({

        where: {
          id: req.session.user.id
        }
      })
      .then((user) => {
        res.render('profile',{
        usrProfile: user
        })

      })
  }
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
  if (req.session.user.id) {
    User.update({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        email: req.body.email,
        postalcode: req.body.postalcode,
        housenumber: req.body.housenumber,
        street: req.body.street,
        city: req.body.city,
        phone: req.body.phone,
        aboutme: req.body.aboutme,
        motto: req.body.motto,
        availability: req.body.availability,
        serviceProvider: true
      }, {
        where: {
          id: req.session.user.id
        }
      }).then(() => {
        console.log(req.session.user + ' Account upgraded!');
        res.redirect('/profile');
      })
      .catch(function(error) {
        console.error(error)
      })

  }

})

app.post('/addService', (req, res) => {

  if (req.session.user.id) {
    Role.create({
        service: req.body.service,
        price: req.body.price,
        userId: req.session.user.id
      })
      .catch(function(error) {
        console.error(error)
      })
    res.send({
      service2: 'FAKE : Service zit erin',
      price2: "FAKE : Prize zit erin",
    });
  }
})

app.get('/upgrade', (req, res) => {

  res.render('profile-upgraded')
})




//<--------------Search GET------------->
// app.get('/search', function(req, res) {
//   Role.findAll()
//     .then(allroles => {
//       console.log(`all roles--------------<${allroles}`)
//
//       res.render('search', {
//         roles: allroles
//       })
//
//     })
//
// })

//<-------AJAX request search bar--------->
// app.get('/submit', (req, res) => {
//   var service = req.query.service;
//   console.log(`service input----------->${service}`)
//   Role.findAll({
//     where: {
//       service: service
//     },
//     include: [{
//       model: User
//     }]
//   }).then(users => {
//     users = users.map(data => {
//       return {
//         users: data.user
//       }
//     })
//     var output = users;
//     console.log(`users with service---------->${JSON.stringify(users)}`)
//     res.send({
//       output: output
//     })
//   }).catch(err => {
//     console.log(err)
//   })
//
// })

//<---test purpose--->
// app.get('/selected', (req, res) => {
//   let input = req.query.selected;
//   console.log(`SELECTED NAME-------->${input}`)
//   let message = `hello ${input}`
//   res.send({
//     message: message
//   })
//
// })
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
  if (req.session.user.id) {
    Role.create({
        service: req.body.service,
        price: req.body.price,
        userId: req.session.user.id
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
  force: false
})

//<--------SERVER PORT----------->
app.listen(3001, function() {
  console.log("app is listening at port 3000")
})

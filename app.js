//------------------------------------------------------------------------------
//Require needed modules
//------------------------------------------------------------------------------
const Sequelize = require('sequelize');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

//------------------------------------------------------------------------------
//Configure modules
//------------------------------------------------------------------------------

//Set sequelize
const sequelize = new Sequelize('blog', process.env.POSTGRES_USER, null, {
  host: 'localhost',
  dialect: 'postgres',
});

//Set express
const app = express()
app.use(express.static('public'));
app.set('views', './views')
app.set('view engine', 'pug')

//Set session
app.use(session({
  secret: "secret1234",
  saveUninitialized: false,
  resave: false
}))

//Set bodyparser
app.use(bodyParser.urlencoded({
  extended: true
}))

//------------------------------------------------------------------------------
//Define models in Sequelize
//------------------------------------------------------------------------------
const User = sequelize.define('users', {
  firstname: {
    type: Sequelize.STRING
  },
  lastname: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING
  },
  password: {
    type: Sequelize.STRING
  }
}, {
  timestamps: false
})

//------------------------------------------------------------------------------
//Routing
//------------------------------------------------------------------------------
//Home route
app.get('/', (req, res) => {

  res.render('index');
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


app.get('/profile', (req, res) => {
  res.render('profile', {
    usrProfile: req.session.user
  })
})


app.post('/updateUser', (req, res) => {
  console.log(req.body.inputEmail + '<<<<<<---------Input Email')
  return User.update({
      email: req.body.inputEmail,
      firstname: req.body.inputFirstname,
      lastname: req.body.inputLastname
    }, {
      where: {
        id: req.session.user.id
      }
    })
    .then(user => res.send({
        user: user
      })
      // console.log(JSON.stringify(user) + '<<-----------Hierzo de return value van update Sequelize');
      // })
    )
})
app.get('/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      throw error;
    }
    res.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
  })
})


//Sync all defined models to the DB
sequelize.sync({
  force: false
})


//Server listening
app.listen(3000, () => {
  console.log("Listening on 3000 ")
})

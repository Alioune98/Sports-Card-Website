require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mysql = require('mysql');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const bcrypt = require('bcrypt');
const app = express();
const flash = require('express-flash');
const methodOverride = require('method-override');
const initializePassport = require('./passport-config');

initializePassport(
  passport,
  (email) => findUserByEmail(email),
  (id) => findUserById(id)
);

function findUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.query(`SELECT * FROM user WHERE email = ?`, [email], (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
    return resolve;
  });
}

function findUserById(id) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT user_id FROM user WHERE user_id = ?`,
      [id],
      (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      }
    );
    return resolve;
  });
}

app.use(express.static(__dirname));
app.set('view engine', 'ejs');
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(methodOverride('_method'));

app.use(passport.initialize());
app.use(passport.session());
app.use(passport.initialize());
app.use(passport.session());

//DATABASE SETUP AND CONNECTION
//Create connection to sportscardwebsite MySQL DB
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sportscardwebsite',
});

//Connect to MySQL
db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('MySql Connected');
});

//Create DB
app.get('/createdb', (req, res) => {
  let sql = `CREATE DATABASE IF NOT EXISTS sportscardwebsite`;
  db.query(sql, (err) => {
    if (err) {
      res.send('Either table already created or another error persists');
      throw err;
    }
    res.send('Database created');
  });
});

//START OF TABLE CREATIONS////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Create User Table
app.get('/createuser', (req, res) => {
  let sql = `CREATE TABLE if not exists USER (
        user_id INT NOT NULL AUTO_INCREMENT,
        username VARCHAR(255),
        password TEXT(2000),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id)
    );    
    `;
  db.query(sql, (err) => {
    if (err) {
      throw err;
    }
    res.send('User Table created');
  });
});

//Create UserAddress Table
app.get('/createua', (req, res) => {
  let sql = `CREATE TABLE if not exists USER_ADDRESS (
        id INT NOT NULL AUTO_INCREMENT,
        user_id INT(255),
        address_line1 VARCHAR(255),
        address_line2 VARCHAR(255),
        city VARCHAR(255),
        postal_code VARCHAR(255),
        Country VARCHAR(255),
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES USER(user_id)
    );    
    `;
  db.query(sql, (err) => {
    if (err) {
      throw err;
    }
    res.send('User Address Table created');
  });
});

//Create ShoppingSession Table
app.get('/createss', (req, res) => {
  let sql = `CREATE TABLE if not exists SHOPPING_SESSION (
        session_id INT NOT NULL AUTO_INCREMENT,
        user_id INT(255),
        total decimal(15, 2),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (session_id),
        FOREIGN KEY (user_id) REFERENCES USER(user_id)
    );
    `;
  db.query(sql, (err) => {
    if (err) {
      throw err;
    }
    res.send('Shopping Session Table created');
  });
});

//Create Product Table
app.get('/createproduct', (req, res) => {
  let sql = `CREATE TABLE if not exists PRODUCT (
        product_id INT(255) AUTO_INCREMENT,
        name VARCHAR(255),
        description TEXT,
        sku VARCHAR(255),
        category_id INT(255),
        inventory_id INT(255), 
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, 
        deleted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (product_id)
    );        
    `;
  db.query(sql, (err) => {
    if (err) {
      throw err;
    }
    res.send('Product Table created');
  });
});

//Create CartItem Table
app.get('/createci', (req, res) => {
  let sql = `CREATE TABLE if not exists CART_ITEM (
        id INT NOT NULL AUTO_INCREMENT,
        session_id INT(255),
        product_id INT(255),
        quantity INT(255),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (session_id) REFERENCES shopping_session(session_id),
        FOREIGN KEY (product_id) REFERENCES product(product_id)
    );                       
    `;
  db.query(sql, (err) => {
    if (err) {
      throw err;
    }
    res.send('Cart Item Table created');
  });
});

//Create OrderDetails Table
app.get('/createod', (req, res) => {
  let sql = `CREATE TABLE if not exists ORDER_DETAILS (
        order_id INT NOT NULL AUTO_INCREMENT,
        user_id INT(255),
        total decimal(15, 2),
        payment_id INT(255),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (order_id),
        FOREIGN KEY (user_id) REFERENCES USER(user_id)
    );       
    `;
  db.query(sql, (err) => {
    if (err) {
      throw err;
    }
    res.send('Order Details Table created');
  });
});

//Create OrderItems Table
app.get('/createoi', (req, res) => {
  let sql = `CREATE TABLE if not exists ORDER_ITEMS (
        id INT NOT NULL AUTO_INCREMENT,
        order_id INT(255),
        product_id INT(255),
        quantity INT(255),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    );        
    `;
  db.query(sql, (err) => {
    if (err) {
      throw err;
    }
    res.send('Order Items Table created');
  });
});

//Create ProductInventory Table
app.get('/createpi', (req, res) => {
  let sql = `CREATE TABLE if not exists PRODUCT_INVENTORY (
        id INT NOT NULL AUTO_INCREMENT,
        quantity INT(255),
        created_at TIMESTAMP,
        last_modified TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    );        
    `;
  db.query(sql, (err) => {
    if (err) {
      throw err;
    }
    res.send('Product Inventory Table created');
  });
});

//Create ProductCategory Table
app.get('/createpc', (req, res) => {
  let sql = `CREATE TABLE if not exists PRODUCT_CATEGORY (
        category_id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(255),
        description TEXT(2000),
        PRIMARY KEY (category_id)
    );      
    `;
  db.query(sql, (err) => {
    if (err) {
      throw err;
    }
    res.send('Product Category Table created');
  });
});

//END OF TABLE CREATIONS////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//GET ROUTES/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Insert Example
app.get('/customer1', (req, res) => {
  let post = { username: 'John Cena', email: 'youcantseeme@yahoo.com' };
  let sql = `INSERT INTO customer SET?`;
  let query = db.query(sql, post, (err) => {
    if (err) {
      throw err;
    }
    res.send('Customer 1 added');
  });
});

//Update Example
app.get('/updatecustomer/:id', (req, res) => {
  let newUserName = 'Fahid';
  let sql = `UPDATE customer SET username = '${newUserName}' WHERE id = ${req.params.id}`;
  let query = db.query(sql, (err) => {
    if (err) {
      throw err;
    }
    res.send('Post updated...');
  });
});

//Delete Example
app.get('/deletecustomer/:id', (req, res) => {
  let sql = `DELETE FROM customer WHERE id = ${req.params.id}`;
  let query = db.query(sql, (err) => {
    if (err) {
      throw err;
    }
    res.send('Customer deleted');
  });
});

//ADD PRODUCT IN PRODUCTS TABLE
app.get('/addproduct', (req, res) => {
  let sql = `INSERT INTO product PRODUCT_CATEGORY (
    category_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255),
    description TEXT(2000),
    PRIMARY KEY (category_id)
);      
`;
  db.query(sql, (err) => {
    if (err) {
      throw err;
    }
    res.send('Product Category Table created');
  });
});

app.get('/', function (req, res) {
  res.render('home');
});

app.get('/about', function (req, res) {
  res.render('about');
});

app.get('/login' /*, checkNotAuthenticated*/, function (req, res) {
  res.render('login');
});

app.get('/logout', function (req, res) {
  req.logout();
  req.redirect('/');
});

app.get('/register' /*, checkAuthenticated*/, function (req, res) {
  res.render('register');
});

app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['email', 'profile'] })
);

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get(
  '/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect to shopping cart.
    res.redirect('/protected');
  }
);

app.get('/protected' /*, checkAuthenticated*/, (req, res) => {
  console.log(req);
  res.render('cart');
});

//SOCIAL LOGIN/SIGNUP STRATEGIES///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/secrets',
      userProfileUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
    }
  )
);

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: 'http://127.0.0.1:3000/auth/twitter/callback',
    },
    function (token, tokenSecret, profile, cb) {}
  )
);

//POST METHODS//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Local Login
app.post(
  '/login' /*, checkAuthenticated*/,
  passport.authenticate('local', {
    successRedirect: '/protected',
    failureRedirect: '/login',
    failureFlash: true,
  })
);

//Local Registration
app.post('/register' /*, checkAuthenticated*/, async function (req, res) {
  let user = {
    first_name: req.body.firstname,
    last_name: req.body.lastname,
    username: req.body.firstname + req.body.lastname,
    email: req.body.email,
    password: await bcrypt.hash(req.body.password, 10),
  };
  db.query(`INSERT INTO user SET ?`, user, function (err, res, fields) {
    if (err) {
      throw err;
    } else {
      console.log('Successful');
    }
  });
  res.send('Success, user was added into the database!');
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

app.delete('/logout', (req, res) => {
  req.logOut();
  res.redirect('/login');
});

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}

//Starts the server
app.listen('3000', () => {
  console.log('Server running on port 3000');
});

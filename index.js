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
const initialize = require('./passport-config');
const registerUser = require('./passport-config');
const multer = require('multer');
const path = require('path');

//For uploading files to the server
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.filename}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage: storage,
});

//PASSPORT CONFIGURATION FOR LOGIN/REGISTER (See passport-config.js)
initialize(
  passport,
  (email) => findUserByEmail(email),
  (id) => findUserById(id)
);

//IMPORT CONFIGS
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

//DATABASE SETUP AND CONNECTION/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Create connection to sportscardwebsite MySQL DB
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sportscardwebsite',
  dateStrings: true,
  multipleStatements: true,
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

//DELETE LATER/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

//GET ROUTES/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/', function (req, res) {
  var query = `SELECT image, name, description FROM product`;
  db.query(query, function (err, data) {
    if (err) {
      throw err;
    } else {
      res.render('home', {
        title: 'PRODUCTS LISTINGS',
        sampleData: data,
      });
    }
  });
});

app.get('/about', function (req, res) {
  res.render('about');
});

app.get('/login', checkNotAuthenticated, function (req, res) {
  res.render('login');
});

app.get('/logout', function (req, res) {
  req.logout();
  req.redirect('/');
});

app.get('/register', checkNotAuthenticated, function (req, res) {
  res.render('register', { message: req.flash('message') });
});

app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile'] })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
  }),
  function (req, res) {
    res.redirect('/');
  }
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

app.get('/protected', checkAuthenticated, (req, res) => {
  res.render('cart');
});

app.get('/admin', (req, res) => {
  res.render('dashboard');
});

app.get('/admin/products', (req, res, next) => {
  var query = `SELECT product_id, product.name as name, price, product_category.name as category, product_inventory.quantity as quantity, product.created_at
  FROM product 
  LEFT JOIN product_category
  ON product_category.category_id = product.category_id
  LEFT JOIN product_inventory
  ON product_inventory.id = product.inventory_id`;
  db.query(query, function (err, data) {
    if (err) {
      throw err;
    } else {
      res.render('products', {
        title: 'Node.js MySQL CRUD APPLICATION',
        sampleData: data,
      });
    }
  });
});

app.post('/admin/products', upload.single('image'), function (req, res, next) {
  var product_name = req.body.product_name;
  var certification = req.body.cert;
  var grade = req.body.grade;
  var description = req.body.description;
  var image = req.file.filename;
  var price = req.body.price;
  var category = req.body.category;
  var categoryId;
  var inventoryId;

  switch (category) {
    case 'Baseball':
      categoryId = 1;
      break;
    case 'Basketball':
      categoryId = 2;
      break;
    case 'Football':
      categoryId = 3;
      break;
    case 'Soccer':
      categoryId = 4;
      break;
    case 'Pokemon':
      categoryId = 5;
      break;
  }
  var query = `INSERT INTO product_inventory (quantity) VALUES (1)`;
  db.query(query, async function (err, data) {
    if (err) {
      throw err;
    } else {
      inventoryId = data.insertId;
      var query = `INSERT INTO product (name, cert, grade, description, image, price, category_id, inventory_id)
      VALUES ("${product_name}", "${certification}", "${grade}", "${description}", "${image}", "${price}", "${categoryId}", "${inventoryId}" )`;

      db.query(query, function (err, data) {
        if (err) {
          throw err;
        } else {
          res.redirect('/admin/products');
        }
      });
    }
  });
});

app.get('/admin/orders', (req, res) => {
  res.render('orders');
});

app.get('/admin/users', (req, res) => {
  res.render('users');
});

//SOCIAL LOGIN/SIGNUP STRATEGIES/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/auth/google/callback',
    },
    function (accessToken, refreshToken, profile, cb) {}
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

//POST METHODS////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Local Login
app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/protected',
    failureRedirect: '/login',
    failureFlash: true,
  })
);

//Local Registration
app.post('/register', async function (req, res) {
  // let user = {
  //   first_name: req.body.firstname,
  //   last_name: req.body.lastname,
  //   email: req.body.email,
  //   password: req.body.password1,
  // };

  if (
    req.body.firstname === '' ||
    req.body.lastname === '' ||
    req.body.email === '' ||
    req.body.password1 === '' ||
    req.body.password2 === ''
  ) {
    req.flash('message', 'All fields must be filled to proceed');
    res.redirect('/register');
  } else if (req.body.password1 != req.body.password2) {
    req.flash('message', 'Passwords must be matching');
    res.redirect('/register');
  }

  let password = await bcrypt.hash(req.body.password1, 10);
  let query = `SELECT * FROM user WHERE email = ?`;
  db.query(query, req.body.email, function (err, data) {
    if (err) {
      throw err;
    } else if (data.length === 0) {
      console.log('User does not exist');
      user = {
        username: req.body.firstname + req.body.lastname,
        first_name: req.body.firstname,
        last_name: req.body.lastname,
        email: req.body.email,
        password: password,
      };
      db.query(`INSERT INTO user SET ?`, user, function (err, result) {
        if (err) {
          throw err;
        } else {
          console.log('Successful');
        }
        res.redirect('/protected');
      });
    } else {
      console.log('User Already exists');
      req.flash('message', 'A user with that email already exists.');
      res.redirect('/register');
    }
  });
});

app.delete('/logout', (req, res) => {
  req.logOut();
  res.redirect('/login');
});

//Starts the server
app.listen('3000', () => {
  console.log('Server running on port 3000');
});

//HELPER FUNCTIONS///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  next();
}

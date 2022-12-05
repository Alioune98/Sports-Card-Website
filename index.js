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
const { query } = require('express');

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
  var authenticated = req.user === undefined ? true : false;
  var query = `SELECT product_id, image, name, description FROM product`;
  db.query(query, function (err, data) {
    if (err) {
      throw err;
    } else {
      res.render('home', {
        title: 'PRODUCTS LISTINGS',
        sampleData: data,
        isAuth: authenticated,
      });
    }
  });
});

app.get('/about', function (req, res) {
  var authenticated = req.user === undefined ? true : false;
  res.render('about', {
    isAuth: authenticated,
  });
});
app.get('/policies', function (req, res) {
  res.render('policies');
});

app.get('/login', checkNotAuthenticated, function (req, res) {
  res.render('login');
});

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
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
    createShoppingSession();
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

app.get('/protected', checkAuthenticated, async (req, res) => {
  let session = await createShoppingSession(req);
  var query = `SELECT product_id, name, cert, grade, image, price FROM product WHERE 
  product_id IN (SELECT product_id FROM cart_item WHERE 
  session_id = ${session})`;

  var authenticated = req.user === undefined ? true : false;
  console.log('authenticated: ' + authenticated);
  db.query(query, function (err, data) {
    if (err) {
      throw err;
    } else {
      console.log(data);
      res.render('cart', {
        title: 'Shopping Cart',
        sampleData: data,
        isAuth: authenticated,
        checkedOut: false,
      });
    }
  });
});

app.get('/admin', checkAuthenticated, (req, res) => {
  if (req.session.passport.user === 1) {
    res.render('dashboard');
  } else {
    res.redirect('/login');
  }
});

app.get('/admin/products', checkAuthenticated, (req, res, next) => {
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

app.post(
  '/admin/addproducts',
  upload.single('image'),
  function (req, res, next) {
    var product_name = req.body.product_name;
    var certification = req.body.cert;
    var grade = req.body.grade;
    var description = req.body.description;
    var image;
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
  }
);

app.post('/admin/deleteproduct', (req, res) => {
  db.query('DELETE FROM product WHERE product_id=?', req.body.productid);
  res.redirect('/admin/products');
});

app.post('/admin/editproduct', upload.single('image'), (req, res) => {
  var product_name = req.body.product_name;
  var certification = req.body.cert;
  var grade = req.body.grade;
  var description = req.body.description;
  var image = '';
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
      var query = `UPDATE product SET name = COALESCE(?, name), cert = COALESCE(?, cert), grade = COALESCE(?, grade), 
      description = COALESCE(?, description), image = COALESCE(?, image), price = COALESCE(?, price), category_id = COALESCE(?, 
      category_id), inventory_id = COALESCE(?, inventory_id)) VALUES ("${product_name}", "${certification}", "${grade}", "${description}", 
      "${image}", "${price}", "${categoryId}", "${inventoryId}" )`;

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

app.get('/admin/viewproduct', checkAuthenticated, (req, res) => {
  res.redirect('/admin/products');
});

app.get('/admin/orders', checkAuthenticated, (req, res) => {
  res.render('orders');
});

app.get('/admin/users', checkAuthenticated, (req, res) => {
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
    failureRedirect: '/login',
    failureFlash: true,
  }),
  function (req, res, next) {
    if (req.session.oldUrl) {
      var oldUrl = req.session.oldUrl;
      req.session.oldUrl = null;
      res.redirect(oldUrl);
    } else if (req.session.passport.user === 1) {
      res.redirect('/admin');
    } else {
      res.redirect('/protected');
    }
  }
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
    return res.redirect('/register');
  } else if (req.body.password1 != req.body.password2) {
    req.flash('message', 'Passwords must be matching');
    return res.redirect('/register');
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
        return res.redirect('/protected');
      });
    } else {
      console.log('User Already exists');
      req.flash('message', 'A user with that email already exists.');
      return res.redirect('/register');
    }
  });
});

app.get('/addtocart/:productid', isLoggedIn, async (req, res) => {
  var sessionid;
  //First we need to check if the user is logged in
  sessionid = await createShoppingSession(req);
  console.log(req.params.productid);
  let item = {
    session_id: sessionid,
    product_id: req.params.productid,
    quantity: 1,
  };
  let query = `INSERT INTO cart_item SET ?`;
  db.query(query, item, function (err, result) {
    if (err) throw err;
    else {
      console.log(
        'Item: ' +
          item.product_id +
          'inserted into cart for session' +
          sessionid
      );
    }
  });
  res.redirect('/protected');
});

app.post('/removefromcart', async function (req, res) {
  let id = req.body.id;
  let sessionid = await createShoppingSession(req);
  let query = `DELETE FROM cart_item WHERE session_id = ${sessionid} AND product_id = ${id}`;
  db.query(query, (err, result) => {
    if (err) throw err;
    else {
      res.redirect('/protected');
    }
  });
  console.log('item removed from cart');
});

app.get('/allcards/:cardid', function (req, res) {
  const cardid = req.params.cardid;
  let query = `SELECT * FROM product WHERE product_id = ?`;
  db.query(query, cardid, function (error, card) {
    if (error) throw error;
    else {
      //console.log('Image: ' + card[0].image);

      res.render('allcards', {
        name: card[0].name,
        cert: card[0].cert,
        grade: card[0].grade,
        description: card[0].description,
        image: card[0].image,
        price: card[0].price,
      });
    }
  });
});

app.post('/checkout', async (req, res) => {
  let session = await createShoppingSession(req);
  let query = `INSERT INTO order_details(user_id) VALUES (?)`;
  db.query(query, req.session.passport.user, (err, result) => {
    if (err) throw err;
    else {
      var authenticated = req.user === undefined ? true : false;
      let query = `SELECT product_id, name, cert, grade, image, price from product WHERE 
      product_id IN (SELECT product_id FROM cart_item WHERE 
      session_id IN (SELECT session_id FROM shopping_session WHERE user_id = ?))`;
      db.query(query, req.session.passport.user, (err, data) => {
        if (err) throw err;
        else {
          db.query(
            `UPDATE shopping_session SET session_ended = 1 WHERE session_id = ${session}`
          );
          res.render('checkout', {
            checkOutData: data,
            checkedOut: true,
            isAuth: authenticated,
          });
        }
      });
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

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.session.oldUrl = req.url;
    res.redirect('/login');
  }
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

function createShoppingSession(req) {
  console.log('createShoppingSession' + req.body);
  var userid = req.session.passport.user;
  var sessionid;
  let query = `SELECT session_ended, session_id FROM shopping_session WHERE user_id = ?`;

  db.query(query, [userid], function (error1, results) {
    if (error1) throw error1;
    else {
      if (results.length !== 0) {
        if (results[0].session_ended == 0) {
          return results[0].session_id;
        }
      } else {
        //If a shopping session does not exist for this user or shopping sessions do exist
        //but are not running, then create a new shopping session
        query = `INSERT INTO shopping_session (user_id) VALUES (?)`;
        db.query(query, userid, function (error, res) {
          if (error) throw error;
          else {
            console.log('New Shopping session created');
          }
        });
      }
    }
  });

  return new Promise((resolve, reject) => {
    query = `SELECT session_ended, session_id FROM shopping_session WHERE user_id = ?`;
    db.query(query, userid, function (error, list) {
      if (error) return reject(error);
      else {
        console.log('Existing session');
        sessionid = list[0].session_id;
        resolve(sessionid);
      }
    });
    return resolve;
  });
  //query to get session_ended and session_id for user given the user_id (Here we are looking for any active shopping sessions
  //that have not been ended to add products to otherwise we will create a new active session) a session is considered active
  //if the session was started but no order was not submitted. After the order is submitted, the session is ended.
}

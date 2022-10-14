require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mysql = require('mysql');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const MySQLStore = require('express-mysql-session')(session);
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;


//Create connection

const db = mysql.createConnection({
    host: "localhost",
    user: "root", 
    password: "",
    database: "nodemysql"
});

//Connect to MySQL

db.connect((err) => {
    if(err){
        throw err;
    }
    console.log("MySql Connected");
});

const app = express();
app.use(express.static(__dirname));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(passport.initialize());

//Create DB
app.get("/createdb", (req, res) =>{
    let sql = `CREATE DATABASE nodemysql`;
    db.query(sql, (err) =>{
        if(err){
            throw err;
        }
        res.send("Database created");
    });
});

//Create Customer Table
app.get("/createcustomer", (req, res) =>{
    let sql = `CREATE TABLE customer(id int AUTO_INCREMENT, username VARCHAR(255), email VARCHAR(2555), PRIMARY KEY(id))`;
    db.query(sql, (err) =>{
        if(err){
            throw err;
        }
        res.send("Customer table created");
    });
});

//Insert Customer
app.get("/customer1", (req, res) =>{
    let post = {username: "John Cena", email: "youcantseeme@yahoo.com"};
    let sql = `INSERT INTO customer SET?`;
    let query = db.query(sql, post, (err) =>{
        if(err){
            throw err;
        }
        res.send("Customer 1 added");
    });
});

//Update Customer
app.get("/updatecustomer/:id", (req, res) =>{
    let newUserName = "Fahid";
    let sql = `UPDATE customer SET username = '${newUserName}' WHERE id = ${req.params.id}`;
    let query = db.query(sql, (err) =>{
        if(err){
            throw err;
        }
        res.send("Post updated...");
    });
});

//Delete customer
app.get("/deletecustomer/:id", (req, res) =>{
    let sql = `DELETE FROM customer WHERE id = ${req.params.id}`;
    let query = db.query(sql, (err) =>{
        if(err){
            throw err;
        }
        res.send("Customer deleted");
    });
});

app.get("/", function(req, res){
    res.render("home");
});

app.get("/about", function(req, res){
    res.render("about");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ['profile'] })
);

app.get("/auth/facebook",
  passport.authenticate('facebook', { scope: ['profile'] })
);

app.listen("3000", () =>{
    console.log("Server running on port 3000");
});
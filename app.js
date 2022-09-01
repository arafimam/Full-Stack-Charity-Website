/**
 * Neccessary import statements.
 */
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const path = require('path')
const crypto = require('crypto');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const multer = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static("public"));
app.set('view engine','ejs');


//MiddleWare
const mongoURI = 'mongodb://localhost:27017/user';

// Create mongo connection
const conn = mongoose.createConnection(mongoURI);

// Init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads'); //collection name in database.
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });


app.use(session({
    secret: "haveItInsideEnv",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

/**
 * import database models here.
 */
const User = require("./models/user");
const Post = require("./models/post");

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//############################################################### < GET Requests > ###########################################################

/**
 * Get request for home route.
 * No user authentication is required here.
 * respond sends the home file.
 */
app.get("/",function(request,respond){
    respond.render("home");
});

/**
 * Get request for login route.
 * No user authentication is required here. 
 * respond sends the login file.
 */
app.get("/login",function(request,respond){
    respond.render("login");
})

/**
 * Get request for register route.
 * No user authentication is required here.
 * respond sends the register file.
 */
app.get("/register",function(request,respond){
    respond.render("register");
})


/**
 * Get request for add Post.
 * User authentication is needed since user can only log onto this page if the user correctly logged in/registered
 * respond sends the addPost front end page if user is authenticated
 * otherwise respond redirects the user to the login route.
 */
app.get("/addPost",function(request,respond){
    if (request.isAuthenticated()){
        respond.render("addPost");
    }
    else{
        respond.redirect("/login");
    }
})

app.get("/test",function(req,res){
    if (req.isAuthenticated()){
        res.render("test");
    }else{
        res.redirect("/login");
    }
})

//############################################################### < POST Requests > ###########################################################

/**
 * Post request from register route. 
 * User is registerd into our database
 * Passport authentication is used to produce hash and salt to keep user password secured.
 */
 app.post("/register",function(req,res){
    const newUser = new User({
        username: req.body.username,
        phone: req.body.phone
    })
    User.register(newUser, req.body.password,function(err,user){
        if (err){
            console.log(err);
            res.redirect("/register")
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/addPost");
            })
        }
    }) 
})

/**
 * Post request for login.
 * checks if user user exist in database
 * cookie is made.
 */
app.post("/login",function(req,res){
    
   const user = new User({
    username: req.body.username,
    password: req.body.password
   })
   

   req.login(user,function(error){
    if (error){
        console.log(err);
        res.redirect("/login");
    }else{
        passport.authenticate("local",{ failureRedirect: '/login', failureMessage: true })(req,res,function(){
            res.redirect("/addPost");
        })
    }
   })
})


/**
 * Adds a post to post db and upload.files and uploads.chunks
 */

app.post("/addPost",upload.single('file'),function(req,res){
    console.log(req.file.id);
    console.log(req.body);
    const post = new Post({
       username: req.user.username,
       phone: req.user.phone,
       Title: req.body.title,
       Location: req.body.locations,
       Type: req.body.fav,
    });
    post._id = req.file.id;
    console.log(post);
    post.save();
    //res.json({ file: req.file });
    //res.redirect("/addPost");
})


/**
 * App listens to port 3000 for local build.
 * To start the server: Open Terminal > nodemon app.js
 * Open a browser and search: localhost:3000
 */
app.listen(3000,function(){
    console.log("Local build server is running.")
})
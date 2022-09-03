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
const multer  = require('multer')


const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine','ejs');
var checkPage =  false; // checks which page user is trying to enter

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix)
}
})

const upload = multer({ storage: storage })



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
    if (request.isAuthenticated()){
        respond.redirect("/addPost")
    }else{
        respond.render("login")
    }
    
})

/**
 * Get request for register route.
 * No user authentication is required here.
 * respond sends the register file.
 */
app.get("/register",function(request,respond){
    if (request.isAuthenticated()){
        respond.redirect("/addPost")
    }else{
        respond.render("register")
    }
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


/**
 * Get request for view post
 * iterates through the post db and gives all data other than the user that is currently logged in.
 */
app.get("/viewPost",async function(req,res){
    if (req.isAuthenticated()){
        //go over all the post stored in the db.
    const cursor = Post.find().cursor();
    var displayValues = [{
        
    }]

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        // Use `doc`
        
        if (req.user.username != doc.username){
            displayValues.push(doc);
        }
        
    }
    checkPage = true;
    res.render("viewPost",{data:displayValues,showButtons: checkPage});
    }else{
        res.redirect("/login")
    } 
})


/**
 * Get request for myPost
 * iterates through the post db and gives all postings made by the current user
 */
app.get("/myPost",async function(req,res){
    if (req.isAuthenticated()){

        const cursor = Post.find().cursor();
    var displayValues = [{
        
    }]

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        // Use `doc`
        if (req.user.username === doc.username){
            displayValues.push(doc);
        }   
    }
    checkPage = false;
    res.render("viewPost",{data:displayValues,showButtons: checkPage});

    }
})


/**
 * Get request for viewAllPost
 * Sends all information from postingDb
 */
app.get("/viewAllPost",async function(req,res){

    if (req.isAuthenticated()){

    const cursor = Post.find().cursor();
    var displayValues = [{
        
    }]

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
        // Use `doc`
        displayValues.push(doc);  
    }
    //console.log(displayValues);
    checkPage = false;
    res.render("viewPost",{data:displayValues,showButtons: checkPage});

    }else{
        res.redirect("/login")
    }

})

app.get("/viewInterestedPost",async function(req,res){
    if (req.isAuthenticated()){
        //get interest posts id from req.user.username
        const user =  User.findOne({username: req.user.username},async function(err,doc){
            if (err){
                console.log("There was a error");
            }else{
                var values = [];
                values.push(doc.interestedPost);
                //display the ids in viewPost
                const cursor = Post.find().cursor();
                var displayValues = [{
        
                }]

                for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
                // Use `doc`
                console.log(doc._id.toString());
                console.log(values[0].includes(doc._id.toString()))
                    if (values[0].includes(doc._id)){
                        displayValues.push(doc);
                    }  
                }
                checkPage = false;
                res.render("viewPost",{data:displayValues,showButtons: checkPage});
            }
        })
        
    }else{
        res.redirect("/login");
    }
})

/**
 * Logs out user
 */
app.get('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

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
    

    // TODO: handle file type input here. 
    const post = new Post({
       username: req.user.username,
       phone: req.user.phone,
       Title: req.body.title,
       Location: req.body.Locations,
       Type: req.body.fav,
       photoName: req.file.filename,
       likes: 0,
       dislikes: 0
    });
    
    post.save();
    //res.json({ file: req.file });
    res.redirect("/viewPost");
})


/**
 * Post request from viewPost
 * Like and dislike functionality implemented here.
 */
app.post("/viewPost",function(req,res){
    // find the post using the id
    
    console.log(req.user.username);
    if (req.body.action === "like"){
        
        User.findOneAndUpdate({username: req.user.username},{ '$push': { interestedPost: req.body.id } },function(err,success){
            if (err){
                console.log(err);
            }
        })
        Post.findOneAndUpdate({_id :req.body.id}, {$inc : {'likes' : 1}}).exec()
        
    }else if(req.body.action === "dislike"){
        User.findOneAndUpdate({username: req.user.username},{ '$push': { notInterestPost: req.body.id } },function(err,success){
            if (err){
                console.log(err);
            }
        })
        Post.findOneAndUpdate({_id :req.body.id}, {$inc : {'dislikes' : 1}}).exec()
    }
    res.redirect("/viewPost");
    
})


/**
 * App listens to port 3000 for local build.
 * To start the server: Open Terminal > nodemon app.js
 * Open a browser and search: localhost:3000
 */
app.listen(3000,function(){
    console.log("Local build server is running.")
})
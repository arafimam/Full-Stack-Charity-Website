
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose")

mongoose.connect("mongodb://localhost:27017/user")
var Schema = mongoose.Schema;

const postSchema = new mongoose.Schema({
    username: String,
    phone: Number,
    Title: String,
    Location: String,
    Type: String,
    photoName: String,
    likes: Number,
    dislikes: Number
});


postSchema.plugin(passportLocalMongoose);

const Post = mongoose.model('postSchema',postSchema);
module.exports = Post;
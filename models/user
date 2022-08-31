const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose")

mongoose.connect("mongodb://localhost:27017/user")

const userSchema = new mongoose.Schema({
    username: String,
    Password: String,
    phone: Number,
    
})

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('userSchema',userSchema);
module.exports = User;
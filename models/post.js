// idea taken from : https://stackoverflow.com/questions/53548990/how-do-i-add-new-field-other-than-multer-gridfs-storage-default-properties
// of not storing business idea in metadata of uploads.files.
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
});

//_id of post will contain the file id.
postSchema.plugin(passportLocalMongoose);

const Post = mongoose.model('postSchema',postSchema);
module.exports = Post;
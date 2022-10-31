var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var File = new Schema({


    name: {
        type: String
    },
    type: {
        type: String
    },
    fileUrl: {
        type: String
    },
    created_at: {
        type: Date
    },
    updated_at: {
        type: Date
    },
    deleted_at: {
        type: Date
    }
});



module.exports = mongoose.model('File', File);

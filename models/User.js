const mongoose = require("mongoose");
//Create schema
const issueSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        required: true
    },
    solved: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    deadline: {
        type: Date
    },
    comments: [{
        commenter: {
            name: {
                type: String,
                required: true
            },
            id: {
                type: String,
                required: true
            }
        },
        details: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'projects' },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }]
})

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    date: {
        type: Date,
        default: Date.now
    },

    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }],
    issues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'issues' }]

})
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true

    },
    password: {
        type: String,
        required: true
    },

    date: {
        type: Date,
        default: Date.now
    },

    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'projects' }]

});

const User = mongoose.model("users", userSchema);
const Project = mongoose.model("projects", projectSchema);
const Issue = mongoose.model("issues", issueSchema);
module.exports = {
    User: User,
    Project: Project,
    Issue: Issue
}
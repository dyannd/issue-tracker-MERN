const validator = require("validator");
const isEmpty = require("is-empty");

module.exports = function validateRegisterInput(data) {
    let errors = {};

    //convert empty fields to empty strings for validation
    data.name = !isEmpty(data.name) ? data.name : "";
    data.email = !isEmpty(data.email) ? data.email : "";
    data.password = !isEmpty(data.password) ? data.password : "";
    data.password2 = !isEmpty(data.password2) ? data.password2 : "";

    //Name field check
    if (validator.isEmpty(data.name)) {
        errors.name = "Enter your name";
    }

    //Email check
    if (validator.isEmpty(data.email)) {
        errors.email = "Enter your email";
    } else if (!validator.isEmail(data.email)) {
        errors.email = "Email is invalid";
    }

    //Password check

    if (validator.isEmpty(data.password)) {
        errors.password = "Password is required";
    }

    if (validator.isEmpty(data.password2)) {
        errors.password2 = "Confirm Password is required";
    }

    if (!validator.isLength(data.password, { min: 6, max: 30 })) {
        errors.password = "Password must be at least 6 characters";
    }
    if (!validator.equals(data.password, data.password2)) {
        errors.password2 = "Passwords must match";
    }
    return {
        //return an error with a boolean checking if we have any error :)
        errors,
        isValid: isEmpty(errors)
    };

}
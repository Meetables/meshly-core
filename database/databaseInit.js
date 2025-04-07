const mongoose = require('mongoose');

async functiominitDb =  () => {
    //create sample user
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const newUser = new User({
        email,
        password: hashedPassword,
        username
    })

    
    //create tags: location, interest

}
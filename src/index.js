import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path: './.env'
});

connectDB()
 .then(() => {
    app.on("error", err => {  // .on is a listener that can listen many events, error is one of them. 
            console.error('server connection error: ',err)
            throw err
        })

    app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT || 8000}`)
        }) //app.listen() is a method used to start a server to listen for incoming HTTP requests on a specified port. It is typically used to create and initialize a server instance for your Express application.
 })
 .catch((err) => {
    console.error('MONGODB ERROR: ', err)
    process.exit(1)
})




/*
import express from "express";

const app = express();
(async() => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        app.on("error", err => {
            console.error('error: ',err)
            throw err
        })

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`)
        })
    } catch(err){
        console.error('ERROR: ', err)
        throw err
    }
})()
*/
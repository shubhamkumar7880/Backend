import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path: './env'
});

connectDB()
 .then(() => {
    app.on("error", err => {
            console.error('server connection error: ',err)
            throw err
        })

    app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT || 8000}`)
        })
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
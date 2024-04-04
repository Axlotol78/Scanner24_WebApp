import mongoose from 'mongoose'
const mongoConnectionURL = 'mongodb+srv://abdullahehsan4242:O0MvjquI37lfyMBf@scanner24.2xgiyiv.mongodb.net/?retryWrites=true&w=majority&appName=Scanner24'

export const mongo = await mongoose.connect(mongoConnectionURL, {
    dbName: "scanner24"
})
console.log("mongo connected")
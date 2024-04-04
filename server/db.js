import mongoose from 'mongoose'
const mongoConnectionURL = 'mongodb+srv://mainscanner24:e88jwCImY2Y625YD@scanner24.rlhcyoa.mongodb.net/?retryWrites=true&w=majority&appName=Scanner24'
// e88jwCImY2Y625YD
export const mongo = await mongoose.connect(mongoConnectionURL, {
    dbName: "scanner24"
})
console.log("mongo connected")
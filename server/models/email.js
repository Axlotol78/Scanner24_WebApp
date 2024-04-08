import mongoose from 'mongoose'
const spamScoreSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true
    }
})

const emailSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    id: {
        type: String,
        required: true
    },
    snippet: {
        type: String,
        required: true
    },
    From:{
        type: String
    },
    To:{
        type: String
    },
    Date:{
        type: String
    },
    Subject:{
        type: String
    },
    // Add other fields as needed
    spam_score: [spamScoreSchema]
    // You can add more fields such as Date, From, To, etc. if needed
})

export const Email = mongoose.model('Email', emailSchema)

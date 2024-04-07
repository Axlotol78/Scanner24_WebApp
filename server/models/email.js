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
        type: String,
        required: true
    },
    To:{
        type: String,
        required: true
    },
    Date:{
        type: String,
        required: true
    },
    Subject:{
        type: String,
        required: true
    },
    // Add other fields as needed
    spam_score: [spamScoreSchema]
    // You can add more fields such as Date, From, To, etc. if needed
})

export const Email = mongoose.model('Email', emailSchema)

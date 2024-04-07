// const express = require("express");
// const { google } = require("googleapis");
// const fs = require("fs");
// const cors = require("cors")
// const {convert} = require('html-to-text')
import express from "express";
import { google } from "googleapis";
import fs, { access } from "fs";
import cors from "cors"
import {convert} from 'html-to-text'
import {config} from 'dotenv'

import { HfInference } from "@huggingface/inference";
import {User} from './models/user.js'
import {Code} from './models/code.js'
import {Email} from './models/email.js'

config()
import './db.js'
import { raw } from "mysql";

const hf_token = process.env.HF_TOKEN
const hf = new HfInference(hf_token)

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors())
// Load credentials from the JSON file
const credentials = JSON.parse(fs.readFileSync("g_creds.json"));

// Extract web client configuration
const { client_id, client_secret, redirect_uris } = credentials.web;

console.log("redirect urls", redirect_uris);
// OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0] // IMPORTANT
)

// Access scopes for read-only Drive activity.
const scopes = ["https://www.googleapis.com/auth/userinfo.profile", 
                "https://www.googleapis.com/auth/gmail.readonly", 
                "https://mail.google.com/"]

// const inf_user = 'ZachBeesley'  
// const inf_model = 'Spam-Detector'
const inf_user = 'mariagrandury'
const inf_model = 'distilbert-base-uncased-finetuned-sms-spam-detection'

// Google login route
app.get("/google-login", (req, res) => {
  // Generate authorization URL
  console.log("google-login")
  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    include_granted_scopes: true,
  })
  console.log("authorizationUrl", authorizationUrl);
  res.send(authorizationUrl)
});


app.get("/google-auth-callback", async (req, res) => {
  console.log("google-auth-callback")
  const code = req.query.code
  const find_code = await Code.findOne({code})
  if(find_code != null){
    console.log("Code already exists")
    return res.send({ error: 'Code already used' })
    
  }
  Code.create({code})
  try {
    const { tokens } = await oauth2Client.getToken(code)
    const headers = {
      'Authorization': `Bearer ${tokens.access_token}`
    }
    const user_data = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: headers
    })
    if(!user_data.ok){
      throw new Error('User info network response was not ok')
    }
    const user_info = await user_data.json()
    console.log(user_info)
    const find_user = await User.findOne({id: user_info.id})
    if(find_user != null){
      //update user:
      console.log("old user")
      find_user.access_token = tokens.access_token
      await find_user.save()
    }else{

      console.log("new user")
      User.create({...user_info, access_token: tokens.access_token})
    }
    res.send(user_info)

  }
  catch(error){
    console.error("Error retrieving access token:", error)
    res.status(500).send("Error retrieving access token")
  }
})

app.get("/get-emails", async (req, res) => {
  console.log("get-emails")
  const user_id = req.query.user_id
  const user = await User.findOne({id: user_id})
  if(user == null){
    console.log("User not found")
    return res.send({error: 'User not found'})
  }
  if(user.access_token == null){
    console.log("User access token not found")
    return res.send({error: 'User access token not found'})
  }
  const headers = {
    'Authorization': `Bearer ${user.access_token}`
  
  }
  const email_list_data = await fetch('https://www.googleapis.com/gmail/v1/users/' + user_id + '/messages', {
    headers: headers
  })
  const email_list = await email_list_data.json()
  console.log(email_list)
  
  const messages = email_list.messages
  
  let new_msgs = []
  console.log('eh:', user.email_ids.length)
  console.log('messages from g api:', messages.length)
  if (user.email_ids.length == 0) {
    new_msgs = messages
  }else{

    for (const message of messages) {
      if (!message.id in user.email_ids) {
        
        new_msgs.push(message)
      }
    }
  }

  console.log('new_msgs:', new_msgs.length)
  let return_arr = []
  
  await Promise.all(new_msgs.map(async (message) => {
    let msg_obj = {};
    const raw_message = await getMessageFromID(user_id, message.id, headers)
    // const text = extractTextFromMessage(raw_message);
    // const prepped = clean_text(text).slice(0, 500);
    // console.log('prepped:', prepped);
    let result = await classifyText(raw_message.snippet.slice(0, 500))

    if (result.error) {
      if (result.error === `Model ${inf_user}/${inf_model} is currently loading`) {
        console.log('Model is loading, retrying in a bit')
        await new Promise(resolve => {
          setTimeout(async () => {
              result = await classifyText(raw_message.snippet.slice(0, 500))
              console.log('result:', result)
              resolve();
          }, (result.estimated_time + 2) * 1000)
      })
      } else {
        console.error('Error in hf api:', result.error)
      }
    }
    if(result.error){
      return
    }
    msg_obj['user_id'] = user_id
    console.log('result:', result)
    msg_obj['id'] = message.id
    msg_obj['snippet'] = raw_message.snippet
    
    if (!result.error) {
      msg_obj['spam_score'] = result[0]
    }

    Array.from(raw_message.payload.headers).forEach(header => {
      if (header.name == "From" || header.name == "Subject" || header.name == "Date" || header.name == "To") {
        msg_obj[header.name] = header.value
      }
    })
    Email.create(msg_obj)
    // return_arr.push(msg_obj)
  }))
  const found_emails = await Email.find({user_id})
  // console.log("found_emails", found_emails)
  if (found_emails.length > 0) {
    return_arr = return_arr.concat(found_emails)
  }
  // const email_ids = return_arr.map(email => email.id)
  user.email_ids = messages.map(message => message.id)
  user.save()
  
  
  //sort by date
  return_arr.sort((a, b) => {
    return new Date(b.Date) - new Date(a.Date)
  })
  res.send(return_arr)
})

async function getMessageFromID (user_id, message_id, headers) {
  const message_data = await fetch('https://www.googleapis.com/gmail/v1/users/' + user_id + '/messages/' + message_id, {
      headers: headers
    })
    if(!message_data.ok){
      const message = await message_data.json()
      console.error('Message network response was not ok', message)
      return null
      
    }
    const message = await message_data.json()

    // const text = extractTextFromMessage(message)
    return message
}


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
});

function extractTextFromMessage(message) {
  
  let text = '';
  
  function extractTextFromPart(part) {
    if (part.mimeType === 'text/plain' && part.body && part.body.size > 0) {
      text += Buffer.from(part.body.data, 'base64').toString('utf-8');
    } else if (part.mimeType === 'text/html' && part.body && part.body.size > 0) {
      const htmlText = Buffer.from(part.body.data, 'base64').toString('utf-8');
      // console.log('htmlText:', htmlText)
      text += convert(htmlText);
    } else if (part.parts) {
      part.parts.forEach(extractTextFromPart);
    }
  }

  // Extract text from the top-level message part and its child parts recursively
  extractTextFromPart(message.payload);

  return text;
}

function clean_text(data_for_cleaning) {
  data_for_cleaning = data_for_cleaning.toLowerCase()
  const regex = /(@[A-Za-z0-9]+)|([^0-9A-Za-z \t])|(\w+:\/\/\S+)|^rt|http.+?/g
  return data_for_cleaning.replace(regex, '')
}

const hf_model_url = `https://api-inference.huggingface.co/models/${inf_user}/${inf_model}`
async function classifyText(text) {
  const response = await fetch(hf_model_url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${hf_token}` },
    body: JSON.stringify({ inputs: text })
  })
  const result = await response.json()
  return result
  
}
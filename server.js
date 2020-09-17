// importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

//express.js run on port 9000
//From react => GET/POST/DELETE => express.js
//start: nodemon server.js
/* pusher sert d'interface entre le frontend et backend
pour les messages de bdd.

postman sert à tester les api*/

// app config
const app = express()
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: '1073476',
    key: '2ec0037f62e4e6f40b0e',
    secret: '1cc116c2f9757b912326',
    cluster: 'eu',
    useTLS: true,
  });

// middleware
app.use(express.json());
//For security
app.use(cors());

/*app.use((req,res,next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
});*/
// DB config
const connection_url = "mongodb+srv://arnaud35:4U0LHcfDs8x6Sk1s@cluster0.9dqhz.mongodb.net/whatsappdb?retryWrites=true&w=majority"
mongoose.connect(connection_url,{
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.once("open", () => {
    console.log("DB connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();
    console.log(changeStream );
    changeStream.on("change", (change) => {
        console.log("A change occured",change);
        
        if(change.operationType === "insert") {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted",
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received,
                }
            );
        }
        else {
            console.log("Error triggering Pusher")
        }

    });
});

// ???

// api routes
app.get("/",(req,res)=>res.status(200).send("hello world"))

app.get("/messages/sync", (req, res) => {
    
    Messages.find((err, data) => {
        if(err){
            res.status(500).send(err);
        }
        else
        {
            res.status(201).send(data);
        }
    })
})

app.post("/messages/new", (req, res) => {
    const dbMessage = req.body;
    
    Messages.create(dbMessage, (err, data) => {
        if(err){
            res.status(500).send(err);
        }
        else
        {
            res.status(201).send(`new message created: \n ${data}`);
        }
    })
})
// listen
app.listen(port, () => console.log(`Listening on localhost:${port}`));
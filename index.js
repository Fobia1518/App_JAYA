const express = require("express"); 
const path = require('path');
const router = express.Router();
const bodyParser = require("body-parser"); 
const MongoClient = require('mongodb').MongoClient;
const jwt = require('jsonwebtoken');
const fs = require('fs');

//VAR
userCollection = '';
var origin = [];
var asc = [];
var desc = [];
var mix = [];
var key = 'JAYA_token';
var tk = '';

const app = express();
app.use(bodyParser.urlencoded({extended:false}));
app.use('/assets', express.static(__dirname + '/assets'));

// Connection URL
// const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_URI = "mongodb://127.0.0.1:27017";
const PORT = process.env.PORT || 3000;

// Database Name
const dbName = 'JAYA';

// Create a new MongoClient
const client = new MongoClient(MONGODB_URI, { 
    useNewUrlParser: true,
    useUnifiedTopology: true
});

connectionDB();

function connectionDB(){
    client.connect(err => {
        if(err)
        {
            return console.log('Error: Could not connect to database')
        }
    
        console.log("Conectado BD");
        //Collection
        const db = client.db(dbName);
        userCollection = db.collection('user');
    });
}

let saveLog = (dataLog, req, action) => {
    if ((action == 'asc') || (action == 'desc') || (action == 'desc'))
    {
        text = 'Date: ' + new Date() + ' Ip req: ' + req.connection.remoteAddress + ' Type: ' + action + '\r\n';
    }
    else{
        text = 'Date: ' + new Date() + ' Ip req: ' + req.connection.remoteAddress + ' Data: ' + JSON.stringify(dataLog) + ' Action: ' + action + '\r\n';
    }
    fs.appendFile('./assets/log.txt', text, (err)=>{
        if(err) throw err;
        console.log('File: ' + text);
        console.log('Created File');
    })
}

let saveSort = (original, sort) => {
    text = 'Date: ' + new Date() + '\r\n' + 'Original: ' + original + '\r\n' + 'Sorted: ' + sort + '\r\n'; 
    fs.appendFile('./assets/sorted.txt', text, (err)=>{
        if(err) throw err;
        console.log('File: ' + text);
        console.log('Created File');
    })
}

function saveUser(userData, req, res){
    connectionDB();
    saveLog(userData, req, 'saveUser');
    userCollection.insertOne(userData,
       (err, result) => {
        if(err){
            var html='';
            html +=`<body>
                    <br>
                    <br>
                    <br>
                    <div class="container">
                        <div class="row">
                            <div class="col-md-3">
                            </div>
                            <div class="col-md-6 main">
                                <h1>Error recording user</h1>
                                <a href="javascript:history.back()">Go Back</a>
                            </div>
                            <div class="col-md-3">
                            </div>
                        </div>
                    </div>
                </body>`;
            res.send(html);
        }
        console.log(result.ops);
        return res.sendFile(path.join(__dirname+'/success.html'));
    })

    client.close();
}

function getUser(userData, req, res){
    connectionDB();
    saveLog(userData, req, 'getUser');
    userCollection.find(userData).toArray(
       (err, result) => {
        if(err){
            throw err;
        }
        console.log(result);
        if(result.length == 0){
            console.log('User does not exist in the database');
            var html='';
            html +=`<body>
                    <br>
                    <br>
                    <br>
                    <div class="container">
                        <div class="row">
                            <div class="col-md-3">
                            </div>
                            <div class="col-md-6 main">
                                <h1>User does not exist in the database</h1>
                                <a href="javascript:history.back()">Go Back</a>
                            </div>
                            <div class="col-md-3">
                            </div>
                        </div>
                    </div>
                </body>`;
            res.send(html);
        }
        else{
            jwt.sign(JSON.stringify(result), key, (err, token) => {
                if(err){
                    throw err;
                }
                else{
                    tk = token;
                    fs.readFile('./assets/original.txt', 'utf8', (err, data) => {
                        origin = data;
                        let size = data.length;
                        string = data.substring(0, size-1);
                        let vector = string;
                        vector = vector.replace(/(\r\n|\n|\r)/gm, '');
                        vector = vector.split(';');
                        for (let i = 0; i < vector.length; i++) { 
                            let aux = vector[i].replace('[','').replace(']','').replace(' ','');
                            aux = aux.split(',').map(Number);
                            asc[i] = aux.sort(function(a, b){return a-b});
                        }
                        for (let i = 0; i < vector.length; i++) { 
                            let aux = vector[i].replace('[','').replace(']','').replace(' ','');
                            aux = aux.split(',').map(Number);
                            desc[i] = aux.sort(function(a, b){return b-a});
                        }
                        for (let i = 0; i < vector.length; i++) { 
                            let aux = vector[i].replace('[','').replace(']','').replace(' ','');
                            aux = aux.split(',').map(Number);
                            if((i%2)==0)
                            {
                                mix[i]= aux.sort(function(a, b){return a-b});
                            }
                            else{
                                mix[i]= aux.sort(function(a, b){return b-a});
                            }
                        }
                        var html='';
                        html =`<body>
                                <br>
                                <br>
                                <br>
                                <div class="container">
                                    <div class="row">
                                        <div class="col-md-3">
                                        </div>
                                        <div class="col-md-6 main">
                                            <div>
                                                <p id="asc">`+ data +` Array Original</p><br />
                                            </div>
                                            <div class="row">
                                                <div class="col-span3">
                                                    <form method="get" action="/asc">
                                                        <button type="submit">ASC</button>
                                                    </form>
                                                </div>
                                                <div class="col-span3">
                                                    <form method="get" action="/desc">
                                                        <button type="submit">DESC</button>
                                                    </form>
                                                </div>
                                                <div class="col-span3">
                                                    <form method="get" action="/mix">
                                                        <button type="submit">MIX</button>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-3">
                                        </div>
                                    </div>
                                </div>
                            </body>`;
                        res.send(html);
                    });
                }
            });
        }
    })

    client.close();
}

router.post('/sign_up', (req, res) => { //Register
    let user = ''; 
    let pass = ''; 
    user = req.body.user; 
    pass = req.body.pass; 
  
    let data = { 
        "user": user, 
        "pass":pass, 
    } 
    saveUser(data, req, res);
}) 

router.post('/sign_in', (req, res) => { //Login
    let user = ''; 
    let pass = ''; 
    user = req.body.user; 
    pass = req.body.pass; 
  
    let data = { 
        "user": user, 
        "pass":pass, 
    } 
    getUser(data, req, res);
}) 

router.get('/', (req,res) => {
    res.sendFile(path.join(__dirname+'/index.html'));
});

router.get('/sign_up', (req,res) => {
    res.sendFile(path.join(__dirname+'/signup.html'));
});

router.get('/asc', (req, res) => {  
    jwt.verify(tk, key, (err, authData) => {
        if(err) {
          res.sendStatus(403);
        } else {
            saveLog('', req, 'asc');
            saveSort(origin, JSON.stringify(asc));
            var html='';
            html =`<body>
                    <br>
                    <br>
                    <br>
                    <div class="container">
                        <div class="row">
                            <div class="col-md-3">
                            </div>
                            <div class="col-md-6 main">
                            <form id="rendered-form">
                                <div>
                                    <p id="asc">`+ origin +` Array Original</p><br />
                                    <p id="asc">`+ JSON.stringify(asc) +` Array Asc</p><br />
                                    <a href="javascript:history.back()">Go Back</a>
                                </div>
                            </form>
                            </div>
                            <div class="col-md-3">
                            </div>
                        </div>
                    </div>
                </body>`;
            res.send(html);
        }
      });
});

router.get('/desc', (req, res) => {  
    jwt.verify(tk, key, (err, authData) => {
        if(err) {
          res.sendStatus(403);
        } else {
            saveLog('', req, 'desc');
            saveSort(origin, JSON.stringify(desc));
            var html='';
            html =`<body>
                    <br>
                    <br>
                    <br>
                    <div class="container">
                        <div class="row">
                            <div class="col-md-3">
                            </div>
                            <div class="col-md-6 main">
                            <form id="rendered-form">
                                <div>
                                    <p id="asc">`+ origin +` Array Original</p><br />
                                    <p id="asc">`+ JSON.stringify(desc) +` Array DESC</p><br />
                                    <a href="javascript:history.back()">Go Back</a>
                                </div>
                            </form>
                            </div>
                            <div class="col-md-3">
                            </div>
                        </div>
                    </div>
                </body>`;
            res.send(html);
        }
      });
});

router.get('/mix', (req, res) => {
    jwt.verify(tk, key, (err, authData) => {
        if(err) {
          res.sendStatus(403);
        } else {
            saveLog('', req, 'mix');
            saveSort(origin, JSON.stringify(mix));
            var html='';
            html =`<body>
                    <br>
                    <br>
                    <br>
                    <div class="container">
                        <div class="row">
                            <div class="col-md-3">
                            </div>
                            <div class="col-md-6 main">
                            <form id="rendered-form">
                                <div>
                                    <p id="asc">`+ origin +` Array Original</p><br />
                                    <p id="asc">`+ JSON.stringify(mix) +` Array MIX</p><br />
                                    <a href="javascript:history.back()">Go Back</a>
                                </div>
                            </form>
                            </div>
                            <div class="col-md-3">
                            </div>
                        </div>
                    </div>
                </body>`;
            res.send(html);
        }
      });
});

app.use('/', router);
app.listen(PORT, (err) => {
	console.log(`Listening port: ${PORT}`);
});

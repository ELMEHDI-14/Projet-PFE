'use strict';
var DOMParser = require("dom-parser")
var parseString = require('xml2js').parseString;
var unirest = require('unirest');
var Client = require('node-rest-client').Client;
var client = new Client();
var xml2js = require('xml2js');
var parser = xml2js.Parser();
var form = require('form-data');
var http = require('http');
var port = process.env.PORT || 1337;
var bodyParser = require('body-parser');
var fs = require('fs');
var log4js = require('log4js');
var log = log4js.getLogger("Web server");
var express = require('express');
const { response } = require('express');
var app = express();
app.use(log4js.connectLogger(log4js.getLogger("http"), { level: 'auto', format: ':method :url' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.listen(port);
var userName;
var password;
var server_name;
var cmsName;
var server_port
var xmlAuth=''
var logon_token_glo=""

async function get_all_universes() {

    var logon_token = await get_logon_token(xmlAuth);
    console.log("token : " + logon_token)
    var universesArray = [];
    await unirest.get("http://win-govorovcldi:6405/biprws/raylight/v1/universes")
        .headers({ "X-SAP-LogonToken": '"' + logon_token + '"' })
        .then((response) => {

             parseString(response.body, function (err, result) {
                
                 universesArray = result["universes"]["universe"]
                 /*console.log(array_unv[0])
                 console.log(array_unv.lenght)
                 for (var i = 1; i < array_unv.length; i++) {
                     console.log("Univers" + i + "\n" + array_unv[i].name + "\n")
                 }

                 app.get('/getAllUniverses', function (req, res) {
                     res.write(array_unv.toString(), "utf-8");
                     res.end("ok")
                     console.log("hhhh")
                 });
                 */


             })


        })
    console.log(universesArray)
    return universesArray;
     
    
    
}
 async function  get_logon_token(xml) {
     
     
         var logon_token = "";
         await unirest.post("http://win-govorovcldi:6405/biprws/logon/long/").headers({ "Content-Type": "application/xml" }).send(xml).then((response) => {
             var response_body = response.body;
             var xml_res = response_body;
             parseString(xml_res, function (err, result) {
                 logon_token_glo = result["entry"]["content"][0]["attrs"][0]["attr"][0]["_"];
                 logon_token = result["entry"]["content"][0]["attrs"][0]["attr"][0]["_"];
                 console.log('1-'+logon_token)
                 // get_all_universes(logon_token).then((value) => { universeArray_final=value})


             })


         })
     console.log("token i: " + logon_token)
         return logon_token

     
   
   
        }
   


function getAccueil(req, res) {
    res.sendfile("Accueil.html");
}
function getName(req, res) {
    res.sendfile("Name.html");
}


function getFormCoordinates(req, res) {
    
    //res.sendfile("Name.html");
    userName = req.body["username"];
    password = req.body["password"];
    server_name=req.body["server_name"];
    server_port = req.body["server_port"];
    //console.log(server_name);
   
   xmlAuth = "<attrs xmlns='http://www.sap.com/rws/bip/'>" +
        "<attr name='cms' type='string'>" + server_name + ":6400</attr>" +
        "<attr name='userName' type='string'>" + userName + "</attr>" +
        "<attr name='password' type='string'>" + password + "</attr>" +
        "<attr name='auth' type='string' possibilities='secEnterprise,secLDAP,secWinAD'>secEnterprise</attr>" +
        "</attrs>";
   
    async function Callbacks() {
        var universes =[]
        universes = await get_all_universes();
        //console.log('universes ' + universes);
        res.render('universes', { universes: universes})
       /*res.write(universes[0].name.toString(), "utf-8");
       res.end("ok")*/

    }
    
    Callbacks()
    
    
    
    /*
    setTimeout(() => {console.log("this is the first message")}, 30000);
    console.log(sap_logon_token)
    
        
       
    var Request = unirest.post("http://win-govorovcldi:6405/biprws/logon/long/").headers({ "Content-Type": "application/xml" }).send(xmlAuth).then((response) => {


        var response_body = response.body;
        var parseString = require('xml2js').parseString;
        var xml = response_body;
        parseString(xml, function (err, result) {

            logon_token = result["entry"]["content"][0]["attrs"][0]["attr"][0]["_"];
            
            
        })
        
        
    });
    */

    
}
async function getUniverse(req, res) {
    var unv_id = req.query.unvid
    var unv_name = req.query.unvname
    var unv_folders = {}
    console.log("Id of selected universe : " + unv_id)
    await unirest.get("http://win-govorovcldi:6405/biprws/raylight/v1/universes/"+unv_id)
        .headers({ "X-SAP-LogonToken": '"' + logon_token_glo + '"' })
        .then((response) => {
            parseString(response.body, function (err, result) {
                unv_folders=result.universe.outline[0].folder
            })
        })

    res.render('UniverseDetails', { universeDetails: unv_folders, universeName : unv_name })
    console.log(unv_folders[0].item)
    res.render('DataJsonResponse', { universeDetails: unv_folders, universeName: unv_name })
    
    

}
function getSelectedObjects(req,res){
    var selected_objects = req.query.sel_objs
    console.log("Selected Objects Are :" + selected_objects)
    res.write(selected_objects)
    res.end("")
}
app.set("views", "./views")
app.set("view engine","ejs")
app.get("/", getAccueil);
app.post("/getUserCoordinates", getFormCoordinates);
app.get("/universes",getUniverse)
app.get("/selectedObjects",getSelectedObjects)


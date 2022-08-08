'use strict';
var DOMParser = require("dom-parser")
var convert = require("xml-js")
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
const { response, json } = require('express');
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
var selected_unv_id
var json_data
var selected_unv_name
var selected_unv_folders
// Setting endpoints :
app.set("views", "./views")
app.set("view engine", "ejs")
app.get("/", getAccueil);
app.post("/getUserCoordinates", getFormCoordinates);
app.get("/universes", getUniverse)
app.get("/selectedObjects", getSelectedObjects);
// Sends form
function getAccueil(req, res) {
    res.sendfile("Accueil.html");
}

// Gets User form coodrdinates + Calling GetAllUnv.
function getFormCoordinates(req, res) {

    //res.sendfile("Name.html");
    userName = req.body["username"];
    password = req.body["password"];
    server_name = req.body["server_name"];
    server_port = req.body["server_port"];
    //console.log(server_name);

    xmlAuth = "<attrs xmlns='http://www.sap.com/rws/bip/'>" +
        "<attr name='cms' type='string'>" + server_name + ":6400</attr>" +
        "<attr name='userName' type='string'>" + userName + "</attr>" +
        "<attr name='password' type='string'>" + password + "</attr>" +
        "<attr name='auth' type='string' possibilities='secEnterprise,secLDAP,secWinAD'>secEnterprise</attr>" +
        "</attrs>";

    async function Callbacks() {
        var universes = []
        universes = await get_all_universes();
        res.render('universes', { universes: universes })
    }

    Callbacks()

}
// Gets the Logon Token ( new session created in B.O ).
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
// Gets All Universes ( Waits for Logon Token ) and displays them to the user (renders the universes to universes.ejs) .
async function get_all_universes() {

    var logon_token = await get_logon_token(xmlAuth);
    console.log("token : " + logon_token)
    var universesArray = [];
    await unirest.get("http://win-govorovcldi:6405/biprws/raylight/v1/universes")
        .headers({ "X-SAP-LogonToken": '"' + logon_token + '"' })
        .then((response) => {

             parseString(response.body, function (err, result) {
                
                 universesArray = result["universes"]["universe"]
               


             })


        })
    console.log(universesArray)
    return universesArray;
     
    
    
}

/* The selected Universe is send here (by universes.ejs) to be processed. An array of its Paths and Ids is created and is passed as a param. to create_query.
+ renders the universe details to Univers_Details.ejs. */
async function getUniverse(req, res) {
    var unv_id = req.query.unvid
    selected_unv_id= unv_id
    var unv_name = req.query.unvname
    selected_unv_name = unv_name
    var unv_folders = {}
    var unv_paths_and_ids = []
    console.log("Id of selected universe : " + unv_id)
    await unirest.get("http://win-govorovcldi:6405/biprws/raylight/v1/universes/"+unv_id)
        .headers({ "X-SAP-LogonToken": '"' + logon_token_glo + '"' })
        .then((response) => {
            parseString(response.body, function (err, result) {
                unv_folders=result.universe.outline[0].folder
            })
        })
    for (var i = 0; i < unv_folders.length; i++) {
        for (var j = 0; j < unv_folders[i].item.length; j++) {
            var path_id = [unv_folders[i].item[j].path, unv_folders[i].item[j].id]
            unv_paths_and_ids.push(path_id)
        }
    }
    for (var i = 0; i < unv_paths_and_ids.length; i++) {
        console.log()
        console.log("Path : " + unv_paths_and_ids[i][0])
        console.log("Id : " + unv_paths_and_ids[i][1])
        console.log("-----------------------")
    }
    selected_unv_folders=unv_folders
    console.log(unv_folders)
    res.render('UniverseDetails', { universeDetails: unv_folders, universeName: unv_name })

    create_query(unv_paths_and_ids)
}
// XML query is being created and submitted to B.O. The expected result is a query id that is passed as a param. to get_data.
async function create_query(Paths_Ids) {
    console.log(Paths_Ids)
    var query_id
    var query_xml = "<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>"+
        "<query dataSourceType='unx' dataSourceId=" + "'" + selected_unv_id + "'"+" xmlns='http://www.sap.com/rws/sl/universe'>"+
                "<querySpecification version='1.0'>"+
                    "<queryData>"+
                        "<resultObjects>"
    for (var i = 0; i < Paths_Ids.length; i++) {
        console.log(i)
        console.log(Paths_Ids[i][0].toString().includes("'"))
        if (Paths_Ids[i][0].toString().includes("'")) {
            Paths_Ids[i][0] = Paths_Ids[i][0].toString().replace("'", "&apos;")
    
        }
        console.log("--" + Paths_Ids[i][0])
        query_xml = query_xml + "<resultObject path=" + "'" + Paths_Ids[i][0] + "'" + " id=" + "'" + Paths_Ids[i][1] + "'"+"/>"
    }
                            
    query_xml = query_xml+ "</resultObjects>"+
                    "</queryData>"+
                "</querySpecification>"+
        "</query>"
   console.log(query_xml)
    await unirest.post("http://win-govorovcldi:6405/biprws/sl/v1/queries").header("Content-Type" , "application/xml").header("X-SAP-LogonToken" , '"' + logon_token_glo + '"' ).send(query_xml).then((response) => {
        parseString(response.body, function (err, result) {
            console.log(result)
            query_id = result.success.id
            console.log(query_id)
        })
    })
    get_data(query_id)

}

// Gets query data.
async function get_data(query_id) {
    var data
    var url = "http://win-govorovcldi:6405/biprws/sl/v1/queries/" + query_id + "/data.svc/Flows0"
    await unirest.get(url).header("X-SAP-LogonToken", '"' + logon_token_glo + '"').then((response) => {
        console.log(response.body)
     
        parseString(response.body, function (err, result) {
            data = result

    })
        json_data = {
            data: data["feed"]["entry"],
            unv_name: selected_unv_name,
            unv_folder: selected_unv_folders,
            logon_token:logon_token_glo
        }
        console.log(json_data.data[0].content)
        //Create JSON File to get consumed by WDC
    })
}

function getSelectedObjects(req, res) {
    res.header("Access-Control-Allow-Origin", "*")
    res.json(json_data)
    console.log(json_data)
    
}



let request = require("request");
let cheerio = require("cheerio");
let fs = require("fs");
let path = require("path");
let url = "https://www.espncricinfo.com/series/ipl-2020-21-1210595";
let dirpath = "";

function dirCreator(dirpath) {
    if (fs.existsSync(dirpath) == false) {
        fs.mkdirSync(dirpath);
    }
}

function playerfile(teamName, playerName) {
    filepath = path.join(dirpath, teamName, playerName) + ".JSON";
    if (fs.existsSync(filepath) == false) {
        let createStream = fs.createWriteStream(filepath);
        createStream.end();
    }
    return filepath;
}

function writeFile(filePath, arr, obj) {
    if (fs.existsSync(filepath)) {
        let data = fs.readFileSync(filePath);
        if (data.length == 0) {
            fs.writeFileSync(filePath, JSON.stringify(arr));
        }
        else{
            let jsonData = JSON.parse(data);
            jsonData.push(obj);
            fs.writeFileSync(filePath,JSON.stringify(jsonData));
        }
    }
    else{
        fs.writeFileSync(filePath, JSON.stringify(arr));
    }
}

function matchInfomation(html) {
    let seltool = cheerio.load(html);
    let description = seltool(".match-info.match-info-MATCH").find(".description").text().split(",");
    let matchWon = seltool(".match-info.match-info-MATCH").find(".status-text").text();
    let desArr = {
        "date": description[2],
        "venue": description[1],
        "result": matchWon
    }
    return desArr;
}

request(url, cb);
function cb(err, resp, html) {
    if (err)
        console.log(err);
    else
        extractpage(html);
}

function extractpage(html) {
    let selctool = cheerio.load(html);
    let matchresultpage = "https://www.espncricinfo.com/" + selctool(".widget-items.cta-link a").attr("href");
    extractresultpage(matchresultpage);
}

function extractresultpage(url) {
    request(url, cb);
    function cb(err, resp, html) {
        if (err)
            console.log(err);
        else
            resultpage(html);
    }
}

function resultpage(html) {
    let selctool = cheerio.load(html);

    //creating ipl folder
    dirpath = path.join("D:\\Study\\Pepcoding\\Web_H.W\\IPL_Scrapping", "IPL2020");
    dirCreator(dirpath);

    let matchcards = selctool(".match-cta-container");
    console.log(matchcards.length);
    for (let i = 0; i <matchcards.length; i++) {
        let scorecard = selctool(matchcards[i]).find(".btn.btn-sm.btn-outline-dark.match-cta");
        let scorepage = "https://www.espncricinfo.com/" + selctool(scorecard[2]).attr("href");
        extractscorepage(scorepage);
    }
}

function extractscorepage(url) {
    request(url, cb);
    function cb(error, response, html) {
        if (error)
            console.log(error)
        else {
            scorepage(html);
        }
    }
}

function scorepage(html) {
    let seltool = cheerio.load(html);
    let teamnamearr = seltool(".header-title.label");
    let teamArr = [];

    //making the team folder
    for (let i = 0; i < 2; i++) {
        let teamname = seltool(teamnamearr[i]).text().split("INNINGS")[0].trim();
        let teamfolder = path.join(dirpath, teamname);
        teamArr.push(teamname);
        dirCreator(teamfolder);
    }

    //Match Description
    let matchinfo = matchInfomation(html);
    // console.log(matchinfo);

    //finding the batsman table
    let playerTable = seltool(".table.batsman");
    for (let i = 0; i < playerTable.length; i++) {
        let playerNameArr = seltool(playerTable[i]).find("tbody tr");

        //extracting player's name
        for (let j = 0; j < playerNameArr.length - 2; j += 2) {
            let playerdata =  [];
            let playerName = seltool(playerNameArr[j]).find("a").text().trim();
            //creating player's file
            let filepath = playerfile(teamArr[i], playerName);

            let playerRow = seltool(playerNameArr[j]).find("td");
            let obj ={
                opponent_name: (i == 0) ? teamArr[1] : teamArr[0],
                runs: seltool(playerRow[2]).text(),
                balls: seltool(playerRow[3]).text(),
                fours: seltool(playerRow[5]).text(),
                sixes: seltool(playerRow[6]).text(),
                strike_rate: seltool(playerRow[7]).text(),
            }
            obj = {...obj, ...matchinfo}
            playerdata.push(obj)
            writeFile(filepath, playerdata, obj);
        }
    }
}
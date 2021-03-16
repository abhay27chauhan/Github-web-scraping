// https://github.com/topics
const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

url = "https://github.com/topics";

request(url, cb);

function cb(err, response, html){
    if(err){
        console.log("some error occured");
    }else{
        console.log("recieved html \n");
        let $ = cheerio.load(html);

        let matchCards = $(".container-lg.p-responsive.mt-6 .no-underline.d-flex.flex-column.flex-justify-center");
        console.log(matchCards.length);

        for(let i=0; i<matchCards.length; i++){
            let topic = $(matchCards[i]).text()
            let topicName = topic.trim().split("\n")[0];

            let link = $(matchCards[i]).attr("href")
            
            console.log(topicName + " " + link);

            let fullLink = "https://github.com"+link;
            
            request(fullLink, cbsingle);
        }

    }
}

function cbsingle(err, response, html){
    if(err){
        console.log("some error occured");
        return;
    }

    let $ = cheerio.load(html);

    let topicNameArr = $("h1");
    let topicName = $(topicNameArr[0]).text().trim().split("\n")[0];
 
    let pathToFolder = path.join(__dirname, topicName);
    if(fs.existsSync(pathToFolder) === false){
        fs.mkdirSync(pathToFolder);
    }

    let matchCards = $("h1.f3.color-text-secondary.text-normal.lh-condensed");

    for(let i=0; i<8; i++){
        let aArr = $(matchCards[i]).find("a");
        let repoLink = $(aArr[1]).attr("href")

        let fileName = repoLink.split("/").pop()
        let filePath = path.join(pathToFolder, fileName + ".json");
        createFile(filePath);

        let fullLink = "https://github.com"+repoLink;

        getIssuePageLink(fullLink, filePath);
        
    }

}

function createFile(filePath){
    if(fs.existsSync(filePath) === false){
        fs.openSync(filePath, 'w')
    }
}

function getIssuePageLink(fullLink, filePath){
    request(fullLink, cb);

    function cb(err, response, html){
        if(err){
            console.log("some error occured");
            return;
        }

        let $ = cheerio.load(html);
        let aArr = $(".UnderlineNav-body.list-style-none li a");

        let issuePageLink = $(aArr[1]).attr("href");

        let fullLink = "https://github.com" + issuePageLink;

        getIssueData(fullLink, filePath);
    }
}

function getIssueData(fullLink, filePath){
    request(fullLink, cb);

    function cb(err, response, html){
        if(err){
            console.log("some error occured");
            return;
        }

        let $ = cheerio.load(html);
        let block = $(".Box-row.Box-row--focus-gray.p-0.mt-0.js-navigation-item.js-issue-row");
        let arr = []

        for(let i=0; i<block.length; i++){
            let aArr = $(block[i]).find(".Link--primary.v-align-middle.no-underline.h4.js-navigation-open");
            let issueName = aArr.text().trim().split("\n")[0];
            let issueLink = aArr.attr("href");

            let fullLink = "https://github.com" + issueLink

            let issueObj = {
                IssueName: issueName,
                Link: fullLink
            }

            arr.push(issueObj);
        }

        let jsonString = JSON.stringify(arr, null, "\t");
        fs.writeFileSync(filePath, jsonString)

    }
}


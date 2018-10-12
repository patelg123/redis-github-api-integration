const express = require('express');
const request = require('superagent');
const PORT = 3000;

const redis = require('redis');
const REDIS_PORT = 6379;

const app = express();
const client = redis.createClient(REDIS_PORT);


function respond(org, numberOfRepos) {
    return `Organization "${org}" has ${numberOfRepos} public repositories.`;
}

function getNumberOfOrgsRepos(req, res, next) {
    const org = req.query.org;
   request.get(`https://api.github.com/orgs/${org}/repos`, function (err, response) {
        if (err) throw err;

        // response.body contains an array of public repositories
        var repoNumber = response.body.length;

        client.setex(org, 5, repoNumber);

        res.send(respond(org, repoNumber));
    });
};


function cache(req, res, next) {
    const org = req.query.org;
    client.get(org, function (err, data) {
        if (err) throw err;

        if (data != null) {
            res.send(respond(org, data));
        } else {
            next();
        }
    });
}

app.get('/orgs/repos', cache, getNumberOfOrgsRepos);


app.listen(PORT, function () {
    console.log('app listening on port', PORT);
});

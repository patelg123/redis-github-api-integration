const express = require('express');
const request = require('superagent');
const PORT = 3000;

const redis = require('redis');
const REDIS_PORT = 6379;

const app = express();
const client = redis.createClient(REDIS_PORT);


function respond(user, numberOfRepos) {
    return `User "${user}" has ${numberOfRepos} public repositories.`;
}

function getNumberOfRepos(req, res, next) {
    const user = req.query.user;
   request.get(`https://api.github.com/users/${user}/repos`, function (err, response) {
        if (err) throw err;

        // response.body contains an array of public repositories
        var repoNumber = response.body.length;

        client.setex(user, 5, repoNumber);

        res.send(respond(user, repoNumber));
    });
};


function cache(req, res, next) {
    const user = req.query.user;
    client.get(user, function (err, data) {
        if (err) throw err;

        if (data != null) {
            res.send(respond(user, data));
        } else {
            next();
        }
    });
}

app.get('/users/repos', cache, getNumberOfRepos);


app.listen(PORT, function () {
    console.log('app listening on port', PORT);
});

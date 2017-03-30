var express = require('express');
var router = express.Router();
var request = require('request'); 

var Pool = require('../models/pool');
var Movie = require('../models/movies');

router.get('/', function(req, res, next) {
    var data;
    var movies = Movie.find(function(err, docs){
    if(!req.session.pool){
         var pool = new Pool(req.session.pool = {});
    }
    res.render('index', { title: 'Flick Pick', data: data, movies: docs });
    });
});

router.get('/results', function(req, res, next) {
    var searchResult = req.query.search;
    var url = "http://www.omdbapi.com/?s=" + searchResult;
    request(url, function(error, response, body){
        if(!error && response.statusCode == 200) {
         var parsedbody = JSON.parse(body);
         if(!parsedbody["Response"] || parsedbody["Response"] === "False"){
            res.redirect("/");
         } else {
            res.render("index", { title: 'Flick Pick', data: parsedbody });
         }
        }
    });
});

router.get('/add-to-moviepool/:id', function(req, res, next) {
    var movieId = req.params.id;
    var url = "http://www.omdbapi.com/?i=" + movieId;

    request(url, function(error, response, body){
            if(!error && response.statusCode == 200) {
             var parsedbody = JSON.parse(body);
             if(!parsedbody["Response"] || parsedbody["Response"] === "False"){
                res.redirect("/");
             } else {
      
    var pool = new Pool(req.session.pool ? req.session.pool : {});
    var movies = [
        new Movie({ 
            poster: parsedbody.Poster,
            imdbID: movieId,
            detailBody: parsedbody
        })
    ];
    pool.add(movies, movieId);
    req.session.pool = pool;
    res.redirect('/');
             }
            }
        });
});

router.get('/remove/:id', function(req, res, next) {
    var movieId = req.params.id;
    var pool = new Pool(req.session.pool ? req.session.pool : {});
    pool.removeItem(movieId);
    req.session.pool = pool;
    res.redirect('/movie-pool');
});

router.get('/movie-pool', function(req, res, next) {
    if(!req.session.pool) {
        return res.render('movie-pool', {movies: null});
    }
    var pool = new Pool(req.session.pool);
    res.render('movie-pool', {movies: pool.generateArray()});
});

module.exports = router;

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/user/signin');
};

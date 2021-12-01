const express = require('express');
const router = express.Router();
const {redisSet} = require("../middleware/redisMiddleware")
const moviesService = require('../services/moviesService');

/**
 * Endpoint to test the connection to router of movie
 */
router.get("/test", async (req, res) => {
    res.send("Movies endpoint")
});

/**
 * Get list of movies
 * @param sorting - string, what parameter in movie object to sort by
 * @param number - int, how many movies to return
 * @param offset - int, how many movies to skip by
 * @param category - string, how many movies to return
 * @param decending - 1 or 0, 1 - sort and show decending, 0 - sort and show ascending 
 * 
 * @example - GET {BaseURL}/movies/list/title/10/0/Drama/1
 */
router.get("/list/:sorting/:number/:offset/:category/:decending", async (req, res) => {
    const data = await moviesService.getListOfMovies(
        req.params.sorting, 
        req.params.number, 
        req.params.offset, 
        req.params.category, 
        req.params.decending
    );
    if(data.length != 0){
        redisSet(req.originalUrl, JSON.stringify(data));
    }
    res.send(data)
});

/**
 * Get more info about specific movie
 * @param movieId - string, id of the movie 
 * 
 * @example - GET {BaseURL}/movies/details/54724
 */
router.get("/details/:movieId", async (req, res) => {
    const data = await moviesService.getMovieDetails(
        req.params.movieId
    );

    if(data){
        redisSet(req.originalUrl, JSON.stringify(data));
    }

    res.send(data);
});

/**
 * Search for movie by partial string or full string. Same like list but with serch functionality
 * @param sorting - string, what parameter in movie object to sort by
 * @param number - int, how many movies to return
 * @param offset - int, how many movies to skip by
 * @param category - string, how many movies to return
 * @param decending - 1 or 0, 1 - sort and show decending, 0 - sort and show ascending 
 * @param movieName - string, partial or full string of movie
 * 
 * @example - GET {BaseURL}/movies/search/title/10/0/Drama/1/Sata
 */
router.get("/search/:sorting/:number/:offset/:category/:decending/:movieName", async (req, res) => {
    const data = await moviesService.getBySearch(
        req.params.sorting, 
        req.params.number, 
        req.params.offset, 
        req.params.category, 
        req.params.decending, 
        req.params.movieName
    );

    if(data.length != 0){
        redisSet(req.originalUrl, JSON.stringify(data))
    }
    // if(data.length != 0){
    //     redisSet(req.originalUrl + "/" + req.body.movieName, JSON.stringify(data))
    // }

    res.send(data)
});

/**
 * Get list of available sorting parameters for movies endpoints
 * 
 * @example - GET {BaseURL}/movies/sorting
 */
router.get("/sorting", async (req, res) => {
    const data = await moviesService.getSortingMethods();
    
    if(data.length != 0){
        redisSet(req.originalUrl, JSON.stringify(data))
    }

    res.send(data)
});

/**
 * Find movies without a poster and try to update the posters from fallback third party api
 * 
 * @example - GET {BaseURL}/movies/update
 */
router.get("/update", async (req, res) => {
    moviesService.update();
    res.sendStatus(200)
});

module.exports = router;
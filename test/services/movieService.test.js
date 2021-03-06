require('dotenv').config()
process.env.GCPDBUSER = "testing" // Initialize testing env
const moviesModel = require('../../models/moviesModel') 
const moviesService = require('../../services/moviesService') 
const favoritesService = require('../../services/favoritesService') 
const personModel = require('../../models/personModel') 

const sinon = require('sinon')

describe("Movie service testing", () => {

    afterEach(function () {
        sinon.restore() 
    }) 

    describe("getListOfMovies", () => {
        it("getListOfMovies OK", async () => {
            sinon.stub(moviesService, "getMovies").returns("Test works") 
            
            const data = await moviesService.getListOfMovies("sorting", 123, 1, "category", 1, "search") 
            
            assertEquals(data, "Test works")
        })
    })

    describe("getMovies", () => {
        it("getMovies OK no missing details", async () => {
            sinon.stub(moviesModel, "getAllMoviesWithSorting").returns([{posterURL: "poster", description: "description"}]) 
            
            const data = await moviesService.getMovies("sorting", 123, 1, "category", 1, "search") 
            
            assertEquals(data[0].posterURL, "poster")
            assertEquals(data[0].description, "description")
        })

        it("getMovies OK missing posterURL", async () => {
            sinon.stub(moviesModel, "getAllMoviesWithSorting").returns([{posterURL: null, description: "description"}]) 
            sinon.stub(moviesService, "getMoreDataForMovieFromThirdParty").returns({posterURL: "newPoster", description: "description"}) 
            sinon.stub(moviesService, "updateDatabaseMovie")
            
            const data = await moviesService.getMovies("sorting", 123, 1, "category", 1, "search") 
            
            assertEquals(data[0].posterURL, "newPoster")
            assertEquals(data[0].description, "description")
        })

        it("getMovies OK missing description", async () => {
            sinon.stub(moviesModel, "getAllMoviesWithSorting").returns([{posterURL: "poster", description: null}]) 
            sinon.stub(moviesService, "getMoreDataForMovieFromThirdParty").returns({posterURL: "poster", description: "newDescription"}) 
            sinon.stub(moviesService, "updateDatabaseMovie")
            
            const data = await moviesService.getMovies("sorting", 123, 1, "category", 1, "search") 
            
            assertEquals(data[0].posterURL, "poster")
            assertEquals(data[0].description, "newDescription")
        })

        it("getMovies OK missing poster, no poster from third party, OK fallback", async () => {
            sinon.stub(moviesModel, "getAllMoviesWithSorting").returns([{posterURL: null, description: "description"}]) 
            sinon.stub(moviesService, "getMoreDataForMovieFromThirdParty").returns({posterURL: "N/A", description: "description"}) 
            sinon.stub(moviesService, "getPosterFromFallbackThirdParty").returns("newPoster")
            sinon.stub(moviesService, "updateDatabaseMovie")
            
            const data = await moviesService.getMovies("sorting", 123, 1, "category", 1, "search") 
            
            assertEquals(data[0].posterURL, "https://image.tmdb.org/t/p/w500" + "newPoster")
            assertEquals(data[0].description, "description")
        })

        it("getMovies OK missing poster, no poster from third party, null fallback", async () => {
            sinon.stub(moviesModel, "getAllMoviesWithSorting").returns([{posterURL: null, description: "description"}]) 
            sinon.stub(moviesService, "getMoreDataForMovieFromThirdParty").returns({posterURL: "N/A", description: "description"}) 
            sinon.stub(moviesService, "getPosterFromFallbackThirdParty").returns(null)
            sinon.stub(moviesService, "updateDatabaseMovie")
            
            const data = await moviesService.getMovies("sorting", 123, 1, "category", 1, "search") 
            
            assertEquals(data[0].posterURL, "N/A")
            assertEquals(data[0].description, "description")
        })
    })

    describe("getMoreDataForMovieFromThirdParty", () => {
        it("getMoreDataForMovieFromThirdParty OK", async () => {
            sinon.stub(moviesService, "convertIdForAPI").returns("movieId") 
            sinon.stub(moviesModel, "getMovieByIDThirdParty").returns(
                {text: () => { 
                    return JSON.stringify(
                        {
                            Plot: "plot",
                            Poster: "poster",
                            Genre: "genre, genre1",
                            Director: "director, director1",
                            Actors: "actor, actor1",
                            imdbRating: "6.0",
                            imdbVotes: "45000",
                            Runtime: "8 min",
                        }
                    )
                }}
            ) 

            const data = await moviesService.getMoreDataForMovieFromThirdParty(123) 
            
            assertEquals(data.description, "plot")
            assertEquals(data.posterURL, "poster")
            assertEquals(data.genres[0], "genre")
            assertEquals(data.directors[0].name, "director")
            assertEquals(data.actors[0].name, "actor")
            assertEquals(data.rating, 6.0)
            assertEquals(data.votes, 45000)
            assertEquals(data.runtime, "8 min")
        })

        it("getMoreDataForMovieFromThirdParty OK", async () => {
            sinon.stub(moviesService, "convertIdForAPI").returns("movieId") 
            sinon.stub(moviesModel, "getMovieByIDThirdParty").returns(
                {text: () => { 
                    return JSON.stringify(
                        {
                            Plot: "plot",
                            Poster: "poster",
                            Genre: "genre, genre1",
                            Director: "director, director1",
                            Actors: "actor, actor1",
                            imdbRating: "dfs",
                            imdbVotes: "dsfs",
                            Runtime: "N/A",
                        }
                    )
                }}
            ) 

            const data = await moviesService.getMoreDataForMovieFromThirdParty(123) 
            
            assertEquals(data.description, "plot")
            assertEquals(data.posterURL, "poster")
            assertEquals(data.genres[0], "genre")
            assertEquals(data.directors[0].name, "director")
            assertEquals(data.actors[0].name, "actor")
            assertEquals(data.rating, 0.0)
            assertEquals(data.votes, 0)
            assertEquals(data.runtime, "0 min")
        })
    })
    
    describe("getPosterFromFallbackThirdParty", () => {
        it("getPosterFromFallbackThirdParty OK", async () => {
            sinon.stub(moviesService, "convertIdForAPI").returns("movieId") 
            sinon.stub(moviesModel, "getMovieByIDFallbackThirdParty").returns(
                {text: () => { 
                    return JSON.stringify(
                        {
                            poster_path: "posterPath"
                        }
                    )
                }}
            ) 

            const data = await moviesService.getPosterFromFallbackThirdParty(123) 
            
            assertEquals(data, "posterPath")
        })
    })

    describe("convertIdForAPI", () => {
        it("convertIdForAPI OK string id low range", async () => {
            const data = await moviesService.convertIdForAPI("0") 
            
            assertEquals(data, "tt0000000")
        })

        it("convertIdForAPI OK int id high range", async () => {
            const data = await moviesService.convertIdForAPI(9999999) 
            
            assertEquals(data, "tt9999999")
        })

        it("convertIdForAPI OK int id average", async () => {
            const data = await moviesService.convertIdForAPI(12546) 
            
            assertEquals(data, "tt0012546")
        })

        it("convertIdForAPI ERROR too short id", async () => {
            try{
                await moviesService.convertIdForAPI("") 
            }catch{}
        })

        it("convertIdForAPI ERROR too long id", async () => {
            try{
                await moviesService.convertIdForAPI("ssssssssssssssssssssssssssssssssssss") 
            }catch{}
        })
    })

    describe("updateDatabaseMovie", () => {
        it("updateDatabaseMovie OK insert, relate -genre, actor, director non-existent", async () => {
            sinon.stub(moviesModel, "getGenreByName").returns([]) 
            sinon.stub(moviesModel, "insertGenre").returns({insertId: "genreId"}) 
            sinon.stub(moviesModel, "insertMovieToGenre")
            sinon.stub(moviesModel, "getPersonByName").returns([]) 
            sinon.stub(moviesModel, "insertPerson").returns({insertId: "genreId"}) 
            sinon.stub(moviesModel, "insertMovieToPerson")
            sinon.stub(moviesModel, "updateMovie").returns("movieId") 

            sinon.stub(moviesService, "getPhotosForPersons").returns({
                genres: ["genre"],
                actors: [{name:"actor lastName", photoURL: "photo"}],
                directors: [{name:"director lastName", photoURL: "photo"}]
            }) 

            await moviesService.updateDatabaseMovie({
                genres: ["genre"],
                actors: [{name:"actor lastName", photoURL: null}],
                directors: [{name:"director lastName", photoURL: null}]
            }) 

            //Check function calls
        })

        it("updateDatabaseMovie OK insert, relate -genre, actor, director exists", async () => {
            sinon.stub(moviesModel, "getGenreByName").returns([{genreId: "movieId"}]) 
            sinon.stub(moviesModel, "insertMovieToGenre")
            sinon.stub(moviesModel, "getPersonByName").returns([{personId: "personId"}]) 
            sinon.stub(moviesModel, "insertMovieToPerson")
            sinon.stub(moviesModel, "updateMovie").returns("movieId") 
            sinon.stub(moviesService, "getPhotosForPersons").returns({
                genres: ["genre"],
                actors: [{name:"actor", photoURL: "photo"}],
                directors: [{name:"director", photoURL: "photo"}]
            }) 
            
            sinon.stub(moviesModel, "getMovieToGenre").returns([]) 
            sinon.stub(moviesModel, "getMovieToPerson").returns([]) 

            await moviesService.updateDatabaseMovie(
                {
                    genres: ["genre"],
                    actors: [{name: "actor"}],
                    directors: [{name:"director"}]
                }
            ) 
        })

        it("updateDatabaseMovie OK insert, relate -genre, actor, director exists", async () => {
            sinon.stub(moviesModel, "getGenreByName").returns([{genreId: "movieId"}]) 
            sinon.stub(moviesModel, "insertMovieToGenre")

            sinon.stub(moviesModel, "getPersonByName").returns([{personId: "personId"}]) 
            sinon.stub(moviesModel, "insertMovieToPerson")

            sinon.stub(moviesModel, "updateMovie").returns("movieId") 

            sinon.stub(moviesService, "getPhotosForPersons").returns({
                genres: ["genre"],
                actors: [{name:"actor", photoURL: "photo"}],
                directors: [{name:"director", photoURL: "photo"}]
            }) 
            sinon.stub(moviesModel, "getMovieToGenre").returns(["genreLink"]) 
            sinon.stub(moviesModel, "getMovieToPerson").returns(["personLink"]) 

            await moviesService.updateDatabaseMovie(
                {
                    genres: ["genre"],
                    actors: [{name: "actor"}],
                    directors: [{name:"director"}]
                }
            ) 
        })
    })

    describe("getMovieDetailsAndFavorites", () => {
        it("getMovieDetailsAndFavorites OK with favorites", async () => {
            sinon.stub(moviesService, "getMovieDetails").returns({movies: ["movie"]}) 
            sinon.stub(favoritesService, "isMovieInUserFavorites").returns({exists: "true"}) 

            const data = await moviesService.getMovieDetailsAndFavorites("movieId", 1, "userId") 
            
            assertEquals(data.movies[0], "movie")
            assertEquals(data.favorites, "true")
        })

        it("getMovieDetailsAndFavorites OK without favorites", async () => {
            sinon.stub(moviesService, "getMovieDetails").returns({movies: ["movie"]}) 

            const data = await moviesService.getMovieDetailsAndFavorites("movieId", 0, "userId") 
            
            assertEquals(data.movies[0], "movie")
            assertTrue(!data.hasOwnProperty("favorites"))
        })

        it("getMovieDetailsAndFavorites ERROR", async () => {
            sinon.stub(moviesService, "getMovieDetails").returns({error: "Error details"}) 

            const data = await moviesService.getMovieDetailsAndFavorites("movieId", 1, "userId") 
            
            assertEquals(data.error, "Error details")
            assertTrue(!data.hasOwnProperty("favorites"))
        })
    })

    describe("getMovieDetails", () => {
        it("getMovieDetails OK no posterURL", async () => {
            sinon.stub(moviesModel, "getMovieByMovieId").returns([{id: "movieId"}]) 
            sinon.stub(moviesService, "getMoreDataForMovieFromThirdParty").returns({description: "description"}) 
            sinon.stub(moviesService, "getPhotosForPersons").returns({id: "movieId", description: "description", photoURL: "URL"}) 
            sinon.stub(moviesService, "updateDatabaseMovie")

            const data = await moviesService.getMovieDetails("movieId") 
            
            assertEquals(data.id, "movieId")
            assertEquals(data.description, "description")
            assertEquals(data.photoURL, "URL")

        })

        it("getMovieDetails OK", async () => {
            sinon.stub(moviesModel, "getMovieByMovieId").returns([{id: "movieId", posterURL: "poster"}]) 
            sinon.stub(moviesModel, "getPeopleByMovieId").returns([{roleName: "Director", name: "director"}, {roleName: "Actor", name: "actor"}]) 
            sinon.stub(moviesModel, "getGenresByMovieId").returns([{genreName: "genreName"}]) 

            const data = await moviesService.getMovieDetails("movieId") 
            
            assertEquals(data.id, "movieId")
            assertEquals(data.posterURL, "poster")
            assertEquals(data.actors[0].name, "actor")
            assertEquals(data.directors[0].name, "director")
            assertEquals(data.genres[0], "genreName")
        })

        it("getMovieDetails ERROR movie not found", async () => {
            sinon.stub(moviesModel, "getMovieByMovieId").returns([]) 

            const data = await moviesService.getMovieDetails("movieId") 
            
            assertEquals(data.error, "Movie not found")
        })
    }) 

    describe("getBySearch", () => {
        it("getBySearch OK", async () => {
            sinon.stub(moviesService, "getMovies").returns("Test works") 

            const data = await moviesService.getBySearch("sorting", 123, 1, "category", 1, "search") 
            
            assertEquals(data, "Test works")
        })
    })

    describe("getSortingMethods", () => {
        it("getSortingMethods OK", async () => {
            const data = await moviesService.getSortingMethods() 
            
            assertEquals(JSON.stringify(data), JSON.stringify({sortingOptions: ['year', 'title', 'rating', 'votes', 'runtime']}))
        })
    })

    describe("getPhotosForPersons", () => {
        it("getPhotosForPersons OK", async () => {
            sinon.stub(personModel, "searchPersonByName").returns(
                {text: () => { 
                    return JSON.stringify(
                        {
                            results: [
                                {profile_path: "Test"}
                            ]
                        }
                    )
                }}
            ) 

            let passed = {
                directors:[
                    {name: "Director director", photoURL: null}
                ],
                actors:[
                    {name: "Actor actor", photoURL: null}
                ]
            }

            const data = await moviesService.getPhotosForPersons(passed) 
            
            assertEquals(data.directors[0].photoURL, "https://image.tmdb.org/t/p/w500" + "Test")
            assertEquals(data.actors[0].photoURL, "https://image.tmdb.org/t/p/w500" + "Test")
        })

        it("getPhotosForPersons OK N/A", async () => {
            sinon.stub(personModel, "searchPersonByName").returns(
                {text: () => { 
                    return JSON.stringify(
                        {
                            results: [
                                // {profile_path: "Test"}
                            ]
                        }
                    )
                }}
            ) 

            let passed = {
                directors:[
                    {name: "Director director", photoURL: null}
                ],
                actors:[
                    {name: "Actor actor", photoURL: null}
                ]
            }

            const data = await moviesService.getPhotosForPersons(passed) 
            
            assertEquals(data.directors[0].photoURL, "N/A")
            assertEquals(data.actors[0].photoURL, "N/A")
        })
    })
})

function assertEquals(value1, value2){
    if(value1 != value2) throw Error("Failed assert")
}

function assertTrue(value){
    if(!value) throw error
}
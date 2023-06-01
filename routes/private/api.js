const {isEmpty} = require("lodash");
const {v4} = require("uuid");
const db = require("../../connectors/db");
const roles = require("../../constants/roles");
const {getSessionToken} = require('../../utils/session')
const {json} = require("express");
const getUser = async function (req) {
    const sessionToken = getSessionToken(req);
    if (!sessionToken) {
        return res.status(301).redirect("/");
    }
    // console.log(sessionToken)
    const user = await db
        .select("*")
        .from("se_project.sessions")
        .where("token", sessionToken)
        .innerJoin(
            "se_project.users",
            "se_project.sessions.userid",
            "se_project.users.id"
        )
        .innerJoin(
            "se_project.roles",
            "se_project.users.roleid",
            "se_project.roles.id"
        )
        .first();

    // console.log("user =>", user);
    user.isNormal = user.roleid === roles.user;
    user.isAdmin = user.roleid === roles.admin;
    user.isSenior = user.roleid === roles.senior;
    // console.log("user =>", user)
    return user;
};

module.exports = function (app) {
  // example
  app.put("/users", async function (req, res) {
    try {
       const user = await getUser(req);
     // const {userId}=req.body
     console.log("hiiiiiiiiiii");
      const users = await db.select('*').from("se_project.users")
        
      return res.status(200).json(users);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send("Could not get users");
    }
  });


//---------------------------------------------------------------------------
// Check Price:
app.get("/api/v1/tickets/price/:originId/:destinationId", async (req, res) => {  //i changed the link while testing cuz i think it wasnt working but give the original a try it's: /api/v1/tickets/price/:originId& :destinationId
    try{
        const { originId, destinationId } = req.params;
        const existstation1 = await db.select("id").from("se_project.stations").where( "id", originId);
        const existstation2 = await db.select("id").from("se_project.stations").where( "id", destinationId);
        if(!existstation1){
          return res.status(404).send("Origin station doesn't exist");
        }
        else if(!existstation2){
            return res.status(404).send("Destination station doesn't exist");
          }
          else{
              const routeId = await db('stationroutes')
              .where('stationid', originId)
            //   .where('stationid', destinationId)
              .select('routeid')
              .first();

              
              const stationCount = await db('stationroutes')
              .where('routeid', routeId)
              .count();
              
                    if(stationCount == 9){
                        price = await db('zones')
                        .where('zonetype', '9')
                        .select('price')
                    }
                    else if(stationCount>=10 && stationCount<16){
                        price = await db('zones')
                        .where('zonetype', '10-16')
                        .select('price')

                    }
                    else if(stationCount==16){
                        price = await db('zones')
                        .where('zonetype', '16')
                        .select('price')

                    }
                    else{
                        console.log("Error matching stations with price", err.message);
                        return res.status(400).send(err.message);

                    }
                
                    return res.status(201).send(price);
        }
    }
        catch(err){
            console.log("Error checking price", err.message);
            return res.status(400).send(err.message);
        }
});



//------------------------------------------------------------------------
    // Simulate Ride
    app.put("/api/v1/ride/simulate", async (req, res) => {
    try{
        const {origin, destination, tripdate} = req.body;
        const simulatedRide = await db('se_project.rides')
        .where("destination", destination)
        .where("origin", origin)
        .where("tripdate", tripdate)
        .update("status", 'completed')
        .returning("*");
        if (isEmpty( simulatedRide)) {
            console.log("Ride does not exist");
            return res.status(400).send("Ride does not exist");
          }
        console.log("Ride simulated successfully");
        return res.status(200).json(simulatedRide);
    }
    catch(err){
        console.log("Error simulating ride", err.message);
        return res.status(400).send("Error simulating ride, please make sure inputs are correct");
    }
    })

//-----------------------------------------------------------------
    // Pay for ticket by subscription
    //look through el subscription using el user id
    //check if user has sub, if no sub then no pay.
    //if sub then make ticket! 💪🏽
    app.post("/api/v1/tickets/purchase/subscription", async (req, res) => {
        try {
            //check on user if there exists a subscription under his/her user id
            const user = await getUser(req);
            let userid = user["userid"]
            const userSubscription = await db
                .select('*')
                .from('se_project.subscription')
                .where("userid", '=', userid)

            // console.log(userSubscription)
            // console.log(isEmpty(userSubscription))

            if (isEmpty(userSubscription)) {
                //tru = empty therefore no subscription, false = not empty
                console.log("No subscription.")
                return res.status(400).send(userSubscription)
            } else if (userSubscription[0]['nooftickets'] === 0) {
                //tickets are finished
                console.log("Tickets are finished for subscription, renew the subscription or buy normal ticket.")
                return res.status(400).send(userSubscription)
            } else {

                // get the sub id from the user session and getUser
                // get origin and dest and data from user input
                const subid = userSubscription[0]['id']
                //userSubscription is in an array, so we need to access that array first then access id
                // console.log(userSubscription[0]['id'])
                // console.log(subid)
                const {origin, destination, tripdate} = req.body;

                let newPaymentBySubscription = {
                    origin,
                    destination,
                    userid,
                    subid,
                    tripdate
                };

                const paidBySubscription = await db.insert(newPaymentBySubscription).into("se_project.tickets");

                let newNumOfTickets = userSubscription[0]['nooftickets'] - 1

                let updateTickets = await db("se_project.subscription").where('userid', '=', userid).update({
                    nooftickets: newNumOfTickets
                })

                //insert in ticket table
                let newTicket =await db('se_project.tickets').insert({
                    origin:origin,
                    destination:destination,
                    subid:subid,
                    userid:uid,
                    tripdate:tripdate
          
          
                  }).returning("*");
                  //insert upcoming ride in rides table
                  let newRide = await db('se_project.rides').insert({
                    status:'upcoming',
                    origin:origin,
                    destination:destination,
                    userid:userid,
                    ticketid:ret1[0].id,
                    tripdate: tripdate
                    
          
                  }).returning("*");
                  
                  //TODO implement checkprice
                  //get route

                  //get transfer stations

                  // TODO return price,route , transfer stations
                  //ret={origin,destination,uid,tripDate,payedAmount,purchasedId,holderName,creditCardNumber};
                //return res.status(201).json(ret);

                console.log(newNumOfTickets)

                return res.status(201).json(updateTickets);

                //send new data
                //full ticket price
                //routes
                //transfer stations

            }
        } catch (err) {
            console.log("Error paying for ticket by subscription", err.message);
            return res.status(400).send(err.message);
        }
    });


// -Request Senior PUT

    app.put("/api/v1/requests/senior/:requestId", async (req, res) => {
        const {requestId} = req.params;

        let status = await db("se_project.senior_requests")
            .where({id: requestId})
            .select("status")
            .first();

        if (status['status'] === 'accepted') {
            return res.status(400).send("Senior request has already been accepted");
        }
        if (status['status'] === 'rejected') {
            return res.status(400).send("Senior request has already been rejected");
        }

        const existRequest = await db("se_project.senior_requests")
            .where({id: requestId})
            .select("*")
            .first();
        if (!existRequest) {
            return res.status(400).send("Senior request does not exist");
        }
        try {
            const user = await getUser(req);
            // console.log(user)
            const seniorUser = await db.select('*').from('se_project.senior_requests').where('userid', '=', user['userid'])
            console.log(seniorUser)
            let userNID = seniorUser[0]['nationalid'].toString();
            // console.log(userNID)
            if (userNID[0] < 3) {
                let userBYear = parseInt("19" + userNID.substring(1, 3));

                // console.log(userBYear)

                //year has to be less than 63
                thisYear = parseInt(new Date().getFullYear())
                if (thisYear - userBYear >= 60) {
                    //kda checks out and he's a senior
                    status = 'accepted'

                    const updateUserRoleToSenior = await db("se_project.users").where('id', '=', user['userid']).update({
                        roleid: 3
                    })


                } else {
                    status = 'rejected'
                }
            } else {
                status = 'rejected'
            }
            const updateSeniorRequestStatus = await db("se_project.senior_requests")
                .where("id", requestId)
                .update({status: status})
                .returning("*");
            return res.status(200).json(status);

        } catch (err) {
            console.log("error message", err.message);
            return res.status(400).send("Could not update senior request");
        }
    });

//Check price and payment endpoints
    async function helper(
        fromStationId,
        toStationId,
        distances,
        previous,
        count,
        tempcount
    ) {
        const stations = await db("se_project.routes")
            .select("*")
            .where({fromstationid: fromStationId});
        for (let j in stations) {
            if (previous.contains(stations.tostationid[j])) continue;
            else {
                const toStations = await db("se_project.routes")
                    .select("tostationid")
                    .where({fromstationid: stations[j].id});
                if (toStations.length() === 1) continue;
                else {
                    const station = stations[j];
                    count++;
                    if (fromStationId === toStationId) {
                        distances.append(count);
                    } else {
                        helper(station.id, toStationId, distances, previous, count);
                    }
                }
                count = tempcount;
            }
        }
    }

    async function calculateShortestPath(
        fromStationId,
        toStationId,
        distances,
        previous,
        count
    ) {
        const stations = await db("se_project.routes")
            .select("*")
            .where('fromstationid', '=', fromStationId);
        console.log("stations => ", stations)

        for (let i in stations) {
            const stationss = await db("se_project.stations")
                .select("*")
                .where('id', '=', stations[i].tostationid)
                .first();
            console.log("stationss => ", stationss)

            if (stationss.stationtype[i] === "transfer") {
                let tempcount = count;
                helper(
                    stationss.id,
                    toStationId,
                    distances,
                    previous,
                    count,
                    tempcount
                );
            } else {
                if (previous.contains(stations.tostationid[i])) {
                    continue;
                } else {
                    const toStations = await db("se_project.routes")
                        .select("tostationid")
                        .where({fromstationid: stations[i].id});
                    if (toStations.length() === 1) continue;
                    else {
                        const station = stations[i];
                        count++;
                        if (station.fromstationid === toStationId) {
                            distances.append(count);
                        } else {
                            calculateShortestPath(
                                station.id,
                                toStationId,
                                distances,
                                previous,
                                count
                            );
                        }
                    }
                    count = 0;
                }
            }
        }
        let minSoFar = distances[0];
        for (let i in distances) {
            if (distances[i] < minSoFar) minSoFar = distances[i];
        }

        return minSoFar;

        //test tomorrow
        //arrival

        /*
            we will add the stations stopped by in the previous array
            if we find one of the tostations in the previous array we will not execute recursion with it
            we will increment the count with visiting a station
            if we find the destination : increment the count in the distance array and break from the recursion
            else : recusion with the tostations
            for edge stations if the tostations is 1 only
            choose the min from the distances
            */
        // Fetch all stations from the database

        // Initialize distances with infinity, except for the source station which is 0
    }

//calculate the price of ride from origin to destination
//notice that the price will differ.. if user is a subscriber, then it'll cost 1 ticket, else if is senior then apply discount
//---------------------------------------------------------------------------
// Check Price:
    app.get(
        "/api/v1/tickets/price/:originId/:destinationId",
        async (req, res) => {
            // < 9 stations = 5 gneh,
            // 10 - 16 stations = 7 gneh
            // > 16 stations = 10 gneh
            // 50% discount law senior
            //select the stations and save them in an array, select the routes and save them in an array, and select the stations routes and save them in an array,

            try {
                const {originId, destinationId} = req.params;
                let startStation = await db
                    .select("*")
                    .from("se_project.stations")
                    .where("id", "=", originId);
                let endStation = await db
                    .select("*")
                    .from("se_project.stations")
                    .where("id", "=", destinationId);

                //calculate the shortest path
                let distances = {};
                let previous = {};
                let shortestPath = await calculateShortestPath(
                    startStation[0]['id'],
                    endStation[0]['id'],
                    distances,
                    previous,
                    0
                );

                console.log(shortestPath);

                return res.status(200).send("success");
            } catch (err) {
                console.log("Error checking price", err.message);
                return res.status(400).send(err.message);
            }
        }
    );

}
;


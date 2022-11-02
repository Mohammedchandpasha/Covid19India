const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
app.use(express.json());
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();
//get all movies API
app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state;`;
  const states = await db.all(getStatesQuery);
  let list = [];
  for (let s of states) {
    let ob = {
      stateId: s.state_id,
      stateName: s.state_name,
      population: s.population,
    };
    list.push(ob);
  }

  response.send(list);
});

//get single state based on id API
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state 
    WHERE state_id=${stateId};`;
  let s = await db.get(getStateQuery);
  let responseOb = {
    stateId: s.state_id,
    stateName: s.state_name,
    population: s.population,
  };
  response.send(responseOb);
});

//add new district API
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const postDistrictQuery = `
    INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
    VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});
//get district based on ID API

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT * FROM district 
    WHERE district_id=${districtId};`;
  let s = await db.get(getDistrictQuery);
  let responseOb = {
    districtId: s.district_id,
    districtName: s.district_name,
    stateId: s.state_id,
    cases: s.cases,
    cured: s.cured,
    active: s.active,
    deaths: s.deaths,
  };
  response.send(responseOb);
});
//delete district API
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district
     WHERE district_id=${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});
//update district API
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `UPDATE district
    SET 
     district_name='${districtName}',
     state_id=${stateId},
     cases=${cases},
     cured=${cured},
     active=${active},
     deaths=${deaths}
      
    WHERE 
       district_id=${districtId}`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//get stats of patients by stateId API
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getStatsQuery = `SELECT * FROM district 
   NATURAL JOIN state
    WHERE district.state_id=${stateId};`;
  const sta = await db.get(getStatsQuery);

  let ob = {
    totalCases: sta.cases,
    totalCured: sta.cured,
    totalActive: sta.active,
    totalDeaths: sta.deaths,
  };
  response.send(ob);
});
//get state name of district based on districtId API
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameByDistrictId = ` SELECT state.state_name FROM district
    NATURAL JOIN state WHERE district.district_id=${districtId}
    
    `;
  const s = await db.get(getStateNameByDistrictId);
  response.send({ stateName: s.state_name });
});
module.exports = app;

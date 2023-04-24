const express = require("express");
const request = require("request");
const url = require("url");
const mysql = require("mysql");

var app = express();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'softball',
    database: 'cs338proj'
});

connection.connect( function(err) {
    if (err) throw err;
    console.log("Connected");
}
);

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded());

app.listen(8080, ()=> {
    console.log("Server listening on port 8080");
});

app.get("/", function(req, res) {
});

app.get("/add-visit",function(req, res) {

        fromtime = req.query.fromtime;
        totime = req.query.totime;
        carrier = req.query.carrier;
        var html = "";
        html += "<div class='entry with-expire' data-fromtime='" + fromtime + "' data-totime='" + totime + "' data-column='" + req.query.date + "' data-expiry='" + getSun() + "'>" + req.query.location + "<i class='fas fa-times' style='visibility: hidden; float: right;'></i></div>";
        res.send(html);

        setStatus(req.query.user, carrier);
        connection.query('INSERT INTO visits (loc_name, user_id, date, totime, fromtime, carrier) VALUES ("' + req.query.location + '", "' + req.query.user + '", ' + req.query.date + ', ' + totime + ', ' + fromtime + ', ' + carrier + ');', function (err, results) {
            if (err) {
                console.log(err);
            }
        });

        connection.query('INSERT INTO locations (loc_name, visits, cases) VALUES ("' + req.query.location + '", 1, ' + carrier + ') ON DUPLICATE KEY UPDATE visits=visits+1, cases=cases+' + carrier + ';', function (err, results) {
            if (err) {
                console.log(err);
            }
        });
});

app.get("/remove-visit", function(req, res) {

    fromtime = req.query.fromtime;
    totime = req.query.totime;
    username = req.query.username;
    location = req.query.location;
    date = req.query.date;

    connection.query('DELETE FROM visits WHERE loc_name="' + location + '" AND user_id="' + username + '" AND date=' + date + ' AND totime=' + totime + ' AND fromtime=' + fromtime + ';', function(err, results) {
        if (err) {
            console.log(err);
        }
    });
    connection.query('UPDATE locations SET visits=visits-1 WHERE loc_name="' + location + '";', function(err, results) {
        if (err) {
            console.log(err);
        }
    });
});

app.get("/grab-profiles", function(req, res) {

    var html = "";
    var location = req.query.location;
    var fromtime = req.query.fromtime;
    var totime = req.query.totime;
    var date = req.query.date;
    dateArray = ['null', 'null', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    timeArray = ['8 Am', '9 Am', '10 Am', '11 Am', '12 Pm', '1 Pm', '2 Pm', '3 Pm', '4 Pm', '5 Pm', '6 Pm', '7 Pm']
    // 4 situations: entered before and left after, entered before and left before, entered after and left before, entered after and left after
    connection.query('SELECT user_id FROM visits WHERE (loc_name = "' + location +'" AND user_id != "' + req.query.user + '" AND date = ' + date +
                        ') AND ((fromtime <= ' + fromtime + ' AND totime >= ' + fromtime +
                        ') OR (fromtime >= ' + fromtime + ' AND totime <= ' + totime +
                        ') OR (fromtime <= ' + totime + ' AND totime >= ' + totime +
                        ') OR (fromtime <= ' + fromtime + ' AND totime >= ' + totime + '));', async function(err, results, fields) {

                            if (err) { console.log(err)}

                            if (results == undefined) {
                                res.send(html);
                            } else {
                                for (var key in results) {
                                    var row = results[key];
                                    var color = await getColor(row.user_id);
                                    html += '<li style="background-color: ' + color + '" class="with-expire" data-expiry="' + getSun() + '"><span><h4>' + row.user_id + '</h4><div class="user-info">Location: ' + location + '<br> Date: ' + dateArray[date] + '<br> Time: ' + timeArray[fromtime] + '</div></span><i class="fas fa-plus fa-lg"></i></li>';
                                }
                            res.send(html);
                            }
                        });
});

app.get("/grab-nearby-locations", function(req, res) {

    var html = "";
    var loc_info = "";
    var lat = req.query.lat;
    var lon = req.query.lng;

    request('https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + lat + ',' + lon + '&radius=1500&key=API_KEY', async function(err, response, body) {
        let json = JSON.parse(body);
        for (var place in json.results) {
                var photos = json.results[place].photos;
                if (photos) {
                    var src = "https://maps.googleapis.com/maps/api/place/photo?maxheight=" + photos[0].height + "&key=API_KEY&photoreference=" + photos[0].photo_reference;
                } else {
                    var src = 'img/loc-bkg.jpg';
                }

                var results = await getInfo(json.results[place].name);
                html += '<li style="background-image: url(' + src + '); background-size: cover;"><span><h4>' + json.results[place].name + '</h4>' + results[0] + '</span><i class="fas fa-plus fa-lg"></i><i class="fas fa-thumbtack fa-lg"></i>' + results[1] + '</li>';
        }
        res.send(html);
    });
});

app.post("/user-sign-in", function(req, res) {

    var logged_in = false;
    var uname = req.body.uname;
    var pswd = req.body.password;

    query_1 = "SELECT user_id FROM users WHERE user_id = "
    connection.query('SELECT * FROM users WHERE (username = "' + uname + '" AND password = "' + pswd + '");', function(err, results) {
        if (results.length > 0) {
            logged_in = true;
            res.send(logged_in);
        } else {
            res.send(logged_in);
        }
    });
});


app.post("/user-sign-up", function(req, res) {

    var signed_up = false;
    var uname = req.body.uname;
    var pswd = req.body.password;

    connection.query("SELECT * FROM users WHERE (username = '" + uname + "');", function (err, results) {
        if (results.length > 0) {
            res.send(signed_up);
        } else {
            connection.query("INSERT INTO user_info (user_id, color, status) VALUES ('" + uname + "', 'rgba(153, 0, 0, 0.9)', 0);", function(err2, results2) {
                if (err) {
                    console.log(err);
                }
            });
            connection.query("INSERT INTO users (username, password) VALUES ('" + uname + "', '" + pswd + "');", function(err2, results2) {
                signed_up = true;
                res.send(signed_up);
            });
        }
    });
});

app.get("/get-user-info", async function(req, res) {

    var info = {
        "pins": null,
        "carriers": null,
        "log": null,
        "color": null,
        "status": null
    }

    // find out what needs to be sent
    var username = req.query.username;
    var pins = req.query.pins;
    var carriers = req.query.carriers;
    var log = req.query.log;
    var color = req.query.color;
    var status = req.query.status;

    if (pins == "true") {
        var pins = await getPins(username);
        info.pins = pins;
    }
    if (carriers == "true") {
        var carriers = await getCarriers(username);
        info.carriers = carriers;
    }
    if (log == "true") {
        var log = await getLog(username);
        info.log = log;
    }
    if (color == "true") {
        var color = await getColor(username);
        info.color = color;
    }
    if (status == "true") {
        var status = await getStatus(username);
        info.status = status;
    }
    res.send(info);
});

app.post("/set-user-info", function(req, res) {

    // find out which items we need to set
    var username = req.query.username;
    var pins = req.query.pins;
    var carriers = req.query.carriers;
    var log = req.query.log;
    var color = req.query.color;
    var status = req.query.status;
    // grab actual info
    var pinsText = req.body.pins;
    var carriersText = req.body.carriers;
    var logText = req.body.log;
    var colorText = req.body.color;
    var statusText = req.body.status;

    if (pins == "true") {
        var pins = setPins(username, pinsText);
    }
    if (carriers == "true") {
        var carriers = setCarriers(username, carriersText);
    }
    if (log == "true") {
        var log = setLog(username, logText);
    }
    if (color == "true") {
        var color = setColor(username, colorText);
    }
    if (status == "true") {
        var status = setStatus(username, statusText);
    }
    res.status(200);
    res.end();
});

// Below is all the getters/setters for obtaining user information
async function setPins(username, pins) {
    connection.query("UPDATE user_info SET pins='" + pins + "' WHERE user_id='" + username + "';", function(err, results) {
        if (err) {
            console.log(err);
        }
    });
}

async function setLog(username, log) {
    connection.query("UPDATE user_info SET log='" + log + "' WHERE user_id='" + username + "';", function(err, results) {
        if (err) {
            console.log(err);
        }
    });
}

async function setColor(username, color) {
    connection.query("UPDATE user_info SET color='" + color + "' WHERE user_id='" + username + "';", function(err, results) {
        if (err) {
            console.log(err);
        }
    });
}

async function setStatus(username, status) {
    connection.query("UPDATE user_info SET status='" + status + "' WHERE user_id='" + username + "';", function(err, results) {
        if (err) {
            console.log(err);
        }
    });
}

async function setCarriers(username, carriers) {
    connection.query("UPDATE user_info SET carriers='" + carriers + "' WHERE user_id='" + username + "';", function(err, results) {
        if (err) {
            console.log(err);
        }
    });
}

async function getPins(username) {
    let results = await new Promise((resolve, reject) => connection.query("SELECT pins FROM user_info WHERE user_id='" + username + "';", function(err, results) {
        if (err) {
            console.log(err);
        } else {
            resolve(results);
        }
    }));
    return results[0].pins;
}

async function getLog(username) {
    let results = await new Promise((resolve, reject) => connection.query("SELECT log FROM user_info WHERE user_id='" + username + "';", function(err, results) {
        if (err) {
            console.log(err);
        } else {
            resolve(results);
        }
    }));
    return results[0].log;
}

async function getCarriers(username) {
    var carriers = "";

    let results = await new Promise((resolve, reject) => connection.query("SELECT carriers FROM user_info WHERE user_id='" + username + "';", function(err, results) {
        if (err) {
            console.log(err);
        } else {
            resolve(results);
        }
    }));
    return results[0].carriers;
}

function getSun() {

    var curr = new Date();
    var first = curr.getDate() - curr.getDay();
    var last = first + 6;

    curr.setHours(23, 59, 59);
    var lastDay = new Date(curr.setDate(last)).toUTCString();

    return lastDay;
}

async function getColor(username) {
    var color = "";

    let results = await new Promise((resolve, reject) => connection.query("SELECT color FROM user_info WHERE user_id='" + username + "';", function(err, results) {
        if (err) {
            console.log(err);
        } else {
            resolve(results);
        }
    }));
    return results[0].color;
}

async function getStatus(username) {
    var color = "";

    let results = await new Promise((resolve, reject) => connection.query("SELECT status FROM user_info WHERE user_id='" + username + "';", function(err, results) {
        if (err) {
            console.log(err);
        } else {
            resolve(results);
        }
    }));
    return results[0].status;
}
async function getInfo(location) {

    var loc_info = "";
    let results = await new Promise((resolve, reject) => connection.query('INSERT IGNORE INTO locations (loc_name, visits, cases) VALUES ("' + location + '", 0, 0);', function(err, results) {
        if (err) {
            console.log(err);
        } else {
            resolve(results);
        }
    }));

    let results2 = await new Promise((resolve, reject) => connection.query('SELECT visits, cases FROM locations WHERE (loc_name = "' + location + '");', function(err, results) {
        if (err) {
            console.log(err);
        } else {
            resolve(results);
        }
    }));
    var icon = "";
    Object.keys(results2).forEach(function(key) {
        if (results2[key].cases > 0) {
            icon += '<i class="fas fa-exclamation-triangle fa-lg"></i>';
        } else {
            icon += '<i class="fas fa-check-circle fa-lg"></i>';
        }
        loc_info += '<div class="loc-info">Visits This Week: ' + results2[key].visits + ' <br>Covid Cases: ' + results2[key].cases + '<br></div>';
    });
    return [loc_info, icon];
}

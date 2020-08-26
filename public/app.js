var myStorage = window.sessionStorage;

$(document).on("click", ".fa-thumbtack", function() {
    $(this).toggleClass('fa-trash-alt fa-thumbtack');
    $(".pins").append('<li style="background-size: cover; background-image: ' + $(this).parent().css('background-image').replace(/"/g, "") + ';">' + $(this).parent().html() + '</li>');

    var username = myStorage.getItem('username') || undefined;

    if (username !== undefined) {
        var pins = document.getElementById('pins').innerHTML;
        var data = {
            "pins": pins,
            "log": null,
            "carriers": null,
            "color": null,
            "status": null
        }
        $.post({url: "/set-user-info?pins=true&username=" + username, data: data}, function(data) {
        });
    }
    $(this).toggleClass('fa-trash-alt fa-check');

});

$(document).on("click", ".fa-trash-alt", function() {
    if (confirm("You are about to unpin: " + $(this).parent().text())) {
        $( ".near>li:contains('" + $(this).parent().text() + "')" ).children(":nth-child(3)").toggleClass("fa-check fa-thumbtack");
        $(this).parent().remove();
        var username = myStorage.getItem('username') || undefined;

        if (username !== undefined) {
            var pins = document.getElementById('pins');
            var data = {
                "pins": pins,
                "log": null,
                "carriers": null,
                "status": null,
                "color": null
            }
            $.post({url: "/set-user-info?pins=true&username=" + username, data: data}, function(data) {
            });
        }
    }
});

$(document).on("click", '.fa-plus', function() {
    if ($(this).parent().hasClass("extended")) {
        $(this).parent().css({"height": "12%"}).removeClass("extended");
        $(this).toggleClass("flip");
    } else {
        $(this).parent().css({"height": "30%"}).addClass("extended");
        $(this).toggleClass("flip");
    }
});

$(document).on("click", ".add-new-log", function() {
    $(".modal").css("visibility", "visible");
});

$(document).on("click", ".fa-times", function() {
    $(".modal").css({"visibility": "hidden"});
});

$(document).on("click", ".fa-check", function() {
    alert("location is already pinned!");
});

$(window).on("load", function() {
    var months = new Array();
    months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var mon_num = months[new Date().getMonth()];
    var day_num = new Date().getDay() + 2;
    $("#week>td:nth-child(" + day_num + ")").css({"border": "1px solid white", 'border-radius': '0'});
    $("#month").html(mon_num);

    var username = myStorage.getItem('username') || undefined;

    if (username !== undefined) {
        $("#username-holder").css('visibility', 'visible').text(username).toggleClass('slide-in');
        $('.sign-in-form').css('visibility', 'hidden');

        $.get("/get-user-info?pins=true&log=true&carriers=true&username=" + username, function(data) {
            if (data.carriers !== null) {
                $('.users').html(data.carriers);
            }
            if (data.log !== null) {
                $('#log').html(data.log);
            }
            if (data.pins !== null) {
                $('.pins').html(data.pins);
            }
        });
    }


});

$(document).on('click', '.confirm-log', function () {

    var allReq = true;
    $('.required').each(function() {
        if ( $(this).val() === "") {
            allReq = false;
        }
    });

    if (allReq == true) {
        $(".modal").css({"visibility": "hidden"});

        var location = $("#location").val();
        var fromtime = $("#fromtime").val();
        var totime = $("#totime").val();
        var date = $('#date').val();
        var user = $('#username-holder').text();
        var carrier = $('#carrier').val();
        var visit_url = "http://localhost:8080/add-visit?location=" + location + "&date=" + date + "&totime=" + totime + "&user=" + user + "&fromtime=" + fromtime + '&carrier=' + carrier;
        var prof_url = "http://localhost:8080/grab-profiles?location=" + location + "&date=" + date + "&totime=" + totime + "&fromtime=" + fromtime + "&user=" + user;

        var hours = totime - fromtime;
        var init = fromtime;
        init++;
        $.get(visit_url, function(data) {

            while (init != totime) {
                var idd_new = "#" + init + " td:nth-child(" + date + ")";
                $(idd_new).remove();
                init++;
            }
            var idd = "#" + fromtime + " td:nth-child(" + date + ")";
            $(idd).attr('rowspan', hours).toggleClass('logged');
            $(idd).html(data).css('background-color', 'rgba(153, 0, 0, 0.8)');
        }).then(
            $.get(prof_url, function(data) {
                $('.users').append(data);

                var username = myStorage.getItem('username') || undefined;
                if (username !== undefined) {
                    var log = document.getElementById('log').innerHTML;
                    console.log(log);
                    var carriers = document.getElementById('users').innerHTML;
                    data = {
                        "pins": null,
                        "log": log,
                        "carriers": carriers
                    }
                    $.post({url: "/set-user-info?log=true&carriers=true&username=" + username, data: data}, function(data) {
                    });
                }
            })
        );
    } else {
        alert("Please fill in all required fields");
    }


});

$(document).on('click', '#edit-log', function () {
    $(".entry>.fa-times").css('visibility', 'visible');
});

$(document).on('click', '.entry>.fa-times', function() {
    var rows = $(this).parent().parent().attr('rowspan');
    var column = $(this).parent().data('column');
    var init = 0;
    var curr_id = parseInt($(this).parent().parent().parent().attr('id'), 10);

    while (init != rows) {
        if (init == 0) {
            var td = '<td class="inner"></td>';
        } else {
            var td = '<td class="inner"></td><td class="inner"></td>'
        }
        $('#' + curr_id).children('td:nth-child(' + column + ')').replaceWith(td);
        curr_id++;
        init++;
    }

    $(this).parent().parent().remove();

    var username = $('#username-holder').text();
    var date = column;
    var location = $(this).parent().parent().text();
    var fromtime = $(this).parent().data('fromtime');
    var totime = $(this).parent().data('totime');
    $.get('/remove-visit?username=' + username + '&date=' + date + '&location=' + location + '&fromtime=' + fromtime + '&totime=' + totime, function(response) {
        console.log(response);
    })

    var username = myStorage.getItem('username') || undefined;
    if (username !== undefined) {
        var log = document.getElementById('log').innerHTML;
        var carriers = document.getElementById('users').innerHTML;
        data = {
            "pins": null,
            "log": log,
            "carriers": carriers
        }
        $.post({url: "/set-user-info?log=true&username=" + username, data: data}, function(data) {
            console.log(data);
        });
    }
});


$(document).on('click', '.sign-in', function() {

    var username = $('#uname').val();
    var password = $('#password').val();
    var profile = {
        'uname': username,
        'password': password
    }

    $.post({
        traditional: true,
        url: '/user-sign-in',
        contentType: 'application/json',
        data: JSON.stringify( profile ),
        dataType: 'json',
        success: function(response){
            if (response == false) {
                alert('Error: Incorrect Username or Password, please try again.');
            } else {
                myStorage.setItem('username', username);
                $('.sign-in-form').css('visibility', 'hidden');
                $("#username-holder").css('visibility', 'visible').text(username).toggleClass('slide-in');
            }
         }
    } );
});

$(document).on('click', '.sign-up', function() {

    var username = $('#uname').val();
    var password = $('#password').val();
    var profile = {
        'uname': username,
        'password': password
    }

    $.post({
        traditional: true,
        url: '/user-sign-up',
        contentType: 'application/json',
        data: JSON.stringify( profile ),
        dataType: 'json',
        success: function(response) {
            if (response == false) {
                alert('Error: Username is already taken, please try again.');
            } else {
                myStorage.setItem('username', username);
                $('.sign-in-form').css('visibility', 'hidden');
                $("#username-holder").css('visibility', 'visible').text(username).toggleClass('slide-in');
            }
        }
    });
});


$(document).on('click', '.fa-cog', function() {
    $('.settings').toggleClass('slide-in slide-out');
});

$(document).on('click', '.log_out', function() {
    myStorage.removeItem('username');
    $("#username-holder").css('visibility', 'hidden').text(username).toggleClass('slide-in slide-out');
    $('.sign-in-form').css('visibility', 'visible');
});
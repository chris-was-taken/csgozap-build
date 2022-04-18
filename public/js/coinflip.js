/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 START INITIAL SETUP
 */

clientSocket = io.connect();
$(document).ready(function(){
    setTimeout(function () {
        console.log("Welcome to csgozap.com! Please don't try anything nasty!")

        generateNewSecret();

        $('.chat__feed').scrollTop($('.chat__feed')[0].scrollHeight)

        /*    $('.chat__feed').bind("DOMSubtreeModified",function(){
                $('.chat__feed').scrollTop($('.chat__feed')[0].scrollHeight);
            });*/

        var clientsideCoinflipArr = giveClientsideArr();
        localStorage.setItem("frontendCoinflipData",JSON.stringify(clientsideCoinflipArr));
        Object.entries(clientsideCoinflipArr).forEach(([key, val]) => {
            buildMainTemplate(parseInt(key))
        })

        var cfHistory = giveHistory();
        localStorage.setItem("cfHistory",JSON.stringify(cfHistory));
        buildCfHistory();

        //TODO MAYBE FIND A BETTER SOLUTION FOR THIS ONE
        clientSocket.emit("loadInventory");
        clientSocket.emit("loadBotShopInventory");
    },750)
})

$('.chat__feed').scrollTop($('.chat__feed')[0].scrollHeight);


clientSocket.on("updateTotalUsers",function(newTotalUsers) {
    $(".online__number").html(" "+newTotalUsers);
})

clientSocket.on("updateUserStats",function (newWon,status) {

    var previousWon = parseFloat($("#userStatsWon").html());
    var previousLost = parseFloat($("#userStatsLost").html());
    var previousProfit = parseFloat($("#userStatsProfit").html());
    newWon = parseFloat(newWon)

    if(status == "won") {
        previousWon = newWon
        previousProfit = previousWon - previousLost
        $("#userStatsWon").html(previousWon.toFixed(2))
    } else {
        previousLost = newWon
        previousProfit = previousWon - previousLost
        $("#userStatsLost").html(previousLost.toFixed(2))
    }

    $("#userStatsProfit").html(previousProfit.toFixed(2))

    if(previousProfit > 0) {
        $("#userStatsProfit").css("color","green")
    } else {
        $("#userStatsProfit").css("color","red")
    }
})

clientSocket.on("setTradeurl",function() {
    $.magnificPopup.open({
        items: {
            src: $('#modal-set-url')
        },
        removalDelay: 500,
        type: 'inline',
        mainClass: 'mfp-fade',
        enableEscapeKey: false,
        closeOnBgClick: false,
        closeBtnInside: false,
        midClick: true
    });
    if($(".mfp-close").length) {
        $(".mfp-close").remove();
    }
})

$(document).on('click','#resetTradeurl',function (e) {
    $.magnificPopup.open({
        items: {
            src: $('#modal-set-url')
        },
        removalDelay: 500,
        type: 'inline',
        mainClass: 'mfp-fade',
        closeBtnInside: true,
        midClick: true
    });
})

$(document).on('click', '.set-url__submit',function (e) {
    e.preventDefault();
    if(validateTradeurl($('.set-url__input').val())) {
        var tradeurl = $('.set-url__input').val();
        clientSocket.emit('setTradeurl',tradeurl);
        $.magnificPopup.close();
    }
})

$(document).on('click', '#proceed__logout',function (e) {
    $("#logoutForm").submit();
})

$(document).on('keyup', '.set-url__input',function (e) {
    if(validateTradeurl($(this).val())) {
        $(".set-url__tick").html("<svg class=\"icon icon-check\"><use xlink:href=\"img/sprite.svg#icon-check\"></use></svg>")
        $(".set-url__submit").removeClass("divDisabled")
    } else if ($(".set-url__tick").find(".icon-close").length) {
    } else {
        $(".set-url__tick").html("<svg class=\"icon icon-close\"><use xlink:href=\"img/sprite.svg#icon-close\"></use></svg>")
        $(".set-url__submit").addClass("divDisabled")
    }
})

function validateTradeurl(tradeurl) {
/*    const regex = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=[0-9]*&token=[a-zA-Z0-9_-]*!/g;
    let m;
    let matched = false;

    while ((m = regex.exec(requestPackage["tradeURL"])) !== null) {
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        m.forEach((match, groupIndex) => {
            matched = true;
        });
    }

    if (!matched) {
        return false;
    }*/

    tradeurl = tradeurl.toLowerCase();
    if(tradeurl.includes("https://steamcommunity.com/tradeoffer/new/?partner=") && tradeurl.includes("&token=") && !tradeurl.includes(" ")) {
        return true;
    } else {
        return false;
    }
}

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 END INITIAL SETUP
 */

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 START CHAT
 */

var lastMessage = false;
var timeLeft;
var warningCD = false;
function reenableChat() {
    lastMessage = false;
    warningCD = false;
}

clientSocket.on("newChatMessage",function (chatMessage) {
    $(".chat__feed").append(chatMessage);
    $('.chat__feed').scrollTop($('.chat__feed')[0].scrollHeight);
})

$(document).on('click', '.chat__send',function (e) {
    e.preventDefault();
    if(lastMessage == false || $(".chat__input").val().includes("/cj ")) {

        var messageContent = $(".chat__input").val().replace("/cj ","");
        if(messageContent.length > 0 && messageContent.length < 255 ) {
            var urlRegex =/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig;
            messageContent = messageContent.replace(urlRegex,"*");
            clientSocket.emit("newChatMessage", messageContent.replace(/(<([^>]+)>)/ig, ""));
            if(messageContent.length > 0 && messageContent.length < 255 ) {
                $(".chat__input").val("");
                lastMessage = true;
                timeLeft = setTimeout(reenableChat, 10000)
            }
        }
    } else {
        if(warningCD == false) {

            var clientsMessageString = '' +
                '<div class="chat__item">'+
                '<div class="chat__photo"><img style="border-radius: 100%" src="../img/system__warning.png"></div>'+
                '<div class="chat__message">'+
                '<h5 style="color: red" class="message__author">System</h5>'+
                '<p class="message__text">You can only send 1 message every 10 seconds!</p>'+
                '</div>'+
                '</div>'

            $(".chat__feed").append(clientsMessageString);
            warningCD = true;
        }
    }
})

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 END CHAT
 */


/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 START HISTORY
 */

$(document).on('click', '#switch__button',function (e) {
    buildCfHistory();
})

clientSocket.on("updatedHistory",function (newHistory,status) {
    var cfHistory = JSON.parse(localStorage.getItem("cfHistory"));
    if(status == 1) {
        var key = Object.keys(cfHistory).length-1;
    } else {
        var key = Object.keys(cfHistory).length;
    }
    cfHistory[String(key)] = newHistory;
    localStorage.setItem("cfHistory",JSON.stringify(cfHistory));
    buildCfHistory();
})

function buildCfHistory() {
    var cfHistory = JSON.parse(localStorage.getItem("cfHistory"));
    var historyString = "";

    cfHistory = Object.entries(cfHistory).sort(function(a, b){
        return b[1]["misc"]["date"] - a[1]["misc"]["date"] ;
    });

    var private = false;
    if ($("#switch__button").is(":checked")) {
        private = true;
    }

    cfHistory.forEach(function (val,ind) {
        val = val[1];
        if(private == true) {
            if(val["misc"]["private"] != true) {
                return;
            }
        }
        historyString +=
            '<tr>'+
            '<td>'+
            '<div class="ceil-players">'+
            '<div class="ceil-player ceil-player1"> '
        if(val["p1"]["site"] == 0) {
            historyString += '<a target="_blank" href="'+val["p1"]["link"] +'"><img src="'+val["p1"]["image"] +'"></a>'
        } else {
            historyString += '<a target="_blank" href="'+val["p2"]["link"] +'"><img src="'+val["p2"]["image"] +'"></a>'
        }
        historyString +=
            '</div> ' +
            '<span class="versus">vs</span>'+
            '<div class="ceil-player ceil-player2"> '
        if(val["p1"]["site"] == 1) {
            historyString += '<a target="_blank" href="'+val["p1"]["link"] +'"><img src="'+val["p1"]["image"] +'"></a>'
        } else {
            historyString += '<a target="_blank" href="'+val["p2"]["link"] +'"><img src="'+val["p2"]["image"] +'"></a>'
        }
        historyString +=
            '</div>'+
            '</div>'+
            '</td>'+

            '<td>'+
            '<div class="ceil__items">'
        var items = Object.entries(val["items"]).sort(function(a, b){
            return parseFloat(b[1]["value"]) - parseFloat(a[1]["value"]) ;
        });
        items.forEach(function (val,ind) {
            val = val[1];
            if(ind < 9) {
                historyString += '<div class="items__weapon"><img title="'+val["name"]+"  "+parseFloat(val['value']).toFixed(2)+'" src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+val["image"]+'/100fx80f" alt="Weapon">';
                if(ind == 8) {
                    historyString += '<span class="items__more">+'+(items.length - 9)+'</span>';
                }
                historyString += '</div>'
            }
        })
        historyString += '</div>'+
            '</td>'+
            '<td>' +
            '<span class="ceil__value">'+
            '<svg class="icon icon-amount"><use xlink:href="img/sprite.svg#icon-amount"></use></svg>';

            if(val["misc"]["totalValue"] === undefined || val["misc"]["totalValue"] == null) {
                historyString += '<span class="ceil__value-number">??.??</span>'
            } else {
                historyString += '<span class="ceil__value-number">'+val["misc"]["totalValue"].toFixed(2)+'</span>'
            }
            historyString += '</span>'+
            '</td>'+
            '<td> ' +
            '<span class="ceil-winner">'
        if(val["misc"]["winner"] == "p1") {
            if(val["p1"]["site"] == 0) {
                historyString += '<span class="ceil-player ceil-player"><a target="_blank" href="'+val["p1"]["link"] +'"><img src="'+val["p1"]["image"] +'"></a>'
            } else {
                historyString += '<span class="ceil-player ceil-player2"><a target="_blank" href="'+val["p1"]["link"] +'"><img src="'+val["p1"]["image"] +'"></a>'
            }
        } else {
            if(val["p2"]["site"] == 0) {
                historyString += '<span class="ceil-player ceil-player"><a target="_blank" href="'+val["p2"]["link"] +'"><img src="'+val["p2"]["image"] +'"></a>'
            } else {
                historyString += '<span class="ceil-player ceil-player2"><a target="_blank" href="'+val["p2"]["link"] +'"><img src="'+val["p2"]["image"] +'"></a>'
            }
        }
        historyString += '</span> ' +
            '</span>'+
            '</td>'+
            '</tr>'+
            '<tr class="row__data">'+
            '<td COLSPAN=4> ' +
            '<span class="ceil__data">'+
            '<span class="ceil__data-value">Percentage: '+val["misc"]["percentage"]+'%</span> ' +
            '<span class="ceil__data-value">Serverhash: '+val["misc"]["serverhash"]+'</span> ' +
            '<span class="ceil__data-value">Seed: '+val["misc"]["serverseed"]+'</span> ' +
            '<span class="ceil__data-value">Secret: '+val["misc"]["serversecret"]+'</span> ' +
            '<span class="ceil__data-value">Player 1 Secret: '+val["misc"]["p1hash"]+'</span> ' +
            '<span class="ceil__data-value">Player 2 Secret: '+val["misc"]["p2hash"]+'</span> ' +
            '</span>'+
            '</td>'+
            '</tr>';
    })

    $("#history__table").html(historyString)
}

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 END HISTORY
 */

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 START TOTAL STATS
 */

function updateTotalStats() {
    var frontendCoinflipData = JSON.parse(localStorage.getItem("frontendCoinflipData"));
    var totalVal = 0;
    var totalGames = 0;
    var totalItems = 0;
    Object.entries(frontendCoinflipData).forEach(function (val,ind) {
        val = val[1]
        var value1 = parseFloat(val["p1"]["value"])
        var value2 = 0;
        var p2items = 0;
        if(val["p2"]["joined"]) {
            value2 = parseFloat(val["p2"]["value"])
            p2items = Object.entries(val["p2items"]).length
        }
        totalVal += value1
        if(!isNaN(value2) && value2 !== 0) {
            totalVal += value2
        }
        totalGames++;
        var p1items = Object.entries(val["p1items"]).length
        totalItems += p1items;
        if(p2items !== 0) {
            totalItems += p2items
        }
    })
    $("#headerTotalAmount").html(" "+totalVal.toFixed(2))
    $("#headerTotalItems").html(" "+totalItems)
    $("#headerTotalGames").html(" "+totalGames)
}

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 END TOTAL STATS
 */




/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 START MAIN TEMPLATE BUILD
 */

function deleteCoinflipero(coinflipID) {
    $("[data-cf-id='"+coinflipID+"']").remove();
    if($("[data-coinflip-view-id='"+coinflipID+"']").length) {
        $(this).parent().empty();
    }
    var coinflipInformations = JSON.parse(localStorage.getItem("frontendCoinflipData"));
    delete coinflipInformations[String(coinflipID)]
    localStorage.setItem("frontendCoinflipData",JSON.stringify(coinflipInformations));
    updateTotalStats();
}

clientSocket.on("deleteCoinflip",function (coinflipID) {
    $("[data-cf-id='"+coinflipID+"']").remove();
    if($("[data-coinflip-view-id='"+coinflipID+"']").length) {
        $(this).parent().empty();
    }
    var coinflipInformations = JSON.parse(localStorage.getItem("frontendCoinflipData"));
    delete coinflipInformations[String(coinflipID)]
    localStorage.setItem("frontendCoinflipData",JSON.stringify(coinflipInformations));
    updateTotalStats();
})

clientSocket.on("updateCoinflipArray",function (coinflipArray,coinflipID) {
    var frontendCoinflipData = JSON.parse(localStorage.getItem("frontendCoinflipData"));
    frontendCoinflipData[String(coinflipID)] = coinflipArray;
    localStorage.setItem("frontendCoinflipData", JSON.stringify(frontendCoinflipData));
    buildMainTemplate(coinflipID)
    if($(".mfp-close-btn-in").length) {
        if(parseInt($("[data-coinflip-view-id]").attr("data-coinflip-view-id")) == parseInt(coinflipID)) {
            buildViewPopup(coinflipID)
        }
    }
})

function buildMainTemplate(coinflipId) {

    var coinflipInformations = JSON.parse(localStorage.getItem("frontendCoinflipData"))[coinflipId];

    var p1 = coinflipInformations["p1"];
    var p1items = coinflipInformations["p1items"];
    var p2 = coinflipInformations["p2"];
    var p2items = coinflipInformations["p2items"];

    var normalTimer = false;
    var finalTimer = false;
    var winnerImage;

    var isP2 = true;
    if(p2["image"] === undefined || p2["image"] === null) {
        isP2 = false;
        var allItems = [...Object.entries(p1items)];
        allItems = allItems.sort(function(a, b){
            return parseFloat(b[1]["val"]) - parseFloat(a[1]["val"]) ;
        });
        var valuez = parseFloat(p1["value"]).toFixed(2)
    } else if(p2["joined"] === false) {
        var allItems = [...Object.entries(p1items)];
        allItems = allItems.sort(function(a, b){
            return parseFloat(b[1]["val"]) - parseFloat(a[1]["val"]) ;
        });
        var valuez = parseFloat(p1["value"]).toFixed(2)
    } else {
        var allItems = [...Object.entries(p1items) , ...Object.entries(p2items)];
        allItems = allItems.sort(function(a, b){
            return parseFloat(b[1]["val"]) - parseFloat(a[1]["val"]) ;
        });
        var valuez = (parseFloat(p1["value"]) + parseFloat(p2["value"])).toFixed(2)
    }

    <!-- new row -->
    var templateString =
        '<tr data-cf-id="'+coinflipId+'" data-cf-val="'+valuez+'" class="fading fadeIN">'+
        '<td>'+
        '<div class="ceil-players">';
    if(p1["site"] == 0) {
        templateString +=
            '<div class="ceil-player ceil-player1"> ' +
            '<a target="_blank" href="'+p1["url"]+'"><img src="'+p1["image"]+'" alt="Player name"></a>' +
            '</div> '
    } else if (isP2) {
        templateString +=
            '<div class="ceil-player ceil-player1"> ' +
            '<a target="_blank" href="'+p2["url"]+'"><img src="'+p2["image"]+'" alt="Player name"></a>' +
            '</div> '
    } else{
        templateString +=
            '<div class="ceil-player ceil-player1 ceil-unknown"> ' +
            '<span class="sign-question">?</span> ' +
            '</div>'
    }

    templateString += '<span class="versus">vs</span>';

    if(p1["site"] == 1) {
        templateString +=
            '<div class="ceil-player ceil-player2"> ' +
            '<a target="_blank" href="'+p1["url"]+'"><img src="'+p1["image"]+'" alt="Player name"></a>' +
            '</div> '
    } else if (isP2) {
        templateString +=
            '<div class="ceil-player ceil-player2"> ' +
            '<a target="_blank" href="'+p1["url"]+'"><img src="'+p2["image"]+'" alt="Player name"></a>' +
            '</div> '
    } else{
        templateString +=
            '<div class="ceil-player ceil-player2 ceil-unknown"> ' +
            '<span class="sign-question">?</span> ' +
            '</div>'
    }
    templateString +=
        '</div>'+
        '</td>'+
        '<td>'+
        '<div class="ceil__items">';

    var totalValue = 0;
    var counter = 0;
    allItems.forEach(([key, val]) => {
        totalValue += parseFloat(val["val"]);
        if(counter < 5) {
            if(counter == 4 && allItems.length > 5) {
                templateString += '<div class="items__weapon"><img title="'+val["hashname"]+"  "+val['val'].toFixed(2)+'" src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+val["iconurl"]+'/300fx250f" alt="Weapon"><span class="items__more">+'+(allItems.length-5)+'</span></div>';
            }else {
                templateString += '<div class="items__weapon"><img title="'+val["hashname"]+"  "+val['val'].toFixed(2)+'" src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+val["iconurl"]+'/300fx250f" alt="Weapon"></div>';
            }
            counter++;
        }
    });

    templateString +=
        '</div>'+
        '</td>'+
        '<td>' +
        '<span class="ceil__value">'+
        '<svg class="icon icon-amount"><use xlink:href="img/sprite.svg#icon-amount"></use></svg>'+
        '<span class="ceil__value-number">'+totalValue.toFixed(2)+'</span> </span>'+
        '</td>'+
        '<td>'
    if(!isP2) {
        templateString += '<span class="status-open">OPEN</span>';
    } else if(isP2 && p2["joined"] === false) {
        var time = 100 - ((Date.now() - p2["joinDate"]) / 1000);
        time = 2 * Math.round(time / 2);
        var unit = 113.096 / 100;
        var offset = (100 - time) * unit;
        templateString += '<div class="ceil__chart">'+
            '<div class="chart__cont" data-pct="'+time+'"> ' +
            '<svg class="chart__svg" width="40" height="40" viewPort="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg">'+
            '<circle r="18" cx="20" cy="20" fill="transparent" stroke-dasharray="113.096" stroke-dashoffset="0"></circle>'+
            '<circle class="chart__bar" r="18" cx="20" cy="20" fill="transparent" stroke-dasharray="113.096" stroke-dashoffset="0" style="stroke-dashoffset:'+offset+'px"></circle>'+
            '</svg> ' +
            '</div>'+
            '</div>'
        normalTimer = true;
    } else {
        var finalTime= (10 - ((Date.now() - p2["acceptedDate"]) / 1000)).toFixed(1);
        var imageString = "";
        if(coinflipInformations["winner"] == "p1") {
            if(p1["site"] == 0) {

                imageString = '<div class="ceil-player ceil-player1" style="margin: 0 auto;">'+
                    '<a target="_blank" href="'+p1["url"]+'"><img src="'+p1["image"]+'"></a>'+
                    '</div>'
                winnerImage = imageString
            } else {
                imageString = '<div class="ceil-player ceil-player2" style="margin: 0 auto;">'+
                    '<a target="_blank" href="'+p1["url"]+'"><img src="'+p1["image"]+'"></a>'+
                    '</div>'
                winnerImage = imageString
            }
        } else {
            if(p2["site"] == 0) {
                imageString = '<div class="ceil-player ceil-player1" style="margin: 0 auto;">'+
                    '<a target="_blank" href="'+p2["url"]+'"><img src="'+p2["image"]+'"></a>'+
                    '</div>'
                winnerImage = imageString
            } else {
                imageString = '<div class="ceil-player ceil-player2" style="margin: 0 auto;">'+
                    '<a target="_blank" href="'+p2["url"]+'"><img src="'+p2["image"]+'"></a>'+
                    '</div>'
                winnerImage = imageString
            }
        }
        if(finalTime <= 0) {
            templateString += imageString;
        } else {
            var unit = 113.096 / 10;
            var offset = (10 - finalTime) * unit;
            templateString += '<div class="ceil__chart chart__cont--rose">'+
                '<div class="chart__cont" data-final-placeholder="'+finalTime+'" data-pct="'+finalTime+'"> <svg class="chart__svg" width="40" height="40" viewPort="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg">'+
                '<circle r="18" cx="20" cy="20" fill="transparent" stroke-dasharray="113.096" stroke-dashoffset="0"></circle>'+
                '<circle class="chart__bar" r="18" cx="20" cy="20" fill="transparent" stroke-dasharray="113.096" stroke-dashoffset="0" style="stroke-dashoffset:'+offset+'px"></circle>'+
                '</svg> </div>'+
                '</div>'
            finalTimer = true;
        }
    }
    templateString += '</td>'+
        '<td>'+
        '<div class="ceil__action"> ';
    if(!isP2) {
        templateString += '<a role="button" class="btn btn--rose popup-with-zoom-anim my-mfp-zoom-in">Join</a>' +
            '<a role="button" class="btn btn--purple popup-with-zoom-anim my-mfp-zoom-in">View</a> '
    } else {
        templateString += '<a role="button" class="btn btn--purple popup-with-zoom-anim my-mfp-zoom-in">View</a> '
    }
    templateString += '</div>'+
        '</td>'+
        '</tr>';

    if($("[data-cf-id='"+coinflipId+"']").length) {
        $("[data-cf-id='"+coinflipId+"']").replaceWith(templateString)
    } else {
        if ($("[data-cf-id]").length) {
            var check = false;
            var length = $("[data-cf-id]").length;
            $("[data-cf-id]").each(function (ind, val) {
                var amount = parseFloat($(this).attr("data-cf-val"))
                if (valuez > amount && check === false) {
                    $(templateString).insertBefore($(this));
                    check = true;
                } else if (check === false && ind === length - 1) {
                    $("#main__table").append(templateString)
                }
            })
        } else {
            $("#main__table").append(templateString)
        }
    }
    if(normalTimer == true) {
        startTimer(coinflipId)
    } else if (finalTimer == true) {
        startFinalTimer(coinflipId,winnerImage)
    }

    updateTotalStats();
}

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 END MAIN TEMPLATE BUILD
 */

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 START CF ANIMATION
 */

var globalSpinInterval;
var globalSpinCheck = false;

function spinDaCoin(coinflipID,winningSite) {
    if(globalSpinCheck) {
    } else {
        globalSpinCheck = true;
        setTimeout(function () {
            globalSpinInterval = setInterval(function () {
                var elemento = $(".coinflip-animation");
                var old_x = parseInt(elemento.css("background-position").split(" ")[0].split("px")[0]);
                var old_y = parseInt(elemento.css("background-position").split(" ")[1].split("px")[0]);
                var new_x = old_x;
                var new_y = old_y;

                if(winningSite == 0) {
                    if (old_x <= -1200 && old_y <= -1800) {
                        clearInterval(globalSpinInterval);
                        globalSpinCheck = false;
                        buildViewPopup(coinflipID)
                    } else {
                        if (old_x == -3600 && old_y !== -1800) {
                            new_x = 0;
                            new_y = old_y - 200;
                        } else if (old_x !== -3600) {
                            new_x = old_x - 200;
                        }

                        elemento.css("background-position", new_x + "px " + new_y + "px");
                    }
                } else {

                    if(old_x == -2800 && old_y == -1600) {
                        old_x = -1000;
                        old_y = -2000;
                    }

                    if (old_x <= -600 && old_y <= -2400) {
                        clearInterval(globalSpinInterval);
                        globalSpinCheck = false;
                        buildViewPopup(coinflipID)
                    } else {

                        if (old_x == -3600 && old_y !== -2400) {
                            new_x = 0;
                            new_y = old_y - 200;
                        } else if (old_x !== -3600) {
                            new_x = old_x - 200;
                            new_y = old_y;
                        }

                        elemento.css("background-position", new_x + "px " + new_y + "px");
                    }
                }
            }, 35)
        },500)
    }
}

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 END CF ANIMATION
 */

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 START VIEW POPUP BUILD
 */

function buildViewPopup(coinflipId) {

    var coinflipInformations = JSON.parse(localStorage.getItem("frontendCoinflipData"))[coinflipId];

    var p1 = coinflipInformations["p1"];
    var p1items = Object.entries(coinflipInformations["p1items"]).sort(function(a, b){
        return parseFloat(b[1]["val"]) - parseFloat(a[1]["val"]) ;
    });
    var p2 = coinflipInformations["p2"];
    var p2items = Object.entries(coinflipInformations["p2items"]).sort(function(a, b){
        return parseFloat(b[1]["val"]) - parseFloat(a[1]["val"]) ;
    });

    var normalTimer = false;
    var finalTimer = false;
    var winnerImage;
    var p1perc = 50.00;
    var p2perc = 10000;
    var winningSite = 0;

    var isP2 = true;
    if(p2["image"] === undefined || p2["image"] === null) {
        isP2 = false;
    } else if(p2["joined"] === false) {
    } else {
        p1perc = ((p1["value"] / (p1["value"] + p2["value"])) * 100).toFixed(2)
        p2perc = (100 - p1perc).toFixed(2)
    }

    if(p2["joined"] == true) {
        if(coinflipInformations["winner"] == "p1") {
            if(p1["site"] == 0) {
                winningSite = 0
            } else {
                winningSite = 1
            }
        } else {
            if(p2["site"] == 0) {
                winningSite = 0
            } else {
                winningSite = 1
            }
        }
    }

    var flipable = false;
    if (p2["joined"] == true && (Date.now() - p2["acceptedDate"]) > 9500 && (Date.now() - p2["acceptedDate"]) < 12500  ) {
        flipable = true;
    }

    var viewString =
        '<h3 class="modal__title" data-coinflip-view-id="'+coinflipId+'">Coinflip Round '+coinflipId+'</h3>'+
        '<div class="game">'+
        '<div class="game__players-wrap">'+
        '<div class="game__players">'
    if(p1["site"] == 0) {
        viewString += '<div class="game__player game__player1">' +
            '<h4 class="game__player-name">' + p1["name"] + '</h4>' +
            '<div class="game__player-photo"> ' +
            '<a target="_blank" href="'+p1["url"]+'"><img src="' + p1["image"].replace("medium", "full") + '" alt="Player"></a>' +
            '<span class="game__coin game__coin1">'+
            '<img src="img/coin-red.png" alt="Coin">'+
            '</span> ' +
            '</div>' +
            '</div>'
    } else if(isP2) {
        viewString += '<div class="game__player game__player1">' +
            '<h4 class="game__player-name">' + p2["name"] + '</h4>' +
            '<div class="game__player-photo"> ' +
            '<a target="_blank" href="'+p2["url"]+'"><img src="' + p2["image"].replace("medium", "full") + '" alt="Player"> </a>' +
            '<span class="game__coin game__coin1">'+
            '<img src="img/coin-red.png" alt="Coin">'+
            '</span> ' +
            '</div>' +
            '</div>'
    } else {
        viewString += '<div class="game__player game__player--unknown">' +
            '<div class="game__player-photo first__site__unknown"><span>?</span>'+
            '<span class="game__coin game__coin1">'+
            '<img src="img/coin-red.png" alt="Coin">'+
            '</span> ' +
            '</div></div>'
    }
    if(p2["acceptedDate"]) {
        if((10 - ((Date.now() - p2["acceptedDate"]) / 1000)).toFixed(1) < 0 && flipable == false) {
            viewString += '<span class="game__hash" style="bottom: 30px;">Percentage: '+coinflipInformations["winnerPerc"]+'</span>'
        }
    }
    viewString += '<span class="game__hash">Hash: '+coinflipInformations["serverhash"]+'</span>'
    viewString += '<div class="game__sign-vs table"> '
    if(!isP2) {
        //TODO BASIC / OPEN
    } else if(isP2 && p2["joined"] === false) {
        var time = 100 - ((Date.now() - p2["joinDate"]) / 1000);
        time = 2 * Math.round(time / 2);
        var unit = 408.407 / 100;
        var offset = (100 - time) * unit;
        viewString += '<div class="ceil__chart">'+
            '<div class="chart__cont" data-pct="'+time+'"> ' +
            '<svg class="chart__svg" width="150" height="150" viewPort="10 10 75 75" version="1.1" xmlns="http://www.w3.org/2000/svg">'+
            '<circle r="65" cx="75" cy="75" fill="transparent" stroke-dasharray="408.407" stroke-dashoffset="0"></circle>'+
            '<circle class="chart__bar" r="65" cx="75" cy="75" fill="transparent" stroke-dasharray="408.407" stroke-dashoffset="0" style="stroke-dashoffset:'+offset+'px"></circle>'+
            '</svg> ' +
            '</div>'+
            '</div>'
        normalTimer = true;
    } else {
        if(flipable) {
            viewString +=
                '<div class="cf-animation-holder">'+
                '<div class="coinflip-animation" style="background-position: 0px 0px; border-radius: 100%">'+
                '</div>'+
                '</div>';
        } else {

            var finalTime = (10 - ((Date.now() - p2["acceptedDate"]) / 1000)).toFixed(1);
            var imageString = "";
            imageString +=
                '<div class="cf-animation-holder">'
            if( winningSite == 0) {
                imageString += '<div class="coinflip-animation" style="background-position: -800px -2000px; border-radius: 100%">'
            }else {
                imageString += '<div class="coinflip-animation" style="background-position: -800px -2400px; border-radius: 100%">'
            }
            imageString += '</div>'+
                '</div>';

            if (finalTime <= 0) {
                viewString += imageString;
            } else {
                var unit = 408.407 / 10;
                var offset = (10 - finalTime) * unit;
                viewString += '<div class="ceil__chart chart__cont--rose">' +
                    '<div class="chart__cont" data-final-placeholder="' + finalTime + '" data-pct="' + finalTime + '"> ' +
                    '<svg class="chart__svg" width="150" height="150" viewPort="10 10 75 75" version="1.1" xmlns="http://www.w3.org/2000/svg">' +
                    '<circle r="65" cx="75" cy="75" fill="transparent" stroke-dasharray="408.407" stroke-dashoffset="0"></circle>' +
                    '<circle class="chart__bar" r="65" cx="75" cy="75" fill="transparent" stroke-dasharray="408.407" stroke-dashoffset="0" style="stroke-dashoffset:' + offset + 'px"></circle>' +
                    '</svg> ' +
                    '</div>' +
                    '</div>'
                finalTimer = true;
            }
        }
    }
    viewString += '</div>'
    if(p1["site"] == 1) {
        viewString += '<div class="game__player game__player2">' +
            '<h4 class="game__player-name">' + p1["name"] + '</h4>' +
            '<div class="game__player-photo"><a target="_blank" href="'+p1["url"]+'"><img src="' + p1["image"].replace("medium","full") + '" alt="Player"></a>' +
            '<span class="game__coin game__coin2">'+'' +
            '<img src="img/coin-purple.png" alt="Coin">'+
            '</span> ' +
            '</div> ' +
            '</div>'
    } else if(isP2) {
        viewString += '<div class="game__player game__player2">' +
            '<h4 class="game__player-name">' + p2["name"] + '</h4>' +
            //TODO SEE IF THE CROWN SYMBOL WORKS HERE TOO
            //'<div class="game__player-photo player--winner"> <a target="_blank" href="'+p2["url"]+'"><img src="' + p2["image"].replace("medium","full") + '" alt="Player"></a>' +
            '<div class="game__player-photo"> <a target="_blank" href="'+p2["url"]+'"><img src="' + p2["image"].replace("medium","full") + '" alt="Player"></a>' +
            '<span class="game__coin game__coin2">'+
            '<img src="img/coin-purple.png" alt="Coin">'+
            '</span> ' +
            '</div> ' +
            '</div>'
    } else {
        viewString += '<div class="game__player game__player--unknown">' +
            '<div class="game__player-photo second__site__unknown"> <span>?</span>'+
            '<span class="game__coin game__coin2">'+
            '<img src="img/coin-purple.png" alt="Coin">'+
            '</span>'+
            '</div>'+
            '</div>'
    }
    viewString +=
        '</div>'+
        '</div>'+
        '<div class="weapons__info-wrap">'+
        '<div class="weapons__info-inner">'+
        '<div class="weapons__info">'
    if(p1["site"] == 0) {
        viewString += '<p class="game__value"> ' +
            '<svg class="icon icon-amount"><use xlink:href="img/sprite.svg#icon-amount"></use></svg> ' +
            '<span>'+parseFloat(p1["value"]).toFixed(2)+'</span> ' +
            '</p>' +
            '<div class="game__stats"> ' +
            '<span class="game__items">'+p1items.length
        if(p1items.length == 1) {
            viewString += " Item"
        } else {
            viewString += " Items"
        }
        viewString+='</span> ' +
            '<span class="game__percent">'+p1perc
        viewString += '%</span> ' +
            '</div>'
    } else if(p2perc !== 10000) {
        viewString += '<p class="game__value"> ' +
            '<svg class="icon icon-amount"><use xlink:href="img/sprite.svg#icon-amount"></use></svg> ' +
            '<span>'+parseFloat(p2["value"]).toFixed(2)+'</span> ' +
            '</p>' +
            '<div class="game__stats"> ' +
            '<span class="game__items">'+p2items.length
        if(p2items.length == 1) {
            viewString += " Item"
        } else {
            viewString += " Items"
        }
        viewString+='</span> ' +
            '<span class="game__percent">'+p2perc
        viewString += '%</span> ' +
            '</div>'
    } else if (!isP2) {
        viewString += '<a role="button" class="btn--rose btn game__join-btn">Join</a>'
    }
    viewString += '</div>'+
        '<div class="weapons__info weapons__info--2">'
    if(p1["site"] == 1) {
        viewString += '<p class="game__value"> ' +
            '<svg class="icon icon-amount"><use xlink:href="img/sprite.svg#icon-amount"></use></svg> ' +
            '<span>'+parseFloat(p1["value"]).toFixed(2)+'</span> ' +
            '</p>' +
            '<div class="game__stats"> ' +
            '<span class="game__items">'+p1items.length
        if(p1items.length == 1) {
            viewString += " Item"
        } else {
            viewString += " Items"
        }
        viewString+='</span> ' +
            '<span class="game__percent">'+p1perc
        viewString += '%</span> ' +
            '</div>'
    } else if(p2perc !== 10000) {
        viewString += '<p class="game__value"> ' +
            '<svg class="icon icon-amount"><use xlink:href="img/sprite.svg#icon-amount"></use></svg> ' +
            '<span>'+parseFloat(p2["value"]).toFixed(2)+'</span> ' +
            '</p>' +
            '<div class="game__stats"> ' +
            '<span class="game__items">'+p2items.length
        if(p2items.length == 1) {
            viewString += " Item"
        } else {
            viewString += " Items"
        }
        viewString+='</span> ' +
            '<span class="game__percent">'+ p2perc
        viewString += '%</span> ' +
            '</div>'
    } else if(!isP2){
        viewString += '<a role="button" class="btn--rose btn game__join-btn">Join</a>'
    }
    viewString += '</div>'+
        '</div>'+
        '</div>'+
        '<div class="game__weapons">'+
        '<div class="game__weapons-col">'+
        '<div class="game__weapon1">'
    if(p1["site"] == 0) {
        p1items.forEach(([key, val]) => {
            var completeName = val["hashname"];
            var condition = "";
            var skinName = "";
            var stattrak = false;
            if(completeName.includes("StatTrak")) {
                stattrak = true;
            }
            if(stattrak == true) {
                skinName = completeName.split("™ ")[1].split("(")[0]
            }
            if(completeName.includes("(")) {
                condition = completeName.split("(")[1].split(")")[0]
                if(stattrak == false) {
                    skinName = completeName.split("(")[0]
                }
            } else {
                skinName = completeName
            }
            viewString +=
                '<div class="weapons__item">'+
                '<div class="weapons__photo"> <img src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+val["iconurl"]+'/75fx60f" alt="Gun"> </div>'+
                '<div class="weapons__desc">'+
                '<p class="weapons__desc-title">'
            if(stattrak == true) {
                viewString += '<span style="color: orange;">StatTrak™</span>'
            }
            viewString += '<span>'+skinName+'</span> <span class="weapons__desc-factory">'+condition+'</span> </p>'+
                '</div>'+
                '<div class="weapons__price"><span>'+parseFloat(val["val"]).toFixed(2)+'</span></div>'+
                '</div>'
        });
    } else if(p2perc !== 10000) {
        p2items.forEach(([key, val]) => {
            var completeName = val["hashname"];
            var condition = "";
            var skinName = "";
            var stattrak = false;
            if(completeName.includes("StatTrak")) {
                stattrak = true;
            }
            if(stattrak == true) {
                skinName = completeName.split("™ ")[1].split("(")[0]
            }
            if(completeName.includes("(")) {
                condition = completeName.split("(")[1].split(")")[0]
                if(stattrak == false) {
                    skinName = completeName.split("(")[0]
                }
            } else {
                skinName = completeName
            }
            viewString +=
                '<div class="weapons__item">'+
                '<div class="weapons__photo"> <img src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+val["iconurl"]+'/75fx60f" alt="Gun"> </div>'+
                '<div class="weapons__desc">'+
                '<p class="weapons__desc-title">'
            if(stattrak == true) {
                viewString += '<span style="color: orange;">StatTrak™</span>'
            }
            viewString += '<span>'+skinName+'</span> <span class="weapons__desc-factory">'+condition+'</span> </p>'+
                '</div>'+
                '<div class="weapons__price"><span>'+parseFloat(val["val"]).toFixed(2)+'</span></div>'+
                '</div>'
        });
    }
    viewString += '</div>'+
        '</div>'+
        '<div class="game__weapons-col">'+
        '<div class="game__weapon2">'
    if(p1["site"] == 1) {
        p1items.forEach(([key, val]) => {
            var completeName = val["hashname"];
            var condition = "";
            var skinName = "";
            var stattrak = false;
            if(completeName.includes("StatTrak")) {
                stattrak = true;
            }
            if(stattrak == true) {
                skinName = completeName.split("™ ")[1].split("(")[0]
            }
            if(completeName.includes("(")) {
                condition = completeName.split("(")[1].split(")")[0]
                if(stattrak == false) {
                    skinName = completeName.split("(")[0]
                }
            } else {
                skinName = completeName
            }
            viewString +=
                '<div class="weapons__item">'+
                '<div class="weapons__photo"> <img src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+val["iconurl"]+'/75fx60f" alt="Gun"> </div>'+
                '<div class="weapons__desc">'+
                '<p class="weapons__desc-title">'
            if(stattrak == true) {
                viewString += '<span style="color: orange;">StatTrak™</span>'
            }
            viewString += '<span>'+skinName+'</span> <span class="weapons__desc-factory">'+condition+'</span> </p>'+
                '</div>'+
                '<div class="weapons__price"><span>'+parseFloat(val["val"]).toFixed(2)+'</span></div>'+
                '</div>'
        });
    } else if(p2perc !== 10000) {
        p2items.forEach(([key, val]) => {
            var completeName = val["hashname"];
            var condition = "";
            var skinName = "";
            var stattrak = false;
            if(completeName.includes("StatTrak")) {
                stattrak = true;
            }
            if(stattrak == true) {
                skinName = completeName.split("™ ")[1].split("(")[0]
            }
            if(completeName.includes("(")) {
                condition = completeName.split("(")[1].split(")")[0]
                if(stattrak == false) {
                    skinName = completeName.split("(")[0]
                }
            } else {
                skinName = completeName
            }
            viewString +=
                '<div class="weapons__item">'+
                '<div class="weapons__photo"> <img src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+val["iconurl"]+'/75fx60f" alt="Gun"> </div>'+
                '<div class="weapons__desc">'+
                '<p class="weapons__desc-title">'
            if(stattrak == true) {
                viewString += '<span style="color: orange;">StatTrak™</span>'
            }
            viewString += '<span>'+skinName+'</span> <span class="weapons__desc-factory">'+condition+'</span> </p>'+
                '</div>'+
                '<div class="weapons__price"><span>'+parseFloat(val["val"]).toFixed(2)+'</span></div>'+
                '</div>'
        });
    }
    viewString += '</div>'+
        '</div>'
    var expireDate = new Date(Date.now()+((30*60*1000)-(Date.now() - p1["createdDate"])));
    var datetext = expireDate.toTimeString().split(' ')[0] + '   ' +expireDate.toTimeString().split(' ')[1];
    viewString += '</div></div><span class="expire__date">Expires: '+datetext+'</span>'

    $("#modal-view").html(viewString)
    if(normalTimer == true) {
        startViewTimer()
    } else if(finalTimer == true) {
        startFinalViewTimer(coinflipId)
    }

    if(flipable) {
        spinDaCoin(coinflipId,winningSite)
    }

}

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 END VIEW POPUP BUILD
 */



/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 START POPUP HANDLER
 */
$(document).on("click",".btn--rose",function() {

    var coinflipId = parseInt($(this).closest("[data-cf-id]").attr("data-cf-id"));
    if(isNaN(coinflipId)) {
        coinflipId = parseInt($("[data-coinflip-view-id]").attr("data-coinflip-view-id"))
    }
    $("[data-join-coinflip-id]").attr("data-join-coinflip-id",coinflipId);

    var value = parseFloat($(this).closest("[data-cf-id]").attr("data-cf-val"))
    if(isNaN(value)) {
        value = parseFloat($("[data-cf-id='"+$("[data-coinflip-view-id]").attr("data-coinflip-view-id")+"']").attr("data-cf-val"))
    }
    fillJoinValues(value);

    $.magnificPopup.open({
        items: {
            src: $('#modal-join-game')
        },
        removalDelay: 500,
        type: 'inline',
        mainClass: 'mfp-fade',
        midClick: true
    });
});

$(document).on("click",".btn--purple",function() {
    var coinflipId = parseInt($(this).closest("[data-cf-id]").attr("data-cf-id"))
    buildViewPopup(coinflipId);

    $.magnificPopup.open({
        items: {
            src: $('#modal-view')
        },
        removalDelay: 500,
        type: 'inline',
        mainClass: 'mfp-fade',
        midClick: true
    });
});

$(document).on("click","#createCoinflip",function() {
    $.magnificPopup.open({
        items: {
            src: $('#modal-create')
        },
        removalDelay: 500,
        type: 'inline',
        mainClass: 'mfp-fade',
        midClick: true
    });
});


$.magnificPopup.instance.close = function () {
    clearSelection();
    $.magnificPopup.proto.close.call(this);
};

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 END POPUP HANDLER
 */



/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 START TIMER NORMAL
 */

function startTimer(coinflipID) {
    var timerText = $("[data-cf-id='"+coinflipID+"']").find(".chart__cont");
    var timerOffset = $("[data-cf-id='"+coinflipID+"']").find(".chart__bar");
    var interval = setInterval(function () {
        var leftTime = timerText.attr("data-pct");
        if(leftTime == 0) {
            clearInterval(interval)
        } else {
            timerText.attr("data-pct",leftTime - 1)
            var unit = 113.096 / 100;
            var offset = (100 - leftTime) * unit;
            timerOffset.css("stroke-dashoffset", offset)
        }
    },1000)
}

var globalViewTimerInterval;

function startViewTimer() {
    var timerText = $("#modal-view").find(".chart__cont");
    var timerOffset = $("#modal-view").find(".chart__bar");
    clearInterval(globalViewTimerInterval)
    globalViewTimerInterval = setInterval(function () {
        var leftTime = timerText.attr("data-pct");
        if(leftTime == 0) {
            clearInterval(globalViewTimerInterval)
        } else {
            timerText.attr("data-pct",leftTime - 1)
            var unit = 408.407 / 100;
            var offset = (100 - leftTime) * unit;
            timerOffset.css("stroke-dashoffset", offset)
        }
    },1000)
}

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 END TIMER NORMAL
 */

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 START TIMER FINAL
 */

function startFinalTimer(coinflipID,winner) {
    var timerText = $("[data-cf-id='"+coinflipID+"']").find(".chart__cont");
    var timerOffset = $("[data-cf-id='"+coinflipID+"']").find(".chart__bar");
    var interval = setInterval(function () {
        var leftTime = timerText.attr("data-final-placeholder");
        if(leftTime <= 0) {
            clearInterval(interval)
            $("[data-cf-id='" + coinflipID + "']").find(".ceil__chart").html(". . .");
            setTimeout(function () {
                $("[data-cf-id='" + coinflipID + "']").find(".ceil__chart").html(winner)
            },3000)
        } else {
            timerText.attr("data-final-placeholder",leftTime - 0.01)
            timerText.attr("data-pct",(leftTime - 0.01).toFixed(1))
            var unit = 113.096 / 1000;
            var offset = ((10 - leftTime)*100) * unit;
            timerOffset.css("stroke-dashoffset", offset)
        }
    },10)
}

var globalFinalTimerInterval;

function startFinalViewTimer(coinflipId) {
    var timerText = $("#modal-view").find(".chart__cont");
    var timerOffset = $("#modal-view").find(".chart__bar");
    clearInterval(globalFinalTimerInterval)
    globalFinalTimerInterval = setInterval(function () {
        var leftTime = timerText.attr("data-final-placeholder");
        if(leftTime <= 0) {
            clearInterval(globalFinalTimerInterval)
            buildViewPopup(coinflipId);
        } else {
            timerText.attr("data-final-placeholder",leftTime - 0.01)
            timerText.attr("data-pct",(leftTime - 0.01).toFixed(1))
            var unit = 408.407 / 1000;
            var offset = ((10 - leftTime)*100) * unit;
            timerOffset.css("stroke-dashoffset", offset)
        }
    },10)
}

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 END TIMER FINAL
 */

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 START INVENTORY MANAGEMENT
 */

$(document).on("click",".create__btn--grey",function() {
    clientSocket.emit("loadInventory");
});

$(document).on("click","#reloadBotItems",function() {
    $("#selectedBotItems").empty()
    clientSocket.emit("loadBotShopInventory");
});

$(document).on("click","#reloadBotItemsPlayer",function() {
    $("#selectedPlayerItems").empty()
    clientSocket.emit("loadInventory");
});

$(document).on("click","#createBotCoinflip",function() {

    let playerValue = parseFloat($("[data-player-value]").attr("data-player-value"));
    let playerAmount = parseInt($("[data-player-amount]").attr("data-player-amount"));
    let botValue = parseFloat($("[data-bot-value]").attr("data-bot-value"));
    let botAmount = parseInt($("[data-bot-amount]").attr("data-bot-amount"));

    //BASIC CHECKS
    if(playerValue >= 2 && playerValue <= 100 && playerAmount > 0) {
        //CHECK IF PLAYER VALUE FITS WITH BOT VALUE
        if(playerValue >= botValue && playerValue <= (botValue / 100) * 105 ) {

            let botAssets = [];
            let playerAssets = [];
            $("[data-botcf-item-selected='true']").each(function (ind,val) {
                let type = $(this).attr("data-holder")
                if(type == "bot") {
                    botAssets.push($(this).attr("data-assetid"))
                } else if(type == "player") {
                    playerAssets.push($(this).attr("data-assetid"))
                }
            })

            clientSocket.emit("createBotCoinflip",botAssets,playerAssets)

        } else {
            alert("Your value is lower then the bot's value or is higher then 5% over the bot's value.")
        }
    } else {
        alert("Please read the rules and then try again!")
    }

});

clientSocket.on("createdBotCoinflip",function (offerid,offerhash) {
    alert("got offer with id = "+offerid+" with da secret hash of = "+offerhash)
})

$(document).on("click","[data-holder='bot']",function() {
    if($(this).attr("data-botcf-item-selected") == "false") {
        var marker = true;
        var placeholder = $(this)
        var value = parseFloat($(this).attr("data-value"))

        $("#botItemsAmount").html(parseInt($("#botItemsAmount").html())+1)
        $("#botItemsAmount").attr("data-bot-amount",parseInt($("#botItemsAmount").attr("data-bot-amount"))+1)
        $("#botItemsValue").html((parseFloat($("#botItemsValue").html())+value).toFixed(2))
        $("#botItemsValue").attr("data-bot-value",(parseFloat($("#botItemsValue").attr("data-bot-value"))+value).toFixed(2))




        if( $("[data-holder='bot'][data-botcf-item-selected='true']").length) {
            $("[data-holder='bot'][data-botcf-item-selected='true']").each(function (ind, val) {
                console.log($(this).attr("data-value"))
                console.log(value)
                if (parseFloat($(this).attr("data-value")) < value && marker == true) {
                    console.log("in insert before")
                    $(placeholder).insertBefore($(this));
                    marker = false
                } else if (ind == $("[data-holder='bot'][data-botcf-item-selected='true']").length - 1 && marker == true) {
                    $(placeholder).insertAfter($(this));
                    marker = false
                }
            })
        } else {
            $("#selectedBotItems").append($(this))
        }

        $(this).attr("data-botcf-item-selected","true")

    } else {

        var marker = true;
        var placeholder = $(this)
        var value = parseFloat($(this).attr("data-value"))

        $("#botItemsAmount").html(parseInt($("#botItemsAmount").html())-1)
        $("#botItemsValue").html((parseFloat($("#botItemsValue").html())-value).toFixed(2))
        $("#botItemsAmount").attr("data-bot-amount",parseInt($("#botItemsAmount").attr("data-bot-amount"))-1)
        $("#botItemsValue").attr("data-bot-value",(parseFloat($("#botItemsValue").attr("data-bot-value"))-value).toFixed(2))


        if( $("[data-holder='bot'][data-botcf-item-selected='false']").length) {
            $("[data-holder='bot'][data-botcf-item-selected='false']").each(function (ind, val) {
                console.log($(this).attr("data-value"))
                console.log(value)
                if (parseFloat($(this).attr("data-value")) < value && marker == true) {
                    console.log("in insert before")
                    $(placeholder).insertBefore($(this));
                    marker = false
                } else if (ind == $("[data-holder='bot'][data-botcf-item-selected='false']").length - 1 && marker == true) {
                    $(placeholder).insertAfter($(this));
                    marker = false
                }
            })
        } else {
            $("#botItems").append($(this))
        }

        $(this).attr("data-botcf-item-selected","false")

    }
});

$(document).on("click","[data-holder='player']",function() {
    if($(this).attr("data-botcf-item-selected") == "false") {
        var marker = true;
        var placeholder = $(this)
        var value = parseFloat($(this).attr("data-value"))

        $("#botItemsAmountPlayer").html(parseInt($("#botItemsAmountPlayer").html())+1)
        $("#botItemsValuePlayer").html((parseFloat($("#botItemsValuePlayer").html())+value).toFixed(2))
        $("#botItemsAmountPlayer").attr("data-player-amount",parseInt($("#botItemsAmountPlayer").attr("data-player-amount"))+1)
        $("#botItemsValuePlayer").attr("data-player-value",(parseFloat($("#botItemsValuePlayer").attr("data-player-value"))+value).toFixed(2))


        if( $("[data-holder='player'][data-botcf-item-selected='true']").length) {
            $("[data-holder='player'][data-botcf-item-selected='true']").each(function (ind, val) {
                console.log($(this).attr("data-value"))
                console.log(value)
                if (parseFloat($(this).attr("data-value")) < value && marker == true) {
                    console.log("in insert before")
                    $(placeholder).insertBefore($(this));
                    marker = false
                } else if (ind == $("[data-holder='player'][data-botcf-item-selected='true']").length - 1 && marker == true) {
                    $(placeholder).insertAfter($(this));
                    marker = false
                }
            })
        } else {
            $("#selectedPlayerItems").append($(this))
        }

        $(this).attr("data-botcf-item-selected","true")

    } else {

        var marker = true;
        var placeholder = $(this)
        var value = parseFloat($(this).attr("data-value"))

        $("#botItemsAmountPlayer").html(parseInt($("#botItemsAmountPlayer").html())-1)
        $("#botItemsValuePlayer").html((parseFloat($("#botItemsValuePlayer").html())-value).toFixed(2))
        $("#botItemsAmountPlayer").attr("data-player-amount",parseInt($("#botItemsAmountPlayer").attr("data-player-amount"))-1)
        $("#botItemsValuePlayer").attr("data-player-value",(parseFloat($("#botItemsValuePlayer").attr("data-player-value"))-value).toFixed(2))

        if( $("[data-holder='player'][data-botcf-item-selected='false']").length) {
            $("[data-holder='player'][data-botcf-item-selected='false']").each(function (ind, val) {
                console.log($(this).attr("data-value"))
                console.log(value)
                if (parseFloat($(this).attr("data-value")) < value && marker == true) {
                    console.log("in insert before")
                    $(placeholder).insertBefore($(this));
                    marker = false
                } else if (ind == $("[data-holder='player'][data-botcf-item-selected='false']").length - 1 && marker == true) {
                    $(placeholder).insertAfter($(this));
                    marker = false
                }
            })
        } else {
            $("#playerItems").append($(this))
        }

        $(this).attr("data-botcf-item-selected","false")

    }
});

clientSocket.on("botInventoryLoaded",function (botInv) {

    if(botInv.length > 0) {

        var shopInventory = botInv

        shopInventory = Object.entries(shopInventory).sort(function (a, b) {
            return b[1][3] - a[1][3];
        });

        var shopString = "";

        /*shopInventory.forEach(function (val, ind) {
            val = val[1]
            shopString += "<div class='botCoinflipItem' data-holder='bot' data-value='" + val[3].toFixed(2) + "' data-botcf-item-selected='false' data-assetid='" + val[2] + "'>" +
                '<img title="' + val[0] + "  " + val[3].toFixed(2) + '" src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/' + val[1] + '/100fx80f" alt="Weapon">' +
                "</div>"
        })*/

        $("#botItems").html(shopString)
    }

})

clientSocket.on("inventoryLoaded",function (data) {
    if(Array.isArray(data)) {
        var itemString = "";
        var botCoinflipPlayerString = ""

        data = data.sort(function(a, b){
            return b[3] - a[3] ;
        });

        data.forEach(function(val,ind) {

            //START BOT COINFLIP PART

            botCoinflipPlayerString += "<div class='botCoinflipItem' data-holder='player' data-value='"+val[3].toFixed(2)+"' data-botcf-item-selected='false' data-assetid='"+val[2]+"'>" +
                    '<img title="'+val[0]+"  "+val[3].toFixed(2)+'" src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+val[1]+'/100fx80f" alt="Weapon">'+
                    "</div>"

            //END BOT COINFLIP PART

            var completeName = val[0];
            var condition = "";
            var itemName = "";
            var skinName = "";
            var stattrak = false;

            if(completeName.includes("StatTrak")) {
                stattrak = true;
            }

            if(completeName.includes("Factory New")) {
                condition = "FN";
            } else if (completeName.includes("Minimal Wear")) {
                condition = "MW";
            } else if (completeName.includes("Field-Tested")) {
                condition = "FT";
            } else if (completeName.includes("Well-Worn")) {
                condition = "WW";
            } else if (completeName.includes("Battle-Scarred")) {
                condition = "BS";
            }

            if(stattrak == true) {
                itemName = completeName.split("™ ")[1].split(" |")[0]
            } else {
                itemName = completeName.split(" |")[0]
            }

            if(completeName.includes("(")) {
                skinName = completeName.split("| ")[1].split(" (")[0]
            }

            itemString +=
                '<div class="grid__item" data-item-selected = "false" data-asset='+val[2]+' data-item-value="'+val[3].toFixed(2)+'"> ' +
                '<span class="item__sign-ww">'+condition+'</span>'+
                '<span class="item__icon-act">'+
                '<svg class="icon icon-check"><use xlink:href="img/sprite.svg#icon-check"></use></svg>'+
                '</span>'+
                '<div class="item__pic">' +
                '<img src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+data[ind][1]+'/147fx108f" alt="Thing">' +
                '</div>'+
                '<p class="item__desc">' +
                '<span style="color: orange">'+((stattrak) ? "StatTrak™" : "")+'</span> ' +
                '<span>'+itemName+'</span> ' +
                '<span>'+skinName+'</span>' +
                '</p>'+
                '<div class="item__price"> ' +
                '<svg class="icon icon-amount"><use xlink:href="img/sprite.svg#icon-amount"></use></svg> ' +
                '<span>'+data[ind][3].toFixed(2)+'</span>' +
                '</div>'+
                '</div>'
        })

        for (var i = 0; i < (5 - (data.length % 5)); i++) {
            itemString +=
                '<div class="grid__item" style="visibility: hidden"> ' +
                '<span class="item__sign-ww">'+"//"+'</span>'+
                '<div class="item__pic">' +
                '<img src="img/create__pic4.png" alt="Thing">' +
                '</div>'+
                '<p class="item__desc">' +
                '<span>Placeholder</span> ' +
                '<span>Placeholder</span> ' +
                '<span>Placeholder</span>' +
                '</p>'+
                '<div class="item__price"> ' +
                '<svg class="icon icon-amount"><use xlink:href="img/sprite.svg#icon-amount"></use></svg> ' +
                '<span>'+(0).toFixed(2)+'</span>' +
                '</div>'+
                '</div>'
        }

        $(".create__grid").html(itemString);
        $("#playerItems").html(botCoinflipPlayerString)

    } else {

        if($(".create__info").length) {
            $(".create__info").remove();
        }
        $("<span class='create__info'>"+ data + "</span>").insertBefore($(".grid__item")[0])
        $("#playerItems").append("<span class='create__info'>"+ data + "</span>")

    }
})

$(document).on('click', '[data-coin-selected="false"]',function (e) {
    $('[data-coin-selected="true"]').attr("data-coin-selected","false")
    $(this).attr("data-coin-selected","true");
})

$(document).on('click', '[data-item-selected]',function (e) {
    if($(this).attr("data-item-selected") == "false") {
        if(parseInt($("[data-create-selected]").attr("data-create-selected")) < 15) {
            $(this).attr("data-item-selected", "true")

            //UPDATE VALUE WHEN SELECTED
            var itemValue = parseFloat($(this).attr("data-item-value"))
            var totalValue = parseFloat($("[data-create-value]").attr("data-create-value"))
            var newValue = (totalValue + itemValue).toFixed(2);
            $("[data-create-value]").attr("data-create-value", newValue)
            $("[data-create-value]").html(newValue);

            //UPDATE SELECTED AMOUNT OF ITEMS WHEN SELECTED
            var selectedItems = parseInt($("[data-create-selected]").attr("data-create-selected"))
            var newAmount = (selectedItems + 1);
            $("[data-create-selected]").attr("data-create-selected", newAmount)
            $("[data-create-selected]").html(newAmount);

            if ((newAmount > 0 && newAmount < 16) && newValue >= 0.5) {
                $("#finalizeCreate").css("opacity", "1")
                $("#finalizeCreate").css("cursor", "pointer")
                $("#finalizeCreate").css("pointer-events", "auto")
            } else {
                $("#finalizeCreate").css("opacity", "0.2")
                $("#finalizeCreate").css("cursor", "default")
                $("#finalizeCreate").css("pointer-events", "none")
            }

            var lowEndTrashhold = parseFloat($("#neededFrom").attr("data-needed-from"));
            var highEndTrashold = parseFloat($("#neededTo").attr("data-needed-to"));
            var correctionValue;
            var correctionText;
            if(newValue < lowEndTrashhold) {
                correctionValue = lowEndTrashhold - newValue;
                correctionText = '<span style="color: darkred">-'+correctionValue.toFixed(2)+'</span>'
            } else if(newValue > highEndTrashold) {
                correctionValue = newValue - highEndTrashold;
                correctionText = '<span style="color: darkred">+'+correctionValue.toFixed(2)+'</span>'
            } else {
                correctionValue = 0.00;
                correctionText = '<span style="color: darkgreen">'+(0.00).toFixed(2)+'</span>'
            }
            $("#joinCorrectionValue").html(correctionText);
            $("#joinCorrectionValue").attr("data-join-correction-value",correctionValue);

            if ((newAmount > 0 && newAmount < 16) && newValue >= lowEndTrashhold && newValue <= highEndTrashold) {
                $("#finalizeJoin").css("opacity", "1")
                $("#finalizeJoin").css("cursor", "pointer")
                $("#finalizeJoin").css("pointer-events", "auto")
            } else {
                $("#finalizeJoin").css("opacity", "0.2")
                $("#finalizeJoin").css("cursor", "default")
                $("#finalizeJoin").css("pointer-events", "none")
            }

        }
    } else {
        $(this).attr("data-item-selected","false")

        //UPDATE VALUE WHEN SELECTED
        var itemValue = parseFloat($(this).attr("data-item-value"))
        var totalValue = parseFloat($("[data-create-value]").attr("data-create-value"))
        var newValue = (totalValue - itemValue).toFixed(2);
        $("[data-create-value]").attr("data-create-value",newValue)
        $("[data-create-value]").html(newValue);

        //UPDATE SELECTED AMOUNT OF ITEMS WHEN SELECTED
        var selectedItems = parseInt($("[data-create-selected]").attr("data-create-selected"))
        var newAmount = (selectedItems - 1);
        $("[data-create-selected]").attr("data-create-selected",newAmount)
        $("[data-create-selected]").html(newAmount);

        if((newAmount > 0 && newAmount < 16) && newValue >= 0.5) {
            $("#finalizeCreate").css("opacity","1")
            $("#finalizeCreate").css("cursor","pointer")
            $("#finalizeCreate").css("pointer-events","auto")
        } else {
            $("#finalizeCreate").css("opacity","0.2")
            $("#finalizeCreate").css("cursor","default")
            $("#finalizeCreate").css("pointer-events","none")
        }

        var lowEndTrashhold = parseFloat($("#neededFrom").attr("data-needed-from"));
        var highEndTrashold = parseFloat($("#neededTo").attr("data-needed-to"));
        var correctionValue;
        var correctionText;
        if(newValue < lowEndTrashhold) {
            correctionValue = lowEndTrashhold - newValue;
            correctionText = '<span style="color: darkred">-'+correctionValue.toFixed(2)+'</span>'
        } else if(newValue > highEndTrashold) {
            correctionValue = newValue - highEndTrashold;
            correctionText = '<span style="color: darkred">+'+correctionValue.toFixed(2)+'</span>'
        } else {
            correctionValue = 0.00;
            correctionText = '<span style="color: darkgreen">'+(0.00).toFixed(2)+'</span>'
        }
        $("#joinCorrectionValue").html(correctionText);
        $("#joinCorrectionValue").attr("data-join-correction-value",correctionValue);

        if ((newAmount > 0 && newAmount < 16) && newValue >= lowEndTrashhold && newValue <= highEndTrashold) {
            $("#finalizeJoin").css("opacity", "1")
            $("#finalizeJoin").css("cursor", "pointer")
            $("#finalizeJoin").css("pointer-events", "auto")
        } else {
            $("#finalizeJoin").css("opacity", "0.2")
            $("#finalizeJoin").css("cursor", "default")
            $("#finalizeJoin").css("pointer-events", "none")
        }

    }
})

function fillJoinValues(value) {
    var lowEndTrashhold = ((value / 100) * 90).toFixed(2);
    var highEndTrashhold = ((value / 100) * 110).toFixed(2);
    $("#neededFrom").html(lowEndTrashhold)
    $("#neededFrom").attr("data-needed-from",lowEndTrashhold)
    $("#neededTo").html(highEndTrashhold)
    $("#neededTo").attr("data-needed-to",highEndTrashhold)
}

$(document).on('click', '#finalizeCreate',function (e) {
    var selectedAmount = parseInt($("[data-create-selected]").attr("data-create-selected"))
    var selectedValue = parseFloat($("[data-create-value]").attr("data-create-value"))
    if((selectedAmount > 0 && selectedAmount < 16) && selectedValue >= 0.5) {
        var requestPackage = [];
        requestPackage["assets"] = [];
        $("[data-item-selected='true']").each(function (ind,val) {
            requestPackage["assets"].push($(this).attr("data-asset"))
            if (ind == $("[data-item-selected='true']").length - 1) {

                var chosenSite = parseInt($("[data-coin-selected='true']").attr("data-coin-site"))
                var player1secret = $(".user__secret").attr("data-user-secret")
                initiateLoading()
                clientSocket.emit("createRequest",requestPackage["assets"],chosenSite,player1secret);
            }
        })
    }
})

$(document).on('click', '#finalizeJoin',function (e) {
    var selectedAmount = parseInt($("[data-create-selected]").attr("data-create-selected"))
    var selectedValue = parseFloat($("[data-create-value]").attr("data-create-value"))
    var lowEndTrashhold = parseFloat($("#neededFrom").attr("data-needed-from"));
    var highEndTrashold = parseFloat($("#neededTo").attr("data-needed-to"));
    var coinflipId = parseInt($("[data-join-coinflip-id]").attr("data-join-coinflip-id"));

    if ((selectedAmount > 0 && selectedAmount < 16) && selectedValue >= lowEndTrashhold && selectedValue <= highEndTrashold) {
        var requestPackage = [];
        requestPackage["assets"] = [];
        $("[data-item-selected='true']").each(function (ind,val) {
            requestPackage["assets"].push($(this).attr("data-asset"))
            if (ind == $("[data-item-selected='true']").length - 1) {
                var player2secret = $(".user__secret").attr("data-user-secret")
                initiateLoading()
                clientSocket.emit("joinRequest",requestPackage["assets"],player2secret,coinflipId);
            }
        })
    }
})


clientSocket.on("finishedCreateRequest",function (offerID,secretHash) {

    if(secretHash !== null) {
        editLoading("<span>Please accept your tradeoffer <a target='_blank' href='https://steamcommunity.com/tradeoffer/"+offerID+"/'>here</a>.</span><br>" +
            "<span>Secret : "+secretHash+"</span>")
    } else {
        editLoading(offerID)

    }

});

clientSocket.on("finishedJoinRequest",function (offerID,secretHash) {

    if(secretHash !== null) {
        editLoading("<span>Please accept your tradeoffer <a target='_blank' href='https://steamcommunity.com/tradeoffer/"+offerID+"/'>here</a>.</span><br>" +
            "<span>Secret : "+secretHash+"</span>")
    } else {
        editLoading(offerID)

    }

});

$(document).on('click', '.loading__close',function (e) {
    clearLoading()
})

function clearLoading() {
    $('.mfp-close').click();
    $(".loading__popup").remove();
    clearSelection();
}

function clearSelection() {
    $("[data-item-selected='true']").each(function (ind,val) {
        $(this).attr("data-item-selected","false")
    })

    $("[data-create-selected]").attr("data-create-selected","0")
    $("[data-create-selected]").html("0")
    $("[data-create-value]").attr("data-create-value","0.00")
    $("[data-create-value]").html("0.00")
    $("[data-join-correction-value]").attr("data-join-correction-value","0.00")
    $("[data-join-correction-value]").html("0.00")

    $("#finalizeJoin").css("opacity", "0.2")
    $("#finalizeJoin").css("cursor", "default")
    $("#finalizeJoin").css("pointer-events", "none")
    $("#finalizeCreate").css("opacity", "0.2")
    $("#finalizeCreate").css("cursor", "default")
    $("#finalizeCreate").css("pointer-events", "none")
}

function editLoading(text) {
    $("#loading__animation").remove();
    $(".loading__popup").append("<span class='loading__text'>"+text+"</span><div class='loading__close'><span class='loading__close__text'>Close</span></div>")
}

function initiateLoading() {

    $("<div class='loading__popup'></div>").insertBefore($(".modal__title"))

    var loadingString = '<div id="loading__animation"><svg xmlns="http://www.w3.org/2000/svg" version="1.1">'+
        '<defs>'+
        '<filter id="gooey">'+
        '<feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur"></feGaussianBlur>'+
        '<feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo"></feColorMatrix>'+
        '<feBlend in="SourceGraphic" in2="goo"></feBlend>'+
        '</filter>'+
        '</defs>'+
        '</svg>'+
        '<div class="blob blob-0"></div>'+
        '<div class="blob blob-1"></div>'+
        '<div class="blob blob-2"></div>'+
        '<div class="blob blob-3"></div>'+
        '<div class="blob blob-4"></div>'+
        '<div class="blob blob-5"></div></div>';

    $(".loading__popup").append(loadingString)
}


/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 END INVENTORY MANAGEMENT
 */


/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 START SECRET GENERATION
 */

$(document).on('click', '.generate__secret',function (e) {
    generateNewSecret()
})

function generateNewSecret() {

    function dec2hex (dec) {
        return ('0' + dec.toString(16)).substr(-2)
    }

    function generateId (len) {
        var arr = new Uint8Array((len || 40) / 2)
        window.crypto.getRandomValues(arr)
        return Array.from(arr, dec2hex).join('')
    }

    var newHash = generateId(20);

    $(".user__secret").html(newHash);
    $(".user__secret").attr("data-user-secret",newHash)

}

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 END SECRET GENERATION
 */


/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 START CHAT
 */

clientSocket.on("newBannedMessage",function () {
    var clientsMessageString = '' +
        '<div class="chat__item">'+
        '<div class="chat__photo"><img style="border-radius: 100%" src="../img/system__warning.png"></div>'+
        '<div class="chat__message">'+
        '<h5 style="color: red" class="message__author">System</h5>'+
        '<p class="message__text">Unfortunately your banned from using our chat. If you think this was a mistake, please head over to the "Support" page.</p>'+
        '</div>'+
        '</div>'
    $(".chat__feed").append(clientsMessageString);
    warningCD = true;
})

/* $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
 END CHAT
 */




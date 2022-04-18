$(document).ready(function(){
    // WebSocket
    socketerino = io.connect();
    socketerino.on('setTradeurl', function () {
        console.log("setTradeurl");
        $(".popup-modal").click();

    });



    // CHAT START HERE **********************************************************************************

    $(document).on('click', '#sendChatMessage',function () {

        //TODO CHECK IF CHAT MESSAGE IS VALID

        socketerino.emit("newChatMessage",$("#chatMessageText").val());

    })

    socketerino.on("newChatMessage",function (chatMessage) {
        $("#chatWindow").append(chatMessage);
    })

    // CHAT END HERE **********************************************************************************


    // TIMER START HERE *******************************************************************************

    socketerino.on("startTimerForCoinflip",function (coinflipId) {
        countdown($('.coinflipTimer[data-timerid='+coinflipId+']'));
    })

    //TODO TIMER IS NOCH SEHR STRANGE

    function countdown (html_element) {
        var html = html_element;
        //var time = html.html();
        html.html((Math.round( (parseFloat(html.html())-0.1) * 10) / 10).toFixed(1));
        //number.firstChild.nodeValue = time;
        if (html.html() > 0) {
            var ani = setTimeout( countdown, 100,html);
        } else {
            html.parent().find(".secondPlayerTempHolder").remove()
            //TODO ADD BACK JOIN BUTTON AND SET TIMER TO 100 IF DUNSO
        }
    }
    // TIMER END HERE *******************************************************************************




    socketerino.on("newUserJoinAttemptUpdate",function (htmlString,coinflipId) {
        countdown($('.coinflipTimer[data-timerid='+coinflipId+']'));
        $('.coinflipTimer[data-timerid='+coinflipId+']').parent().find(".joinCoinflipButton").remove();
        $('.coinflipContainer[asset-cid='+coinflipId+']').append(htmlString);
    })

    $(document).on('click', '#giveroItemeroBackero',function () {
        socketerino.emit('giveItemsBack');
    })

    socketerino.on('testy', function (data) {
        $.magnificPopup.close()
        $(".completeCoinflipContainer").append(data);
    });

    $(function () {
        $('.popup-modal').magnificPopup({
            type: 'inline',
            preloader: false,
            focus: '#tradeurl_popup',
            modal: true
        });
        $(document).on('click', '.popup-modal-dismiss', function (e) {
            console.log("in dismissero thingy")
            if($("#tradeurl_popup").val().length && $("#tradeurl_popup").val().length == 75) {
                console.log("klappero")
                socketerino.emit("setTradeurl",$("#tradeurl_popup").val());
                e.preventDefault();
                $.magnificPopup.close();
            } else {
                console.log("failero")
                $('.set_tradeurl_infotext').append("<br><span style='color:red'>Tradeurl nicht valide</span>");
            }
        });
    });

    $(function () {
        $('.popup-modal').magnificPopup({
            type: 'inline',
            preloader: false,
        });
        $(document).on('click', '.popup-modal-dismiss', function (e) {
                e.preventDefault();
                $.magnificPopup.close();
        });
    });

    $(document).on('click', '#createCoinflipButton',function () {
        socketerino.emit('loadCoinflipWindow');
    })

    $(document).on('click', '.joinCoinflipButton',function () {
        $(".coinFlipJoinItemsContainer").attr("asset-cid",$(this).parent().attr("asset-cid"));
        socketerino.emit('loadJoinItems',$(this).parent().attr("asset-cid"));
    })

    socketerino.on('coinflipItemContent',function (data) {
        console.log(data);
        var html_string = "";
        data = data.sort(function(a,b) {
            return  b[3] - a[3];
        });
        data.forEach(function (currentValue,index) {
            html_string += "<div class='wrapper'><img title='"+currentValue[0]+"' data-selected='false' data-assetid='"+currentValue[2]+"' class='coinFlipItemsContainerItemImage' src='https://steamcommunity-a.akamaihd.net/economy/image/class/578080/"+currentValue[1]+"/70fx50f'><div class='description'>"+currentValue[3]/100+"$"+"</div></div>"
        });
        html_string += "<input type='radio' value='0' class='coinflipRadio' checked='checked' id='ct' name='selector'><label for='ct'>CT</label>";
        html_string += "<input type='radio' value='1' class='coinflipRadio' id='t' name='selector'><label for='t'>T</label>";
        html_string += "<a id='startCoinflipButton'>Start Coinflip</a>";
        $(".coinFlipItemsContainer").html(html_string);
    })

    socketerino.on('joinCoinflipWindowData',function (data) {
        var html_string = "";
        var dataz = data[0].sort(function(a,b) {
            return  b[3] - a[3];
        });
        dataz.forEach(function (currentValue,index) {
            html_string += "<div class='wrapper'><img title='"+currentValue[0]+"' data-selected='false' data-assetid='"+currentValue[2]+"' class='coinFlipJoinItemsContainerItemImage' src='https://steamcommunity-a.akamaihd.net/economy/image/class/578080/"+currentValue[1]+"/70fx50f'><div class='description'>"+currentValue[3]/100+"$"+"</div></div>"
        });
        html_string += "<a id='joinCoinflipFinalizeButton'>Join</a>";
        html_string += "Du brauscht vei scho so veil <span stlye='color:red' id='coinflipJoinNeededValue'>"+data[1]+"</span>";
        html_string += "<br><span id='coinflipJoinChosenValue'>0.00$</span>";
        $(".coinFlipJoinItemsContainer").html(html_string);
    })

    $(document).on('click', '#startCoinflipButton',function () {
        var itemstosend = [];
        $(".coinFlipItemsContainerItemImage").each(function () {
            if($(this).attr("data-selected") == "true") {
                itemstosend.push($(this).attr("data-assetid"));
            }
        })
        socketerino.emit("createCoinflip",itemstosend,$('input[name=selector]:checked').val());
        $(".coinFlipItemsContainer").empty();
    })

    $(document).on('click', '#joinCoinflipFinalizeButton',function () {
        var itemstosend = [];
        var value = parseFloat($("#coinflipJoinChosenValue").html().split("$")[0]);
        var neededValue = parseFloat($("#coinflipJoinNeededValue").html().split("$")[0]);
        $(".coinFlipJoinItemsContainerItemImage").each(function () {
            if($(this).attr("data-selected") == "true") {
                itemstosend.push($(this).attr("data-assetid"));
/*                value += parseFloat($(this).parent().find(".description").html().split("$")[0]);
                console.log(value);*/
            }
        })

        var treshHoldBottom = (neededValue / 100) * 90;
        var treshHoldHeight = (neededValue / 100) * 110;

        if(value >= treshHoldBottom && value <= treshHoldHeight) {
            socketerino.emit("joinCoinflip", itemstosend, $(this).parent().attr("asset-cid"));
            $(".coinFlipJoinItemsContainer").empty();
        } else {
            alert("Wert worked ned");
        }
    })

    socketerino.on("tradesend",function (data) {
        $(".coinFlipItemsContainer").html("Trade <a target='_blank' href='"+data+"'>annehmen</a>");
    })

    socketerino.on("tradesendJoin",function (data) {
        $(".coinFlipJoinItemsContainer").html("Trade <a target='_blank' href='"+data+"'>annehmen</a>");
    })

    $(document).on('click', '.coinFlipItemsContainerItemImage',function () {
        if($(this).attr("data-selected") == "true") {
            $(this).attr("data-selected","false");
        } else {
            $(this).attr("data-selected", "true");
        }
    })

    $(document).on('click', '.coinFlipJoinItemsContainerItemImage',function () {
        if($(this).attr("data-selected") == "true") {
            var currentValue = parseFloat($("#coinflipJoinChosenValue").html().split("$")[0]);
            var newValue = currentValue - parseFloat($(this).parent().find(".description").html().split("$")[0]);
            $("#coinflipJoinChosenValue").html(newValue.toFixed(2) + "$");
            $(this).attr("data-selected","false");
        } else {
            var currentValue = parseFloat($("#coinflipJoinChosenValue").html().split("$")[0]);
            var newValue = currentValue + parseFloat($(this).parent().find(".description").html().split("$")[0]);
            $("#coinflipJoinChosenValue").html(newValue.toFixed(2) + "$");
            $(this).attr("data-selected", "true");
        }
    })

});



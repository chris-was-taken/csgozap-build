clientSocket = io.connect();

$(document).ready(function() {
    $(".tabContent").html($("#affiliates").html())

    var shopInventory = giveShopInv();
    localStorage.setItem("shopInventory",JSON.stringify(shopInventory));
    buildShopInventory();

})

$(document).on('click', '.menu-elem',function () {
    if(!$(this).hasClass("active-menu-elem")) {
        var open = $(this).attr("data-open")
        var close = $("main").find(".active-menu-elem").attr("data-open")
        $("#"+close).hide()
        $("#"+open).show()

        $("main").find(".active-menu-elem").removeClass("active-menu-elem")
        $(this).addClass("active-menu-elem");

    }
})

$(document).on('click', '#useOtherCode',function () {
    var code = $("#otherCode").val()

    //TODO CHECK FOR BLANKETS AND REMOVE THEM AND IF LENGTH ISNT IN IF STATEMENT SHOW ERROR MESSAGE
    if(code.length <= 7 && code.length >= 3) {
        clientSocket.emit("useAFCode",code);
    }
})

$(document).on('click', '#setCustomAFCode',function () {
    var code = $("#customAFCode").val()

    //TODO CHECK FOR BLANKETS AND REMOVE THEM AND IF LENGTH ISNT IN IF STATEMENT SHOW ERROR MESSAGE
    if(code.length <= 7 && code.length >= 3) {
        clientSocket.emit("setAFCode",code);
    }
})

$(document).on('click', '#placeBet',function () {
    var betAmount = $("#betAmount").val()
    var multiplier = $("#multiplier").val()
    var ovun = $('input[name=ovun]:checked').attr("id");
    if(!isNaN(betAmount) && !isNaN(multiplier) && betAmount > 0.05) {
        //alert("Bet wär placed "+betAmount+"   "+ovun+"   "+multiplier)
        clientSocket.emit("placeBet",betAmount,ovun,multiplier)
    }
})

$(document).on('keyup', '#betAmount, #multiplier',function () {
    var betAmount = $("#betAmount").val()
    var multiplier = $("#multiplier").val()

    var profit = betAmount * multiplier
    var chance = 90 / multiplier

    $("#winProfit").text(profit)
    $("#winChance").text(chance)
})

clientSocket.on("finishUseAFCode",function (message,success) {
    //TODO FIND FITTING WAYS TO DISPLAY THESE INFORMATIONS
    if(success) {
        alert(message)
    } else {
        alert(message);
    }
})

clientSocket.on("finishedBet",function (result) {
    alert(result)
})

clientSocket.on("finishSetAFCode",function (message,success) {
    //TODO FIND FITTING WAYS TO DISPLAY THESE INFORMATIONS
    if(success) {
        alert(message)
    } else {
        alert(message);
    }
})

function buildShopInventory() {
    var shopInventory = JSON.parse(localStorage.getItem("shopInventory"));

    shopInventory = Object.entries(shopInventory).sort(function(a, b){
        return b[1][3] - a[1][3];
    });

    var shopString = "";

    shopInventory.forEach(function (val,ind) {
        val = val[1]
        shopString += "<div style='height: 200px; width: 200px; border: 1px solid red;'>" +
            '<img title="'+val[0]+"  "+val[3].toFixed(2)+'" src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+val[1]+'/100fx80f" alt="Weapon">'+
            "</div>"
    })

    $(".shopItemHolder").html(shopString)

    console.log(shopInventory)
}
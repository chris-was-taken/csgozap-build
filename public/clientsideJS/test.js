$(document).ready(function() {
    function startCountdownTimerJoinAttempt(coinflipId) {
        var timeElement = $("[data-cid=" + coinflipId + "]").find(".time");
        var timeDataTag = $("[data-cid=" + coinflipId + "]").find("[data-leftTime]");
        var pieElement = $("[data-cid=" + coinflipId + "]").find(".pie");
        console.log(pieElement);
        pieElement.css("visibility", "visible");
        //TODO ONLY MODIFY TIMER WITH TOP CLASS WITH THE COINFLIP ID
        var totaltime = 100;

        function update(percent) {
            percent = totaltime - percent;
            var deg;
            if (percent < (totaltime / 2)) {
                deg = 90 + (360 * percent / totaltime);
                pieElement.css('background-image',
                    'linear-gradient(' + deg + 'deg, transparent 50%, green 50%),linear-gradient(90deg, green 50%, transparent 50%)'
                );
            } else if (percent >= (totaltime / 2)) {
                deg = -90 + (360 * percent / totaltime);
                pieElement.css('background-image',
                    'linear-gradient(' + deg + 'deg, transparent 50%, lightgreen 50%),linear-gradient(90deg, green 50%, transparent 50%)'
                );
            }
        }

        var count = parseInt(timeDataTag.attr("data-leftTime"));
        myCounter = setInterval(function () {
            if (pieElement.css("visibility") == "hidden") {
                clearInterval(myCounter);
                timeElement.html(totaltime);
                pieElement.css('background-image', '');
            } else {
                count -= 1;
                timeElement.html(count);
                timeDataTag.attr("data-leftTime", count)
                update(count);

                if (count == 0) {
                    clearInterval(myCounter);
                    pieElement.css("visibility", "hidden");
                    timeElement.html(totaltime);
                    pieElement.css('background-image', '');
                }
            }
        }, 1000);
    }
})
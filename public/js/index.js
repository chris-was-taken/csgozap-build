var shakecd = false;
$(document).on("click",".steam-btn",function(e) {
    e.preventDefault();
    if($("#check-age").is(':checked')) {
        $(".landing-form").submit();
    } else {
        if(shakecd == false) {
            shakecd = true;
            $("#btn_label").addClass("information");
            setTimeout(function () {
                $("#btn_label").removeClass("information")
                shakecd = false;
            },1000)
        }
    }
});



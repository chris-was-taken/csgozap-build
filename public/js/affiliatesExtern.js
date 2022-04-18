$( document ).ready(function() {

    $( ".checkout-button" ).click(function() {
        if($(".checkout-button").hasClass('open')) {
            $(".checkout-button").removeClass('open');
            $(".main-content").css("opacity","1");
            $(".checkout-content").css("display","none");
            $(".checkout-button").css("background-image","url('images/arrow_right.png')");
        }else{
            $(".checkout-button").addClass('open');
            $(".checkout-content").css({
                'display' : 'block',
                'position' : 'absolute',
            });
            $(".checkout-button").css("background-image","url('images/arrow_left.png')");
            $(".main-content").css("opacity","0");
        }

    });
    
    $(".earning-button").click(function () {
        if($(".earning-button").hasClass('open')) {
            $(".earning-button").removeClass('open');
            $(".earning-content").css ('display', "none")
            $(".input-content").css ('display', "block")
        }else {
            $(".earning-content").css ('display', "block")
            $(".affiliate-content").css ('display', "none")
            $(".input-content").css ('display', "none")
            $(".earning-button").addClass('open');
        }

    })
    $(".affiliate-button").click(function () {
        if($(".affiliate-button").hasClass('open')) {
            $(".affiliate-button").removeClass('open');
            $(".affiliate-content").css ('display', "none")
            $(".input-content").css ('display', "block")
        }else {
            $(".affiliate-content").css ('display', "block")
            $(".earning-content").css ('display', "none")
            $(".input-content").css ('display', "none")
            $(".affiliate-button").addClass('open');
        }

    })
});
var zoomListeners = [];

(function(){
    // Poll the pixel width of the window; invoke zoom listeners
    // if the width has been changed.
    var lastWidth = 0;
    function pollZoomFireEvent() {
        var widthNow = jQuery(window).width();
        if (lastWidth == widthNow) return;
        lastWidth = widthNow;
        // Length changed, user must have zoomed, invoke listeners.
        for (i = zoomListeners.length - 1; i >= 0; --i) {
            zoomListeners[i]();
        }
    }
    setInterval(pollZoomFireEvent, 100);
})();
console.log(zoomListeners);

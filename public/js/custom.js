$(document).on("click",".joinCoinflipButton",function() {
    $('#joinCoinflipModal').modal({
    	 backdrop : true,
    	 keyboard : true
    })
});

document.addEventListener('storage', function(e) {
    console.log("Local Storage has been touched ")
    /*
    document.querySelector('.my-key').textContent = e.key;
    document.querySelector('.my-old').textContent = e.oldValue;
    document.querySelector('.my-new').textContent = e.newValue;
    document.querySelector('.my-url').textContent = e.url;
    document.querySelector('.my-storage').textContent = e.storageArea;*/
});

function insertJoinAttempt (coinflipId,content,cfArr) {

    //TODO do tests here !!
    var frontendCoinflipData = JSON.parse(localStorage.getItem("frontendCoinflipData"));
    frontendCoinflipData[coinflipId]["p2"] = cfArr;
    localStorage.setItem("frontendCoinflipData", JSON.stringify(frontendCoinflipData));

    buildAndShowView(coinflipId);

    $("[data-cid="+coinflipId+"]").find(".join-popup-button").remove();
    var coinflipContainerElement = $("[data-cid="+coinflipId+"]");
    var insertElement = coinflipContainerElement.find(".activity-center-cont");
    $(content).insertAfter(insertElement);
    startCountdownTimerJoinAttempt(coinflipId);
}

$(document).ready(function(){

    //console.log(coinflipClientArr)
    //console.log(coinflipClientArr[0]["2id"][0]["p1"]["name"])
    var clientsideCoinflipArr = giveClientsideArr();
    localStorage.setItem("frontendCoinflipData",JSON.stringify(clientsideCoinflipArr));
    console.log(localStorage.getItem("frontendCoinflipData"))
    //console.log(JSON.parse(JSON.stringify(logPeter())));
    //console.log(array)


    $( ".activity-block" ).each(function( index ) {
        console.log("in foreach")
        var coinflipId = $( this ).attr("data-cid");
        if($(this).attr("data-cfstatus") == 0) {
            console.log("coinflipstatus = 0")
            if(parseInt($( this ).find(".time").attr("data-leftTime")) !== 100) {
                startCountdownTimerJoinAttempt(coinflipId)
            }
        } else {
            console.log("coinflipstatus = 1")
            var player2site = $( this ).attr("data-player2site");
            var winningSite = $( this ).attr("data-winningSite");
            console.log("vor final countdown")
            //startFinalCountdown(coinflipId,player2site,winningSite)
            var time = parseFloat($(this).find(".time").html());
            console.log("WENN FEHLER DANN WRSL HIER")
            console.log(time)
            //TODO MIGHT OVERWRITE HERE
            insertAcceptedOfferContent(coinflipId,0,player2site,winningSite,"",time);
        }
    });

    //TODO CHECK HERE IF TRADEURL IS SET IF NOT MAKE MODAL

    /*setTimeout(insertJoinAttempt,1000,12,'<div class="col-xs-4 col-sm-4 col-md-4 col-lg-4 activity-right-cont">'+
        '<div class="activity-profile">'+
        '<img src="images/thumbnail.jpg" class="img-responsive prof-pic" alt="">'+
        '<p class="player-name">Senpai Kimochi Right</p>'+
        '</div>'+
        '</div>);')
    setTimeout(insertAcceptedOfferContent,12000,12,2.34,1,0,'<div class="col-xs-4 col-sm-4 col-md-4 col-lg-4 activity-right-cont">'+
        '<div class="activity-profile">'+
        '<img src="images/thumbnail.jpg" class="img-responsive prof-pic" alt="">'+
        '<p class="player-name">Senpai Kimochi Right</p>'+
        '<span data-value-player2="2.34">$2.34</span>'+
        '<div class="more-items" onclick="opendesktop()">+2 more</div>'+
        '</div>'+
        '<div class="player-items">'+
        '<img src="images/1.png" class="img-responsive item-pic-thumb pull-rightextraup" alt="">'+
        '<img src="images/1.png" class="img-responsive item-pic-thumb" alt="">'+
        '<img src="images/1.png" class="img-responsive item-pic-thumb" alt="">'+
        '<img src="images/1.png" class="img-responsive item-pic-thumb" alt="">'+
        '<img src="images/1.png" class="img-responsive item-pic-thumb" alt="">'+
        '</div>'+
        '<i class="fa fa-chevron-down hidden-sm hidden-md hidden-lg pull-rightextradown" onclick="openmobile()" aria-hidden="true"></i>'+
        '</div>);')*/




    $('.chat-content-area').scrollTop($('.chat-content-area')[0].scrollHeight);





    // WebSocket
    //socketerino = io.connect();
	socketerino = new io.connect();

	socketerino.on("setTradeurl",function () {
        $('#setTradeurlModal').modal({
            backdrop : "static",
            keyboard : false
        })
    })

    socketerino.on("updateTotalUsers",function(newTotalUsers) {
    	$(".totalUserCount").html(newTotalUsers);
    })

    //Send new Coinflip to Users
    socketerino.on("newCoinflip",function(coinflipValue,content,frontendCFArr,coinflipId) {
        insertNewCoinflip(coinflipValue,content,frontendCFArr,coinflipId)
    })

    //Update Total Values
    //TODO MAYBE ADD ANIMATION TO LOOK MORE SLICK BUT NOT THAT IMPORTANT ATM
    //TODO SERVERSIDE IF NEW CF GETS CREATED OR IF SOMEONE ACCEPTS OFFER FOR JOIN
    socketerino.on("updateTotalStats",function(addValue,addItems,amount) {
        updateTotalStats(addValue,addItems,amount)
    })

    //Delete a Coinflip
    socketerino.on("deleteCoinflip",function(coinflipId) {
        deleteCoinflip(coinflipId)
    })

    //Insert Join Attempt
    socketerino.on("insertJoinAttempt",function(coinflipId,content, cfArr) {
        insertJoinAttempt(coinflipId,content, cfArr);
    })

    //Cancel Insert Attempt
    socketerino.on("deleteJoinAttempt",function(coinflipId) {
        deleteJoinAttempt(coinflipId)
    })

    //Insert Accepted Offer
    socketerino.on("insertAcceptedOfferContent",function(coinflipId,value,chosenSite,winner,content,player2arr,player2itemarr,hashPerc) {
        insertAcceptedOfferContent(coinflipId,value,chosenSite,winner,content,10,player2arr,player2itemarr,hashPerc)
    })


    socketerino.on("coinflipInformations",function (coinflipArray) {
          loadViewTemplate(coinflipArray);
        //$("#view-coinflip-popup").empty();
    })

	$(document).on('click', '#setTradeurlButton',function () {
        /*var tradeurl = $("#setTradeurlValue").val();
        if(tradeurl.length == 75) {
            socketerino.emit('setTradeurl',tradeurl);
            $('#setTradeurlModal').modal('toggle');
        } else {
            $("#setTradeurlModal").find(".modal-body").append("<span style='color:red'>Tradeurl nicht valide</span>");
        }*/
        var tradeurl = $("#setTradeurlValue").val();
        socketerino.emit('setTradeurl',tradeurl);
        $('#setTradeurlModal').modal('toggle');
    })

	$(document).on('click', '#resetTradeurl',function () {
        $('#setTradeurlModal').modal({
            backdrop : "true",
            keyboard : true
        })
    })

	$(document).on('click', '#giveroItemeroBackero',function () {
        socketerino.emit('giveItemsBack');
    })


	/* CHAT HERE */
    var lastMessage = false;
    var timeLeft;
    var warningCD = false;
    function reenableChat() {
        lastMessage = false;
        warningCD = false;
    }

	$(document).on('click', '#chatMessageSendButton',function (e) {
        e.preventDefault();
	    if(lastMessage == false) {
	        var messageContent = $("#chatMessageInput").val();
	        if(messageContent.length > 0) {
                var urlRegex =/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig;
                messageContent = messageContent.replace(urlRegex,"*");
                socketerino.emit("newChatMessage", messageContent.replace(/(<([^>]+)>)/ig, ""));
                if(messageContent.length > 0) {
                    $("#chatMessageInput").val("");
                    lastMessage = true;
                    timeLeft = setTimeout(reenableChat, 10000)
                }
            }
        } else {
	        if(warningCD == false) {
                var warning = '<div class="block">' +
                    //'<img src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/c1/c133e552fcde675321fb954a3bdce48d45b8740d.jpg" alt="" class="img-responsive player-thumb">'+
                    '<div class="player-chat"><p class="player-name" style="color: red">WARNING!</p>' +
                    '<span class="text-main-content" style="color: darkred">Your texting to fast!<br>You need to wait 10 seconds between <br>each message!</span></div></div>'
                $(".chat-content-area").append(warning);
                $('.chat-content-area').scrollTop($('.chat-content-area')[0].scrollHeight);
                warningCD = true;
            }
        }
    })

    $(document).on('click', '#logout',function () {
        $("#logoutForm").submit();
    })

    socketerino.on("newChatMessage",function (chatMessage) {
        $(".chat-content-area").append(chatMessage);
        $('.chat-content-area').scrollTop($('.chat-content-area')[0].scrollHeight);
    })

	/* CHAT END HERE */

    /* COINFLIP CREATE CONTENT HERE */
    		$(document).on("click",".coinflip-btn",function() {

                $("#create-coinflip-popup").find(".col-md-12").nextAll().remove();
                $('<div class="col-md-12" style="height: 60px"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>').insertAfter($("#create-coinflip-popup").find(".col-md-12"))

			    socketerino.emit('loadCoinflipWindow');
			});

			socketerino.on('coinflipItemContent',function (data) {
                var html_string = '<div class="col-xs-12 col-sm-2 popup-item create-item pull-right">'+
                    '<div class="col-md-12" style="height: 218px;border: 3px solid #396467;">'+
                    '<img class="pull-left img-responsive ct-img" id="create_chosensite_ct" data-selected-site="true" src="images/mlogo1.png" alt="" style="margin-top: 35px;">'+
                    '<img class="pull-right img-responsive t-img" id="create_chosensite_t" data-selected-site="false" src="images/mlogo2.png" alt="" style="margin-top: 35px;">'+
                    '<p class="pull-left total-price"><span class="totalItemSelector">0</span>/10</p><p class="pull-left total-price" data-create-value="0.00">$0.00</p>'+
                '<a id="createCoinflipFinal" class="pull-left btn btn-lg btn-cyan">Create</a></div></div>';


                var dataz = data.sort(function(a,b) {
                    return  b[3] - a[3];
                });
                if (dataz.length > 5) {
                    for(var i = 0; i < 5; i++) {

                        var descriptionString = "";
                        if(dataz[i][0].includes("|")) {
                            if(dataz[i][0].includes("StatTrak")) {
                                descriptionString += '<span>StatTrak™</span>';
                                descriptionString += '<span>'+dataz[i][0].split("™")[1].split("|")[0]+'</span>';
                            } else {
                                descriptionString += '<span>' + dataz[i][0].split("|")[0] + '</span>';
                            }
                            descriptionString += '<span>'+dataz[i][0].split("|")[1].split("(")[0]+'</span>';
                            descriptionString += '<span>'+dataz[i][0].split("|")[1].split("(")[1].split(")")[0]+'</span>';
                        } else {
                            descriptionString += '<span>'+dataz[i][0]+'</span>';
                        }

                        html_string += '<div class="col-xs-6 col-sm-2 popup-item popup-item-selectable" data-asset='+dataz[i][2]+' data-item-value="'+dataz[i][3].toFixed(2)+'" >'+
                            '<div class="col-md-12 popup-item-contentHolder">'+
                            '<div>'+
                            '<img class="img-responsive pop popup-item-image" title="'+dataz[i][0]+'" src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+dataz[i][1]+'/182fx137f">'+
                            '<span class="popup-item-price-span">$'+dataz[i][3].toFixed(2)+'</span>'+
                            '</div>'+
                            '<div class="popup-item-desc-holder">'+
                            '<div class="popup-item-desc-controller">'+
                            '<p class="item-desc item-desc-redone">'+
                            descriptionString +
                            '</p>'+
                            '</div>'+
                            '</div>'+
                            '</div>'+
                            '</div>'
                    }
                    html_string += '</div>';
                    for(var i = 5; i < dataz.length; i++) {
                        var descriptionString = "";
                        if(dataz[i][0].includes("|")) {
                            if(dataz[i][0].includes("StatTrak")) {
                                descriptionString += '<span>StatTrak™</span>';
                                descriptionString += '<span>'+dataz[i][0].split("™")[1].split("|")[0]+'</span>';
                            } else {
                                descriptionString += '<span>' + dataz[i][0].split("|")[0] + '</span>';
                            }
                            descriptionString += '<span>'+dataz[i][0].split("|")[1].split("(")[0]+'</span>';
                            descriptionString += '<span>'+dataz[i][0].split("|")[1].split("(")[1].split(")")[0]+'</span>';
                        } else {
                            descriptionString += '<span>'+dataz[i][0]+'</span>';
                        }

                        html_string += '<div class="col-xs-6 col-sm-2 popup-item popup-item-selectable" data-asset='+dataz[i][2]+' data-item-value="'+dataz[i][3].toFixed(2)+'" >'+
                            '<div class="col-md-12 popup-item-contentHolder">'+
                            '<div>'+
                            '<img class="img-responsive pop popup-item-image" title="'+dataz[i][0]+'" src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+dataz[i][1]+'/182fx137f">'+
                            '<span class="popup-item-price-span">$'+dataz[i][3].toFixed(2)+'</span>'+
                            '</div>'+
                            '<div class="popup-item-desc-holder">'+
                            '<div class="popup-item-desc-controller">'+
                            '<p class="item-desc item-desc-redone">'+
                            descriptionString +
                            '</p>'+
                            '</div>'+
                            '</div>'+
                            '</div>'+
                            '</div>'
                    }
                } else {
                    for(var i = 0; i < dataz.length; i++) {
                        var descriptionString = "";
                        if(dataz[i][0].includes("|")) {
                            if(dataz[i][0].includes("StatTrak")) {
                                descriptionString += '<span>StatTrak™</span>';
                                descriptionString += '<span>'+dataz[i][0].split("™")[1].split("|")[0]+'</span>';
                            } else {
                                descriptionString += '<span>' + dataz[i][0].split("|")[0] + '</span>';
                            }
                            descriptionString += '<span>'+dataz[i][0].split("|")[1].split("(")[0]+'</span>';
                            descriptionString += '<span>'+dataz[i][0].split("|")[1].split("(")[1].split(")")[0]+'</span>';
                        } else {
                            descriptionString += '<span>'+dataz[i][0]+'</span>';
                        }

                        html_string += '<div class="col-xs-6 col-sm-2 popup-item popup-item-selectable" data-asset='+dataz[i][2]+' data-item-value="'+dataz[i][3].toFixed(2)+'" >'+
                            '<div class="col-md-12 popup-item-contentHolder">'+
                            '<div>'+
                            '<img class="img-responsive pop popup-item-image" title="'+dataz[i][0]+'" src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+dataz[i][1]+'/182fx137f">'+
                            '<span class="popup-item-price-span">$'+dataz[i][3].toFixed(2)+'</span>'+
                            '</div>'+
                            '<div class="popup-item-desc-holder">'+
                            '<div class="popup-item-desc-controller">'+
                            '<p class="item-desc item-desc-redone">'+
                            descriptionString +
                            '</p>'+
                            '</div>'+
                            '</div>'+
                            '</div>'+
                            '</div>'
                         }
                        html_string += '</div>';
                    }
                    html_string += '</div>';
                    $("#create-coinflip-popup").find(".col-md-12").nextAll().remove();
                    $(html_string).insertAfter($("#create-coinflip-popup").find(".col-md-12"))

    		})

    		$(document).on('click', '.coinFlipItemsContainerItemImage',function () {
						if($(this).attr("data-selected") == "true") {
							$(this).attr("data-selected","false");
						} else {
							$(this).attr("data-selected", "true");
						}
    		})

    		$(document).on('click', '#createCoinflipFinal',function () {

                    var itemstosend = [];
                    var value = parseFloat($("[data-create-value]").attr("data-create-value"));

                    //console.log()

                    if(value > 0) {
                        $("#create-coinflip-popup").find("[data-selected='true']").each(function () {
                            itemstosend.push($(this).parent().attr("data-asset"));
                        })
                        var chosenId = $("#create-coinflip-popup").find("[data-selected-site='true']").attr("id");
                        if(chosenId.includes("ct")) {
                            chosenId = 0;
                        } else {
                            chosenId = 1;
                        }
                        socketerino.emit("createCoinflip", itemstosend, chosenId);
                        $("#create-coinflip-popup").find(".col-md-12").nextAll().remove();
                        $('<div class="col-md-12" style="height: 60px"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>').insertAfter($("#create-coinflip-popup").find(".col-md-12"))
                        //$("#create-coinflip-popup").find(".col-md-12").nextAll().remove();
                    }



					/*var itemstosend = [];
					$(".coinFlipItemsContainerItemImage").each(function () {
						if($(this).attr("data-selected") == "true") {
							itemstosend.push($(this).attr("data-assetid"));
						}
					})
					socketerino.emit("createCoinflip",itemstosend,$('input[name=selector]:checked').val());
					$("#createCoinflipModal .modal-body").empty();*/
  		 })

  		 socketerino.on("tradesend",function (data) {
             console.log("got tradelink from create")
             $("#create-coinflip-popup").find(".col-md-12").nextAll().remove();
             var tradestring = "<p style='text-align: center;'>Accept the <a target='_blank' href='"+data+"'>tradeoffer</a> !</p>";
             $(tradestring).insertAfter($("#create-coinflip-popup").find(".col-md-12"))
         })
    /* COINFLIP CREATE CONTENT END */

		/* COINFLIP JOIN CONTENT HERE */

				var coinflipId;

				$(document).on("click",".join-popup-button",function() {


                    $.magnificPopup.open({
                        items: {
                            src: '#join-coinflip-popup',
                            type:'inline',
                        },
                        removalDelay: 500, //delay removal by X to allow out-animation
                        callbacks: {
                            beforeOpen: function() {
                                //this.st.mainClass = this.st.el.attr('data-effect');
                            }
                        },
                        midClick: true
                    })

					//TODO MAYBE PLAY ANIMATION WHILE LOADING ITEMS

			        //TODO SOME SERVERSIDE CHECK IF COINFLIP ID IS SET BECAUSE IF NOT WILL CRASH SERVER
                    //ONLY VALID IF USER CHANGES COINFLIP ID MANUALLY
			        coinflipId = $(this).closest('.activity-block').attr("data-cid");
                    $("#join-coinflip-popup").find(".col-md-12").nextAll().remove();
                    $('<div class="col-md-12" style="height: 60px"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>').insertAfter($("#join-coinflip-popup").find(".col-md-12"))

                    socketerino.emit('loadJoinItems',coinflipId);

				});

				$(document).on("click",".viewCoinflipButton",function() {
                    var testElement = $(this).closest('.activity-block');
				    $('#viewCoinflipModal').modal({
                        backdrop : true,
                        keyboard : true
                    })
                    //item-pic-thumb
                    var importPicture = testElement.find(".item-pic-thumb");
                    importPicture.each(function () {
                        $('#viewCoinflipModal').find(".modal-body").append($(this).clone());
                    })
				});

                $('#viewCoinflipModal').on('hidden.bs.modal', function () {
                    $('#viewCoinflipModal').find(".modal-body").empty();
                })

				socketerino.on('joinCoinflipWindowData',function (data) {
                      var totalValue = parseFloat(data[1]);
                      var lowEndTrashhold = ((totalValue / 100) * 90).toFixed(2);
                      var highEndTrashhold = ((totalValue / 100) * 110).toFixed(2);

                      if(data[2] == 0) {
                          var showImg = "mlogo2.png"
                      } else {
                          var showImg = "mlogo1.png"
                      }

                      var html_string = '<div class="col-xs-12 col-sm-2 popup-item join-item pull-right" style="height: 228px;padding: 5px;">' +
                        '<div class="col-md-12" style="height: 100%;padding: 0px 0px;border: 3px solid #396467;">' +
                        '<img class="img-responsive ct-img" src="images/'+showImg+'" alt="" style="position: absolute;top: 10px;left: 0;right: 0;margin: 0 auto;">' +
                        '<p class="pull-left total-price" style="padding: 0px 0px;position: absolute;top: 43%;">Price range: <span class="popup-value-span" data-treshhold="'+parseFloat(data[1])+'">$'+lowEndTrashhold+' - $'+highEndTrashhold+'</span>' +
                        '<span data-join-defizit="0.00" class="popup-join-defizit">$0.00</span><span><span class="totalItemSelector">0</span>/10</span></p>' +
                        '<a id="joinCoinflipFinal" data-cf-join-id="'+data[3]+'" class="pull-left btn btn-lg btn-cyan" style="position: absolute;bottom: 3%;width: 90%;left: 5%;">Join</a></div></div>';

                      var dataz = data[0].sort(function(a,b) {
                          return  b[3] - a[3];
                      });
                      if (dataz.length > 5) {
                          for(var i = 0; i < 5; i++) {

                              var descriptionString = "";
                              if(dataz[i][0].includes("|")) {
                                  if(dataz[i][0].includes("StatTrak")) {
                                      descriptionString += '<span>StatTrak™</span>';
                                      descriptionString += '<span>'+dataz[i][0].split("™")[1].split("|")[0]+'</span>';
                                  } else {
                                      descriptionString += '<span>' + dataz[i][0].split("|")[0] + '</span>';
                                  }
                                  descriptionString += '<span>'+dataz[i][0].split("|")[1].split("(")[0]+'</span>';
                                  descriptionString += '<span>'+dataz[i][0].split("|")[1].split("(")[1].split(")")[0]+'</span>';
                              } else {
                                  descriptionString += '<span>'+dataz[i][0]+'</span>';
                              }

                              html_string += '<div class="col-xs-6 col-sm-2 popup-item popup-item-selectable" data-asset='+dataz[i][2]+' data-item-value="'+dataz[i][3].toFixed(2)+'" >'+
                              '<div class="col-md-12 popup-item-contentHolder">'+
                              '<div>'+
                              '<img class="img-responsive pop popup-item-image" title="'+dataz[i][0]+'" src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+dataz[i][1]+'/182fx137f">'+
                              '<span class="popup-item-price-span">$'+dataz[i][3].toFixed(2)+'</span>'+
                              '</div>'+
                              '<div class="popup-item-desc-holder">'+
                              '<div class="popup-item-desc-controller">'+
                              '<p class="item-desc item-desc-redone">'+
                              descriptionString +
                              '</p>'+
                              '</div>'+
                              '</div>'+
                              '</div>'+
                              '</div>'
                          }
                          html_string += '</div>';
                          for(var i = 5; i < dataz.length; i++) {
                              var descriptionString = "";
                              if(dataz[i][0].includes("|")) {
                                  if(dataz[i][0].includes("StatTrak")) {
                                      descriptionString += '<span>StatTrak™</span>';
                                      descriptionString += '<span>'+dataz[i][0].split("™")[1].split("|")[0]+'</span>';
                                  } else {
                                      descriptionString += '<span>' + dataz[i][0].split("|")[0] + '</span>';
                                  }
                                  descriptionString += '<span>'+dataz[i][0].split("|")[1].split("(")[0]+'</span>';
                                  descriptionString += '<span>'+dataz[i][0].split("|")[1].split("(")[1].split(")")[0]+'</span>';
                              } else {
                                  descriptionString += '<span>'+dataz[i][0]+'</span>';
                              }

                              html_string += '<div class="col-xs-6 col-sm-2 popup-item popup-item-selectable" data-asset='+dataz[i][2]+' data-item-value="'+dataz[i][3].toFixed(2)+'" >'+
                                  '<div class="col-md-12 popup-item-contentHolder">'+
                                  '<div>'+
                                  '<img class="img-responsive pop popup-item-image" title="'+dataz[i][0]+'" src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+dataz[i][1]+'/182fx137f">'+
                                  '<span class="popup-item-price-span">$'+dataz[i][3].toFixed(2)+'</span>'+
                                  '</div>'+
                                  '<div class="popup-item-desc-holder">'+
                                  '<div class="popup-item-desc-controller">'+
                                  '<p class="item-desc item-desc-redone">'+
                                  descriptionString +
                                  '</p>'+
                                  '</div>'+
                                  '</div>'+
                                  '</div>'+
                                  '</div>'
                          }
                      } else {
                          for(var i = 0; i < dataz.length; i++) {
                              var descriptionString = "";
                              if(dataz[i][0].includes("|")) {
                                  if(dataz[i][0].includes("StatTrak")) {
                                      descriptionString += '<span>StatTrak™</span>';
                                      descriptionString += '<span>'+dataz[i][0].split("™")[1].split("|")[0]+'</span>';
                                  } else {
                                      descriptionString += '<span>' + dataz[i][0].split("|")[0] + '</span>';
                                  }
                                  descriptionString += '<span>'+dataz[i][0].split("|")[1].split("(")[0]+'</span>';
                                  descriptionString += '<span>'+dataz[i][0].split("|")[1].split("(")[1].split(")")[0]+'</span>';
                              } else {
                                  descriptionString += '<span>'+dataz[i][0]+'</span>';
                              }

                              html_string += '<div class="col-xs-6 col-sm-2 popup-item popup-item-selectable" data-asset='+dataz[i][2]+' data-item-value="'+dataz[i][3].toFixed(2)+'" >'+
                                  '<div class="col-md-12 popup-item-contentHolder">'+
                                  '<div>'+
                                  '<img class="img-responsive pop popup-item-image" title="'+dataz[i][0]+'" src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+dataz[i][1]+'/182fx137f">'+
                                  '<span class="popup-item-price-span">$'+dataz[i][3].toFixed(2)+'</span>'+
                                  '</div>'+
                                  '<div class="popup-item-desc-holder">'+
                                  '<div class="popup-item-desc-controller">'+
                                  '<p class="item-desc item-desc-redone">'+
                                  descriptionString +
                                  '</p>'+
                                  '</div>'+
                                  '</div>'+
                                  '</div>'+
                                  '</div>'
                          }
                          html_string += '</div>';
                      }
                      html_string += '</div>';
                      $("#join-coinflip-popup").find(".col-md-12").nextAll().remove();
                      $(html_string).insertAfter($("#join-coinflip-popup").find(".col-md-12"))
		        })

		    //TODO Find some clientside way to correctly check value of items
		    $(document).on('click', '.coinFlipJoinItemsContainerItemImage',function () {
		        if($(this).attr("data-selected") == "true") {
		            $(this).attr("data-selected","false");
		        } else {
		            $(this).attr("data-selected", "true");
		        }
		    })


		    $(document).on('click', '#joinCoinflipFinal',function () {

                var coinflipId = parseInt($(this).attr("data-cf-join-id"));
		        var itemstosend = [];
                var value = parseFloat($("[data-join-defizit]").attr("data-join-defizit"));
                var treshHold = parseFloat($("[data-treshhold]").attr("data-treshhold"));
                var lowEndTrashhold = ((treshHold / 100) * 90).toFixed(2);
                var highEndTrashhold = ((treshHold / 100) * 110).toFixed(2);

		        if(value >= lowEndTrashhold && value <= highEndTrashhold) {
                    $("#join-coinflip-popup").find("[data-selected='true']").each(function () {
                        itemstosend.push($(this).parent().attr("data-asset"));
                    })
                    socketerino.emit("joinCoinflip", itemstosend, coinflipId);
                    $("#join-coinflip-popup").find(".col-md-12").nextAll().remove();
                    $('<div class="col-md-12" style="height: 60px"><div class="double-bounce1"></div><div class="double-bounce2"></div></div>').insertAfter($("#join-coinflip-popup").find(".col-md-12"))
                }
		    })

		    socketerino.on("tradesendJoin",function (data) {
                console.log("got tradelink from join")
                var tradeurl = "<p style='text-align: center'>Accept the <a target='_blank' href='"+data+"'>tradeoffer</a> !</p>";
                $("#join-coinflip-popup").find(".col-md-12").nextAll().remove();
                $(tradeurl).insertAfter($("#join-coinflip-popup").find(".col-md-12"))
		    })

    /* COINFLIP JOIN CONTENT END */

})


$(function(){

    $('.your-stats-link span').click(function(){
        $(this).toggleClass('down');
        $('#drop').toggleClass('down');
        $('#yourStats').toggleClass('show');
    });

});

// calc height percent with fix height
$(window).on("resize", function() {

    var screenHeight = $(window).height();
    var screenWidth = $(window).width();
    var navHeight = $('#main-top-nav').height();
    var footHeight = $('#footer').height();
    var totalStatsHeight = $('#totalStats').height();
    var rightBot = $('#rightBot').height();
    var resultHeight = screenHeight - (footHeight + navHeight);
    var mobileView = 992;

    if($(window).height() <= screenHeight) {
        $('#main-container').css('height', resultHeight);

        var newMainContHeight = $('#main-container').height();

        $('#activityCont').css('height', newMainContHeight - totalStatsHeight);

    }

    if ($(window).width() <= mobileView) {
        $('#main-container').css('height', 'auto');
        $('#activityCont').css('height', 'auto');
    }

})
    .resize();



/* START COINFLIP CONTENT UPDATES ****************************************************************************************************************************************************/

function updateTotalStats(value,items,amount) {
    //TODO MAYBE IF PROBLEMS ROUND TO 2 AFTER COMMA SO IT ISTN 10.329423473
    var oldValue = parseFloat($("#totalAmount").html())
    $("#totalAmount").html((oldValue + value).toFixed(2));
    oldValue = parseInt($("#totalItems").html())
    $("#totalItems").html(oldValue + items);
    oldValue = parseInt($("#totalGames").html())
    $("#totalGames").html(oldValue + amount);
}

function startCountdownTimerJoinAttempt(coinflipId) {
    var timeElement = $("[data-cid="+coinflipId+"]").find( ".time" );
    var timeDataTag = $("[data-cid="+coinflipId+"]").find( "[data-leftTime]" );
    var pieElement = $("[data-cid="+coinflipId+"]").find( ".pie" );
    console.log(pieElement);
    pieElement.css("visibility","visible");
    //TODO ONLY MODIFY TIMER WITH TOP CLASS WITH THE COINFLIP ID
	var totaltime = 100;
    function update(percent){
        percent = totaltime - percent;
        var deg;
        if(percent<(totaltime/2)){
            deg = 90 + (360*percent/totaltime);
            pieElement.css('background-image',
                'linear-gradient('+deg+'deg, transparent 50%, green 50%),linear-gradient(90deg, green 50%, transparent 50%)'
            );
        } else if(percent>=(totaltime/2)){
            deg = -90 + (360*percent/totaltime);
            pieElement.css('background-image',
                'linear-gradient('+deg+'deg, transparent 50%, lightgreen 50%),linear-gradient(90deg, green 50%, transparent 50%)'
            );
        }
    }
    var count = parseInt(timeDataTag.attr("data-leftTime"));
    myCounter = setInterval(function () {
        if(pieElement.css("visibility") == "hidden") {
            clearInterval(myCounter);
            timeElement.html(totaltime);
            pieElement.css('background-image','');
        } else {
            count-=1;
            timeElement.html(count);
            timeDataTag.attr("data-leftTime",count)
            update(count);

            if(count==0) {
                clearInterval(myCounter);
                pieElement.css("visibility","hidden");
                timeElement.html(totaltime);
                pieElement.css('background-image','');
            }
        }
    }, 1000);
}

function startViewCountdownTimerJoinAttempt() {
    var timeElement = $("#view-coinflip-popup").find( ".time" );
    var timeDataTag = $("#view-coinflip-popup").find( "[data-leftTime]" );
    var pieElement = $("#view-coinflip-popup").find( ".pie" );
    console.log(pieElement);
    pieElement.css("visibility","visible");
    //TODO ONLY MODIFY TIMER WITH TOP CLASS WITH THE COINFLIP ID
	var totaltime = 100;
    function update(percent){
        percent = totaltime - percent;
        var deg;
        if(percent<(totaltime/2)){
            deg = 90 + (360*percent/totaltime);
            pieElement.css('background-image',
                'linear-gradient('+deg+'deg, transparent 50%, green 50%),linear-gradient(90deg, green 50%, transparent 50%)'
            );
        } else if(percent>=(totaltime/2)){
            deg = -90 + (360*percent/totaltime);
            pieElement.css('background-image',
                'linear-gradient('+deg+'deg, transparent 50%, lightgreen 50%),linear-gradient(90deg, green 50%, transparent 50%)'
            );
        }
    }
    var count = parseInt(timeDataTag.attr("data-leftTime"));
    myCounter = setInterval(function () {
        if(pieElement.css("visibility") == "hidden") {
            clearInterval(myCounter);
            timeElement.html(totaltime);
            pieElement.css('background-image','');
        } else {
            count-=1;
            timeElement.html(count);
            timeDataTag.attr("data-leftTime",count)
            update(count);

            if(count==0) {
                clearInterval(myCounter);
                pieElement.css("visibility","hidden");
                timeElement.html(totaltime);
                pieElement.css('background-image','');
            }
        }
    }, 1000);
}

/*function startFinalCountdown(coinflipId,player2site,winner) {
    console.log("in final countdown");
    console.log(coinflipId);
    var timeElement = $("[data-cid="+coinflipId+"]").find( ".time" );
    var timeDataTag = $("[data-cid="+coinflipId+"]").find( "[data-leftTime]" );
    var pieElement = $("[data-cid="+coinflipId+"]").find( ".pie" );
    var totaltime = 10;
    function update(percent){
        percent = totaltime - percent;
        var deg;
        if(percent<(totaltime/2)){
            deg = 90 + (360*percent/totaltime);
            pieElement.css('background-image',
                'linear-gradient('+deg+'deg, transparent 50%, green 50%),linear-gradient(90deg, green 50%, transparent 50%)'
            );
        } else if(percent>=(totaltime/2)){
            deg = -90 + (360*percent/totaltime);
            pieElement.css('background-image',
                'linear-gradient('+deg+'deg, transparent 50%, lightgreen 50%),linear-gradient(90deg, green 50%, transparent 50%)'
            );
        }
    }
    var count = parseInt(timeDataTag.attr("data-leftTime"));

    console.log(count);

    finalCounter = setInterval(function () {
        count-= 0.01;
        var show = Math.round( count * 10 ) / 10;
        show = count.toFixed(1);
        console.log("below function")
        console.log(count)
        console.log(show)
        timeDataTag.attr("data-leftTime",show)
        timeElement.html(show);
        update(count);
        if(show==0 || show < 0) {
            var ctArr = ["animation1080","animation1440","animation1800","animation2160"];
            var tArr = ["animation900","animation1260","animation1620","animation1980"];
            if(winner == 0) {
                var item = ctArr[Math.floor(Math.random()*ctArr.length)]
            } else {
                var item = tArr[Math.floor(Math.random()*tArr.length)]
            }
            clearInterval(finalCounter);
            $('<div class="coinWrapper"><div class="coinZoomer"><div id="coin" class="'+item+'"><div class="front"></div><div class="back"></div></div></div></div>').insertBefore(pieElement);
            pieElement.remove();
            startCoinflipZoom(coinflipId,100,"up");
            setTimeout(markCoinflipWinner,3500,coinflipId,player2site,winner);
        }
    }, 10);
}*/

function startFinalCountdown(coinflipId,player2site,winner) {
    console.log("in final countdown");
    console.log(coinflipId);
    var timeElement = $("[data-cid="+coinflipId+"]").find( ".time" );
    var pieElement = $("[data-cid="+coinflipId+"]").find( ".pie" );
    var totaltime = 10;
    function update(percent){
        percent = totaltime - percent;
        var deg;
        if(percent<(totaltime/2)){
            deg = 90 + (360*percent/totaltime);
            pieElement.css('background-image',
                'linear-gradient('+deg+'deg, transparent 50%, green 50%),linear-gradient(90deg, green 50%, transparent 50%)'
            );
        } else if(percent>=(totaltime/2)){
            deg = -90 + (360*percent/totaltime);
            pieElement.css('background-image',
                'linear-gradient('+deg+'deg, transparent 50%, lightgreen 50%),linear-gradient(90deg, green 50%, transparent 50%)'
            );
        }
    }
    var count = parseInt(timeElement.text());
    finalCounter = setInterval(function () {
        count-= 0.01;
        var show = Math.round( count * 10 ) / 10;
        show = count.toFixed(1);
        if(show==0 || show < 0 ) {
            var ctArr = ["animation1080","animation1440","animation1800","animation2160"];
            var tArr = ["animation900","animation1260","animation1620","animation1980"];
            if(winner == 0) {
                var item = ctArr[Math.floor(Math.random()*ctArr.length)]
            } else {
                var item = tArr[Math.floor(Math.random()*tArr.length)]
            }
            clearInterval(finalCounter);
            $('<div class="coinWrapper"><div class="coinZoomer"><div id="coin" class="'+item+'"><div class="front"></div><div class="back"></div></div></div></div>').insertBefore(pieElement);
            pieElement.remove();
            startCoinflipZoom(coinflipId,100,"up");
            setTimeout(markCoinflipWinner,3500,coinflipId,player2site,winner);
        }else {
            timeElement.html(show);
            update(count);
        }
    }, 10);
}

var intervalTest;

//TODO MAYBE IMPLEMENT IN ABOVE FUNCTION TO MAKE CLEANER
function startFinalViewCountdown(coinflipId,player2site,winner) {
    clearInterval(intervalTest);
    console.log("in final countdown");
    console.log(coinflipId);
    var timeElement = $("#view-coinflip-popup").find( ".time" );
    var pieElement = $("#view-coinflip-popup").find( ".pie" );
    var totaltime = 10;
    function update(percent){
        percent = totaltime - percent;
        var deg;
        if(percent<(totaltime/2)){
            deg = 90 + (360*percent/totaltime);
            pieElement.css('background-image',
                'linear-gradient('+deg+'deg, transparent 50%, green 50%),linear-gradient(90deg, green 50%, transparent 50%)'
            );
        } else if(percent>=(totaltime/2)){
            deg = -90 + (360*percent/totaltime);
            pieElement.css('background-image',
                'linear-gradient('+deg+'deg, transparent 50%, lightgreen 50%),linear-gradient(90deg, green 50%, transparent 50%)'
            );
        }
    }
    var count = parseInt(timeElement.text());
    if(count <= -3) {
        if (winner == 0) {
            var coinSite = "front";
        } else {
            var coinSite = "back";
        }
        $('<div class="coinWrapper"><div class="coinZoomer"><div id="coin"><div class="'+coinSite+'"></div><div class="back"></div></div></div></div>').insertBefore(pieElement);
        pieElement.remove();
        markViewCoinflipWinner(coinflipId,player2site,winner);
        //setTimeout(markViewCoinflipWinner, 3500, coinflipId, player2site, winner);
    } else {
        intervalTest = setInterval(function () {
            count -= 0.01;
            var show = Math.round(count * 10) / 10;
            show = count.toFixed(1);
            if (show == 0 || show < 0) {
                var ctArr = ["animation1080", "animation1440", "animation1800", "animation2160"];
                var tArr = ["animation900", "animation1260", "animation1620", "animation1980"];
                if (winner == 0) {
                    var item = ctArr[Math.floor(Math.random() * ctArr.length)]
                } else {
                    var item = tArr[Math.floor(Math.random() * tArr.length)]
                }
                clearInterval(intervalTest);
                $('<div class="coinWrapper"><div class="coinZoomer"><div id="coin" class="' + item + '"><div class="front"></div><div class="back"></div></div></div></div>').insertBefore(pieElement);
                pieElement.remove();
                startViewCoinflipZoom(coinflipId, 100, "up");
                setTimeout(markViewCoinflipWinner, 3500, coinflipId, player2site, winner);
            } else {
                timeElement.html(show);
                update(count);
            }
        }, 10);
    }
}

function markCoinflipWinner(coinflipId,player2site,winner) {
    var coinflipContainerElement = $("[data-cid="+coinflipId+"]");
    console.log("winna")
    console.log(winner)
    console.log("playa2")
    console.log(player2site)
    if(player2site == winner) {
        coinflipContainerElement.find("[data-value-total]").next().css("filter","drop-shadow(0px 0px 15px green)");
        coinflipContainerElement.find("[data-value-total]").prev().css("filter","drop-shadow(0px 0px 15px red)");
        coinflipContainerElement.find(".activity-left-cont").css("transition-duration","200ms");
        coinflipContainerElement.find(".activity-left-cont").css("opacity","0.2");

        var textHolder = coinflipContainerElement.find("[data-value-player2]").html();
        coinflipContainerElement.find("[data-value-player2]").html('<span style="color:green">Winner!  </span>'+textHolder);
    } else {
        coinflipContainerElement.find("[data-value-total]").next().css("filter","drop-shadow(0px 0px 15px red)");
        coinflipContainerElement.find("[data-value-total]").prev().css("filter","drop-shadow(0px 0px 15px green)");
        coinflipContainerElement.find(".activity-right-cont").css("transition-duration","200ms");
        coinflipContainerElement.find(".activity-right-cont").css("opacity","0.2");

        var textHolder = coinflipContainerElement.find("[data-value-player1]").html();
        coinflipContainerElement.find("[data-value-player1]").html(textHolder+"<span style='color:green'>  Winner!</span>");
    }
    setTimeout(deleteCoinflip,1000*60,coinflipId);
}

function markViewCoinflipWinner(coinflipId,player2site,winner) {
    var coinflipViewContainerElement = $("#view-coinflip-popup");
    console.log("winna")
    console.log(winner)
    console.log("playa2")
    console.log(player2site)
    var newArr = JSON.parse(localStorage.getItem("frontendCoinflipData"));
    var hashPerc = newArr[coinflipId]["hashPerc"]/*
    coinflipViewContainerElement.find(".coinWrapper").append('<br><br><p>Percentage: '+hashPerc+'</p>');*/
    $('<br><br><p>Percentage: '+hashPerc+'</p>').insertAfter(coinflipViewContainerElement.find(".coinWrapper"));
    //MARKING START
    var winningSite = coinflipViewContainerElement.find(".ct-player");
    var losingSite = coinflipViewContainerElement.find(".t-player");
    //TODO PROBLEM HERE IS THAT IT NEVER GETS IN HERE FOR THE REASON THAT WINNER ISNT ALWAYS == 1
    //TODO SHOULD HAVE BEEN FIXED BUT CODE CAN BE WRITTEN SOOOOOOOO MUCH CLEANER
    if(winner == 1) {
        winningSite = coinflipViewContainerElement.find(".t-player");
        losingSite = coinflipViewContainerElement.find(".ct-player");
        if(player2site == 1) {
            var losingInfo = coinflipViewContainerElement.find(".t-player-info");
            var losingItemsHolder = coinflipViewContainerElement.find(".itemsP1");
            var winningInfo = coinflipViewContainerElement.find(".ct-player-info");
            var winningItemsHolder = coinflipViewContainerElement.find(".itemsP2");
        } else {
            var losingInfo = coinflipViewContainerElement.find(".ct-player-info");
            var losingItemsHolder = coinflipViewContainerElement.find(".itemsP2");
            var winningInfo = coinflipViewContainerElement.find(".t-player-info");
            var winningItemsHolder = coinflipViewContainerElement.find(".itemsP1");
        }
    } else {
        winningSite = coinflipViewContainerElement.find(".ct-player");
        losingSite = coinflipViewContainerElement.find(".t-player");
        if(player2site == 0) {
            var losingInfo = coinflipViewContainerElement.find(".t-player-info");
            var losingItemsHolder = coinflipViewContainerElement.find(".itemsP1");
            var winningInfo = coinflipViewContainerElement.find(".ct-player-info");
            var winningItemsHolder = coinflipViewContainerElement.find(".itemsP2");
        } else {
            var losingInfo = coinflipViewContainerElement.find(".ct-player-info");
            var losingItemsHolder = coinflipViewContainerElement.find(".itemsP2");
            var winningInfo = coinflipViewContainerElement.find(".t-player-info");
            var winningItemsHolder = coinflipViewContainerElement.find(".itemsP1");
        }
    }


    winningSite.css("filter","drop-shadow(0px 0px 6px lightgreen)");
    winningInfo.css("filter","drop-shadow(0px 0px 3px lightgreen)");
    winningItemsHolder.css("filter","drop-shadow(0px 0px 3px lightgreen)");
    losingSite.css("opacity","0.2");
    losingInfo.css("opacity","0.2")
    losingItemsHolder.css("opacity","0.2")
    //MARKING END
    //TODO DO CSS MARKING OFF THE WINNER <- VIEW TEMPLATE
}

function startCoinflipZoom(coinflipId,zoomPerc,zoomStatus) {

	/*var zoomPerc = 100;
	 var zoomStatus = "up";*/

    if(zoomPerc >= 130) {
        zoomStatus = "down";
    } else if (zoomPerc <= 100 && zoomStatus == "down") {
        return;
    }
    if(zoomStatus == "up") {
        zoomPerc += 0.2;
    } else {
        zoomPerc -= 0.2;
    }

    $("[data-cid="+coinflipId+"]").find(".coinZoomer").css('zoom', zoomPerc+'%');

    setTimeout(startCoinflipZoom,10,coinflipId,zoomPerc,zoomStatus);
}

function startViewCoinflipZoom(coinflipId,zoomPerc,zoomStatus) {

	/*var zoomPerc = 100;
	 var zoomStatus = "up";*/

    if(zoomPerc >= 130) {
        zoomStatus = "down";
    } else if (zoomPerc <= 100 && zoomStatus == "down") {
        return;
    }
    if(zoomStatus == "up") {
        zoomPerc += 0.2;
    } else {
        zoomPerc -= 0.2;
    }

    $("#view-coinflip-popup").find(".coinZoomer").css('zoom', zoomPerc+'%');

    setTimeout(startViewCoinflipZoom,10,coinflipId,zoomPerc,zoomStatus);
}

function insertNewCoinflip (coinflipValue, content,frontendCFArr,coinflipId) {

    //TODO do tests here !!
    console.log(frontendCFArr)
    var frontendCoinflipData = JSON.parse(localStorage.getItem("frontendCoinflipData"));
    frontendCoinflipData[String(coinflipId)] = frontendCFArr;
    localStorage.setItem("frontendCoinflipData", JSON.stringify(frontendCoinflipData));

    buildAndShowView(coinflipId);

    if ( $( ".noCoinflipContainer" ).length ) {

        $( ".noCoinflipContainer" ).remove();
        $(".activity-cont").append(content);
    } else {
        $(".activity-block").each(function (index) {
            if ($(this).find("[data-value-player1]").attr("data-value-player1") < coinflipValue) {
                $(content).insertBefore($(this));
                return false;
            }
            if (index == $(".activity-block").length - 1) {
                $(content).insertAfter($(this));
            }
        });
    }


}

function deleteCoinflip(coinflipId) {

    //TODO do tests here !!
    var frontendCoinflipData = JSON.parse(localStorage.getItem("frontendCoinflipData"));
    delete frontendCoinflipData[coinflipId];
    localStorage.setItem("frontendCoinflipData", JSON.stringify(frontendCoinflipData));

    var removeValue = $("[data-cid="+coinflipId+"]").find("[data-value-total]").attr("data-value-total");
    var removeItems = $("[data-cid="+coinflipId+"]").find(".item-pic-thumb").length;

    if($("[data-cid="+coinflipId+"]").find("[data-player1-extraItems]").length) {
        removeItems += parseInt($("[data-cid="+coinflipId+"]").find("[data-player1-extraItems]").attr("data-player1-extraItems"));
    }
    if($("[data-cid="+coinflipId+"]").find("[data-player2-extraItems]").length) {
        removeItems += parseInt($("[data-cid="+coinflipId+"]").find("[data-player2-extraItems]").attr("data-player2-extraItems"));
    }

    var oldValue = parseFloat($("#totalAmount").html())
    $("#totalAmount").html((oldValue - removeValue).toFixed(2));
    oldValue = parseInt($("#totalItems").html())
    $("#totalItems").html(oldValue - removeItems);
    oldValue = parseInt($("#totalGames").html())
    $("#totalGames").html(--oldValue);

    $("[data-cid="+coinflipId+"]").remove();

    if ( $( ".activity-block" ).length ) {
    } else {
        $(".activity-cont").append("<div class='noCoinflipContainer'><span class='noCoinflipMessage'>Currently there are no open Coinflips!</span></div>")
    }
}

/*function insertJoinAttempt (coinflipId,content) {
	console.log("got insert join attemp with ")
	console.log(coinflipId)
	console.log(content)
    $("[data-cid="+coinflipId+"]").find(".joinCoinflipButton").remove();
    var coinflipContainerElement = $("[data-cid="+coinflipId+"]");
    var insertElement = coinflipContainerElement.find(".activity-center-cont");
    $(content).insertAfter(insertElement);
    startCountdownTimerJoinAttempt(coinflipId);
}*/

function deleteJoinAttempt (coinflipId) {

    //TODO do tests here !!
    var frontendCoinflipData = JSON.parse(localStorage.getItem("frontendCoinflipData"));
    delete frontendCoinflipData[coinflipId]["p2"];
    localStorage.setItem("frontendCoinflipData", JSON.stringify(frontendCoinflipData));

    buildAndShowView(coinflipId);

    var pieElement = $("[data-cid="+coinflipId+"]").find( ".pie" );
    //TODO FIND A WAY TO FIX THE -1,2,3,4,5... count bug and start again from 100 after 1 reset
    $("[data-cid="+coinflipId+"]").find( ".time" ).html(100);

    var timeDataTag = $("[data-cid="+coinflipId+"]").find( "[data-leftTime]" );
    timeDataTag.attr("data-leftTime",100)

    pieElement.css("visibility","hidden");
    $("[data-cid="+coinflipId+"]").find(".activity-right-cont").remove();
    var insertAfterElement = $("[data-cid="+coinflipId+"]").find(".view-popup-button");
/*
    $('<div class="btn btn-primary join-popup-button" data-effect="mfp-zoom-in">Join</div>').insertBefore(insertAfterElement);
*/
    $('<a class="btn btn-primary join-popup-button" data-effect="mfp-move-vertical">Join</a>').insertBefore(insertAfterElement);
}

//Winner 0 for ct / 1 for t, ChosenSite 0 for ct / 1 for t
function insertAcceptedOfferContent (coinflipId,value,chosenSite,winner,content,time,player2arr,player2itemarr,hashPerc) {

    //TODO do tests here
    if(player2arr !== undefined && player2arr !== null && player2itemarr !== undefined && player2itemarr !== null) {
        var frontendCoinflipData = JSON.parse(localStorage.getItem("frontendCoinflipData"));
        frontendCoinflipData[coinflipId]["p2"] = player2arr;
        frontendCoinflipData[coinflipId]["p2items"] = player2itemarr;
        frontendCoinflipData[coinflipId]["hashPerc"] = hashPerc;
        localStorage.setItem("frontendCoinflipData", JSON.stringify(frontendCoinflipData));
    }

    //TODO BIG PROBLEM HERE IS THAT IF WE RELOAD THE PAGE AND THE DATA GETS DRAWN FROM THE SERVER AND NOT VIA SOCKETS THIS FUNCTION IS PROB NEVER CALLED
    //TODO BUT MAYBE IT IS CALLED IM NOT 100% SURE ABOUT THIS
    var frontendCoinflipData2 = JSON.parse(localStorage.getItem("frontendCoinflipData"));
    frontendCoinflipData2[coinflipId]["winner"] = winner;
    frontendCoinflipData2[coinflipId]["time"] = time;
    frontendCoinflipData2[coinflipId]["date"] = new Date();
    frontendCoinflipData2[coinflipId]["chosenSite"] = chosenSite;
    localStorage.setItem("frontendCoinflipData", JSON.stringify(frontendCoinflipData2));

    buildAndShowView(coinflipId);
    //insertAcceptedViewOfferContent(coinflipId,chosenSite,time,winner)

    //TODO IF I ASK MYSELF WHAT I DID HERE IS JUST COPY ALL AND DID THE SAME FOR THE VIEW POPUP

    //GET COINFLIP CONTAINTER
    var coinflipContainerElement = $("[data-cid="+coinflipId+"]");

    //STOP TIMER
    var pieElement = coinflipContainerElement.find( ".pie" );
    pieElement.css("visibility","hidden");

    //SWAP TIMER WITH JOINER COIN
    chosenSite++;
    $('<img src="images/mlogo'+chosenSite+'.png" alt="" class="img-responsive player2coin hidden-xs">').insertBefore(pieElement);
    pieElement.remove();

    //INSERT TIMER AFTER COIN
    $('<br><div class="pie degree"><div class="circeOverlay"></div><span class="block"></span><span class="time">'+time+'</span></div>').insertAfter(coinflipContainerElement.find(".player2coin"));
    pieElement = coinflipContainerElement.find( ".pie" );
    pieElement.css("visibility","visible");

    //SET TOTAL VALUE
    if(time == 10) {
        var player1value = parseFloat(coinflipContainerElement.find("[data-value-player1]").attr("data-value-player1"));
        console.log(player1value);
        coinflipContainerElement.find("[data-value-total]").html("$" + (player1value + value));
        coinflipContainerElement.find("[data-value-total]").attr("data-value-total", player1value + value);
    }
    //DELETE PREVIOUS CONTENT
    if(time == 10) {
        coinflipContainerElement.find(".activity-right-cont").remove();
    }

    //INSERT JOINER CONTENT
    if(time == 10) {
        var insertElement = coinflipContainerElement.find(".activity-center-cont");
        $(content).insertAfter(insertElement);
    }

    //START TIMER
    startFinalCountdown(coinflipId,--chosenSite,winner);
}

//Winner 0 for ct / 1 for t, ChosenSite 0 for ct / 1 for t
function insertAcceptedViewOfferContent (coinflipId,chosenSite,time,winner) {

    //TODO IF I ASK MYSELF WHAT I DID HERE IS JUST COPY ALL AND DID THE SAME FOR THE VIEW POPUP
    //GET COINFLIP CONTAINTER
    var coinflipViewElement = $("#view-coinflip-popup");

    //STOP TIMER
    var pieViewElement = coinflipViewElement.find( ".pie" );
    pieViewElement.css("visibility","hidden");

    //SWAP TIMER WITH JOINER COIN
    chosenSite++;
    //$('<img src="images/mlogo'+chosenSite+'.png" alt="" class="img-responsive player2coin hidden-xs">').insertBefore(pieViewElement);
    pieViewElement.remove();

    //INSERT TIMER AFTER COIN
    //$('<br><div class="pie degree"><div class="circeOverlay"></div><span class="block"></span><span class="time">'+time+'</span></div>').insertAfter(coinflipViewElement.find(".view-coinflip"));
    coinflipViewElement.find(".view-coinflip").append('<br><div class="pie degree"><div class="circeOverlay"></div><span class="block"></span><span class="time">'+time+'</span></div>')
    pieViewElement = coinflipViewElement.find( ".pie" );
    pieViewElement.css("visibility","visible");

    //START TIMER
    startFinalViewCountdown(coinflipId,--chosenSite,winner);
}

/* END COINFLIP CONTENT UPDATES ****************************************************************************************************************************************************/




//COINFLIP JOIN ITEM SELECTION

$(document).on("click","#create_chosensite_ct",function() {
    console.log("click on ct");
    if($(this).attr("data-selected-site") == "false") {
        $(this).attr("data-selected-site","true");
        $("#create_chosensite_t").attr("data-selected-site","false");
    }
})

$(document).on("click","#create_chosensite_t",function() {
    console.log("click on t");
    if($(this).attr("data-selected-site") == "false") {
        $(this).attr("data-selected-site","true");
        $("#create_chosensite_ct").attr("data-selected-site","false");
    }
})

var clickLimiter = {};

$(document).on("click",".popup-item-contentHolder",function() {

    var assetId = $(this).parent().attr("data-asset");
    if(clickLimiter[assetId] === undefined || clickLimiter[assetId] == null || clickLimiter[assetId] == false) {
        clickLimiter[assetId] = true;
        setTimeout(function (assetId) {
            clickLimiter[assetId] = false;
        },1700, assetId)
        var treshhold = parseFloat($(this).closest('.coinflip-popup').find("[data-treshhold]").attr("data-treshhold"));
        var lowEndTrashhold = ((treshhold / 100) * 90).toFixed(2);
        var highEndTrashhold = ((treshhold / 100) * 110).toFixed(2);
        var defizit = parseFloat($(this).closest('.coinflip-popup').find("[data-join-defizit]").attr("data-join-defizit"));
        var defizitCreate = parseFloat($(this).closest('.coinflip-popup').find("[data-create-value]").attr("data-create-value"));

        var attr = $(this).attr('data-selected');
        var itemAmount = parseInt($(this).closest('.coinflip-popup').find('.totalItemSelector').html());
        if (typeof attr !== typeof undefined && attr !== false) {
            if ($(this).attr("data-selected") == "false" && itemAmount < 10) {
                $(this).attr("data-selected", "true");

                if ($(this).closest('.coinflip-popup').attr("id") == "create-coinflip-popup") {
                    var newValue2 = defizitCreate + parseFloat($(this).parent().attr("data-item-value"));
                    $(this).closest('.coinflip-popup').find("[data-create-value]").attr("data-create-value", newValue2)
                    $(this).closest('.coinflip-popup').find("[data-create-value]").html("$" + newValue2.toFixed(2))
                } else {
                    var newValue = defizit + parseFloat($(this).parent().attr("data-item-value"));
                    $(this).closest('.coinflip-popup').find("[data-join-defizit]").attr("data-join-defizit", newValue.toFixed(2))
                }

                if (newValue >= lowEndTrashhold && newValue <= highEndTrashhold) {
                    $(this).closest('.coinflip-popup').find("[data-join-defizit]").html("<span style='color: green'>$" + newValue.toFixed(2));
                } else {

                    if (newValue < lowEndTrashhold) {
                        $(this).closest('.coinflip-popup').find("[data-join-defizit]").html("<span style='color: red'>-$" + (lowEndTrashhold - newValue).toFixed(2));
                    } else {
                        $(this).closest('.coinflip-popup').find("[data-join-defizit]").html("<span style='color: red'>+$" + (newValue - highEndTrashhold).toFixed(2));
                    }
                }

                $(this).closest('.coinflip-popup').find('.totalItemSelector').html(++itemAmount);
                $(this).parent().children().each(function () {
                    $(this).css("opacity", "0.2");
                });
                $(this).css("border", "3px solid greenyellow");
                $(this).append('<svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/><path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg>');
            } else {
                $(this).attr("data-selected", "false");
                if ($(this).closest('.coinflip-popup').attr("id") == "create-coinflip-popup") {
                    var newValue2 = defizitCreate - parseFloat($(this).parent().attr("data-item-value"));
                    $(this).closest('.coinflip-popup').find("[data-create-value]").attr("data-create-value", newValue2)
                    $(this).closest('.coinflip-popup').find("[data-create-value]").html("$" + newValue2.toFixed(2))
                } else {
                    var newValue = defizit - parseFloat($(this).parent().attr("data-item-value"));
                    $(this).closest('.coinflip-popup').find("[data-join-defizit]").attr("data-join-defizit", newValue.toFixed(2))
                }

                if(newValue == 0) {
                    $(this).closest('.coinflip-popup').find("[data-join-defizit]").html("<span>$" + newValue.toFixed(2));
                } else if (newValue >= lowEndTrashhold && newValue <= highEndTrashhold) {
                    $(this).closest('.coinflip-popup').find("[data-join-defizit]").html("<span style='color: green'>$" + newValue.toFixed(2));
                } else {

                    if (newValue < lowEndTrashhold) {
                        $(this).closest('.coinflip-popup').find("[data-join-defizit]").html("<span style='color: red'>-$" + (lowEndTrashhold - newValue).toFixed(2));
                    } else {
                        $(this).closest('.coinflip-popup').find("[data-join-defizit]").html("<span style='color: red'>+$" + (newValue - highEndTrashhold).toFixed(2));
                    }
                }

                $(this).closest('.coinflip-popup').find('.totalItemSelector').html(--itemAmount);
                $(this).find(".checkmark").remove();
                $(this).append('<svg class="checkmark2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><circle class="checkmark__circle2" cx="26" cy="26" r="25" fill="none" /><path class="checkmark__check" fill="none" d="M16 16 36 36 M36 16 16 36" /></svg>');
                $(this).css("border", "3px solid #FF0000");
                setTimeout(function (htmlElement) {
                    htmlElement.css("border", "3px solid #396467");
                    htmlElement.parent().children().each(function () {
                        htmlElement.css("opacity", "");
                    });
                    htmlElement.find(".img-responsive").css("opacity", "1");
                    htmlElement.find(".item-price").css("opacity", "1");
                    htmlElement.find(".item-desc").css("opacity", "1");
                    htmlElement.css("outline", "");
                    htmlElement.find(".checkmark2").remove();
                }, 1500, $(this))
            }
        } else {
            if (itemAmount < 10) {
                $(this).attr("data-selected", "true");
                if ($(this).closest('.coinflip-popup').attr("id") == "create-coinflip-popup") {
                    var newValue2 = defizitCreate + parseFloat($(this).parent().attr("data-item-value"));
                    $(this).closest('.coinflip-popup').find("[data-create-value]").attr("data-create-value", newValue2)
                    $(this).closest('.coinflip-popup').find("[data-create-value]").html("$" + newValue2.toFixed(2))
                } else {
                    var newValue = defizit + parseFloat($(this).parent().attr("data-item-value"));
                    $(this).closest('.coinflip-popup').find("[data-join-defizit]").attr("data-join-defizit", newValue.toFixed(2))
                }
                if (newValue >= lowEndTrashhold && newValue <= highEndTrashhold) {
                    $(this).closest('.coinflip-popup').find("[data-join-defizit]").html("<span style='color: green'>$" + newValue.toFixed(2));
                } else {

                    if (newValue < lowEndTrashhold) {
                        $(this).closest('.coinflip-popup').find("[data-join-defizit]").html("<span style='color: red'>-$" + (lowEndTrashhold - newValue).toFixed(2));
                    } else {
                        $(this).closest('.coinflip-popup').find("[data-join-defizit]").html("<span style='color: red'>+$" + (newValue - highEndTrashhold).toFixed(2));
                    }

                }

                $(this).closest('.coinflip-popup').find('.totalItemSelector').html(++itemAmount);
                $(this).parent().children().each(function () {
                    $(this).css("opacity", "0.2");
                });
                $(this).css("border", "3px solid greenyellow");
                $(this).append('<svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/><path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg>');
            }
        }
    }
});



$(document).on("click",".view-popup-button",function () {



    var coinflipId = parseInt($(this).closest(".activity-block").attr("data-cid"));

    buildAndShowView(coinflipId);

    $.magnificPopup.open({
        items: {
            src: '#view-coinflip-popup',
            type:'inline',
        },
        removalDelay: 500, //delay removal by X to allow out-animation
        callbacks: {
            beforeOpen: function() {
                //this.st.mainClass = this.st.el.attr('data-effect');
            }
        },
        midClick: true
    })

})


function buildAndShowView(coinflipId) {

/*
    var coinflipId = parseInt($(this).closest(".activity-block").attr("data-cid"));
*/
    var newArr = JSON.parse(localStorage.getItem("frontendCoinflipData"));

    console.log(newArr)

    var p1 = newArr[coinflipId]["p1"];
    var p1items = newArr[coinflipId]["p1items"];
    var p2 = newArr[coinflipId]["p2"];
    var p2items = newArr[coinflipId]["p2items"];
    var pieElementSource = $("[data-cid="+coinflipId+"]").find(".pie");

    var isP2 = true;
    if(p2 === undefined) {
        isP2 = false;
    } else if(p2["name"] === undefined || p2["name"] == null) {
        isP2 = false;
    }

    var p1perc = (50).toFixed(2);

    if(isP2 && p2items !== undefined && p2items !== null) {

        p1perc = ((p1["value"] / (p1["value"] + p2["value"])) * 100).toFixed(2)
        var p2perc = (100 - p1perc).toFixed(2)
        var p2itemlenght = Object.keys(p2items).length;
    } else {
        var p2perc = "";
        var p2itemlenght = ""
    }

    if(p1["site"] == 0) {
        var StringSitePlayer1 = 'ct-player';
        var StringSitePlayer2 = 't-player';
    } else {
        var StringSitePlayer1 = 't-player';
        var StringSitePlayer2 = 'ct-player';
    }

    var StringNamePlayer1 =  '<p class="viewTemplateName"><a href="'+p1["url"]+'" target="_blank">'+p1["name"]+'</a></p>';
    var StringProfilePicturePlayer1 =  '<a href="'+p1["url"]+'" target="_blank"><img src="'+p1["image"].split(".jpg")[0]+'_full.jpg" alt="" class="img-responsive viewPopupPlayerPicture"></a>';
    var StringValuePlayer1 = '<p class="pull-left">$'+p1["value"].toFixed(2)+'</p>'

    if(isP2) {
        var StringNamePlayer2 =  '<p class="viewTemplateName"><a href="'+p2["url"]+'" target="_blank">'+p2["name"]+'</a></p>';
        var StringProfilePicturePlayer2 = '<a href="'+p2["url"]+'" target="_blank"><img src="' + p2["image"].split(".jpg")[0] + '_full.jpg" alt="" class="img-responsive viewPopupPlayerPicture"></a>';
        if(p2["value"] !== undefined && p2["value"] !== null) {
            var StringValuePlayer2 = '<p class="pull-right">$' + p2["value"].toFixed(2) + '</p>'
        }
    }

    var viewTemplatePlayerOverview = '<div class="row nm player-info">'+
        '<div class="col-xs-3 '+StringSitePlayer1+'">'+
        StringNamePlayer1+
        StringProfilePicturePlayer1+
        StringValuePlayer1+
        '</div>'+
        '<div class="col-xs-4 col-xs-offset-1 view-coinflip">'+
       /* pieElementSource.clone()+*/
/*        '<img src="images/coin-t.png" alt="" class="img-responsive t-img">'+*/
        '<div class="col-xs-3 col-xs-offset-1 np">'+
        /*        '<p>Hash: /</p>'+
                '<p>Percentage: /</p>'+
                '<p>Secret: /</p>'+*/
        '</div>'+
        '</div>';
    if(isP2) {
        viewTemplatePlayerOverview += '<div class="col-xs-3 col-xs-offset-1 '+StringSitePlayer2+'">'+
            StringNamePlayer2+
            StringProfilePicturePlayer2;
        if(p2items !== undefined && p2items !== null) {
            viewTemplatePlayerOverview += StringValuePlayer2;
        }
        viewTemplatePlayerOverview += '</div>';
    }
    viewTemplatePlayerOverview += '</div>'

    var viewTemplatePlayerStats =
        '<div class="row nm player-bet-info">'+
        '<div class="col-xs-6 t-player-info">'+
        '<p class="pull-left">'+Object.keys(p1items).length+(Object.keys(p1items).length == 1 ? " Item" : " Items")+'</p>'+
        '<p class="pull-right win-percentage">'+p1perc+'%</p>'+
        '</div>'+
        '<div class="col-xs-6 ct-player-info">'+
        '<p class="pull-right">'+p2itemlenght+(p2itemlenght == 1 ? " Item" : " Items")+'</p>'+
        '<p class="pull-left win-percentage">'+p2perc+'%</p>'+
        '</div>'+
        '</div>'

    var viewTemplateItems = "";

    $.each(p1items, function(index, value) {

        var itemText = "";
        var itemName = value["hashname"]
        if(itemName.includes("|")) {
            if(itemName.includes("StatTrak")) {
                itemText += '<p class="item-name">StatTrak™</p>';
                itemText += '<p class="item-name">'+itemName.split("™")[1].split("(")[0]+'</p>';
            } else {
                itemText += '<p class="item-name">'+itemName.split("(")[0]+'</p>';
            }
            itemText += '<p class="item-condition">'+itemName.split("|")[1].split("(")[1].split(")")[0]+'</p>';
        } else {
            itemText += '<p class="item-name">'+itemName+'</p>';
        }
        itemText += '<p class="item-price">$'+value["val"].toFixed(2)+'</p>';

        viewTemplateItems +=
            '<div class="row nm player-bet-items">'+
            '<div class="col-xs-6 bet-items-cont np itemsP1">'+
            '<div class="col-md-6 bet-item-info">'+
            itemText+
            '</div>'+
            '<div class="col-md-6 bet-item-pic">'+
            '<img class="img-responsive" src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+value["iconurl"]+'/300fx250f" alt=""/>'+
            '</div>'+
            '</div>'

        //TODO HERE LOAD THE ITEMS OF P2 DYNAMIC
        if(isP2 && p2items !== undefined && p2items !== null && p2items[index] !== undefined && p2items[index] !== null) {

            var itemText2 = "";
            //TODO I GUESS THIS WILL ALWAYS DO the p2items , for the amount of p1 items, example : user 1 has 9 items, will think user 2  has 9 aswell -> error
            //TODO SHOULD BE FIXED WITH THE ABOVE IF CHECK FOR P2ITEMS WITH THE INDEX
            var itemName2 = p2items[index]["hashname"]
            if(itemName2.includes("|")) {
                if(itemName2.includes("StatTrak")) {
                    itemText2 += '<p class="item-name">StatTrak™</p>';
                    itemText2 += '<p class="item-name">'+itemName2.split("™")[1].split("(")[0]+'</p>';
                } else {
                    itemText2 += '<p class="item-name">'+itemName2.split("(")[0]+'</p>';
                }
                itemText2 += '<p class="item-condition">'+itemName2.split("|")[1].split("(")[1].split(")")[0]+'</p>';
            } else {
                itemText2 += '<p class="item-name">'+itemName2+'</p>';
            }
            itemText2 += '<p class="item-price">$'+p2items[index]["val"].toFixed(2)+'</p>';

            viewTemplateItems +=
                '<div class="col-xs-6 bet-items-cont np itemsP2">' +
                '<div class="col-md-6 bet-item-info">' +
                itemText2+
                '</div>' +
                '<div class="col-md-6 bet-item-pic">' +
                '<img class="img-responsive" src="https://steamcommunity-a.akamaihd.net/economy/image/class/578080/'+p2items[index]["iconurl"]+'/300fx250f" alt=""/>'+
                '</div>' +
                '</div>' +
                '</div>'
        } else {
            viewTemplateItems +=
                '</div>'
        }

    })

    var completeViewTemplate = viewTemplatePlayerOverview+viewTemplatePlayerStats+viewTemplateItems;
    $("#view-coinflip-popup").html(completeViewTemplate);
    //pieElementSource.clone().appendTo("#view-coinflip-popup")
    $("#view-coinflip-popup").find(".view-coinflip").append(pieElementSource.clone())
    if(isP2 && (p2items === undefined || p2items == null)) {
        startViewCountdownTimerJoinAttempt();
    } else if(p2items !== undefined && p2items !== null) {

        console.log("im in da last one where i wanna be")

        console.log(newArr)
        //TODO MAKE THAT SHIET INDEPENDET lulu
        //insertAcceptedViewOfferContent(coinflipId,newArr["chosenSite"],newArr["time"],newArr["winner"])
        //insertAcceptedViewOfferContent(coinflipId,0,10,0)
        var timeDiff = new Date() - new Date(newArr[coinflipId]["date"]);
        var time = (newArr[coinflipId]["time"]*1000 - timeDiff) / 1000;
        var winner = parseInt(newArr[coinflipId]["winner"]);
        var chosenSite = parseInt(newArr[coinflipId]["chosenSite"]);

        insertAcceptedViewOfferContent(coinflipId,chosenSite,time,winner)

    } else {
        $("#view-coinflip-popup").find(".pie").css("visibility","hidden")
/*
        var date1 = new Date();
        setTimeout(function (date) {
            var date2 = new Date();
            console.log(date2-date1)
        },1000,date1)
*/
    }
}


// Magni Popup

$('.create-coinflip-button').magnificPopup({
    items: {
        src: '#create-coinflip-popup',
        type:'inline',
    },
    removalDelay: 500, //delay removal by X to allow out-animation
    callbacks: {
        beforeOpen: function() {
            this.st.mainClass = this.st.el.attr('data-effect');
        }
    },
    midClick: true // allow mid-click fire
});


//Load View Template

function loadViewTemplate(coinflipArray) {

    var viewTemplatePlayerOverview = loadViewTemplateUserOverview(coinflipArray);

    console.log("display now")
    $("#view-coinflip-popup").html(viewTemplatePlayerOverview);
}

function loadViewTemplateUserOverview(coinflipArray) {

    var StringProfilePicturePlayer1 =  '<img src="'+coinflipArray["steamAvatar"]+'" alt="" class="img-responsive">';
    var StringValuePlayer1 = '<p class="pull-left">$'+parseFloat(coinflipArray["value"]).toFixed(2)+'</p>'


    var StringProfilePicturePlayer2 =  '<img src="'+coinflipArray["steamAvatarv2"]+'" alt="" class="img-responsive">';
    var StringValuePlayer2 = '<p class="pull-left">$'+(parseFloat(coinflipArray["valuev2"])*100).toFixed(2)+'</p>'

    var viewTemplatePlayerOverview = '<div class="row nm player-info">'+
        '<div class="col-xs-4 t-player">'+
        StringProfilePicturePlayer1+
        StringValuePlayer1+
        '</div>'+
        '<div class="col-xs-4 view-coinflip">'+
        '<img src="images/coin-t.png" alt="" class="img-responsive t-img">'+
        '<div class="col-xs-12 np">'+
        '<p>Hash: /</p>'+
        '<p>Percentage: /</p>'+
        '<p>Secret: /</p>'+
        '</div>'+
        '</div>'+
        '<div class="col-xs-4 ct-player">'+
        StringProfilePicturePlayer2+
        StringValuePlayer2+
        '</div>'+
        '</div>'

    console.log(viewTemplatePlayerOverview)
    return viewTemplatePlayerOverview;

}
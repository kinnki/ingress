// ==UserScript==
// @name         Export mission to IngressMosaik
// @version      0.1.0.20171126.00
// @description  Export ingress mission to ingressmosaik.com.
// @author       kanaxi
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @include        https://ingress.com/intel*
// @include        http://ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @match          https://ingress.com/intel*
// @match          http://ingress.com/intel*
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      ingressmosaik.com
// @connect      https://ingressmosaik.com/ajax/ing/addMission.php
// ==/UserScript==

var portals = [];
var missions = [];
unsafeWindow.IngressMosaik = {};
unsafeWindow.IngressMosaik.log = function (s) {
    $('#mosaik_export_result').append(s + '<br />');
};

unsafeWindow.IngressMosaik.processMissions = function() {
	if (missions.length > 0) {
		var mission = missions[0];
		missions = missions.slice(1);
		IngressMosaik.log('>>> Processing mission: ' + mission[1] + ' (' + missions.length + ' left)');
		unsafeWindow.postAjax('getMissionDetails', {
			guid: mission[0]
		}, function(result) {
			IngressMosaik.log('>>>> Updating ingressmosaik...');
            postdata = {
					detail : result.result,
					user : $('#name span').text(),
					fra : $('#name span').attr("class"),
					v : "0.1.0.20180213.00"};
            $.ajax({
                    dataType: 'json',
                    async: false,
                    contentType: 'application/json',
                    type: 'POST',
                    data: JSON.stringify(postdata),
                    crossDomain: true,
                    url : 'https://ingressmosaik.com/api/addMissions.php',
                    success: function (response) {
                      if(response[1]["0"]=="update"){
                          IngressMosaik.log('<img src='+ result.result[10] + ' height="42" width="42"><span>'+ result.result[1] + ' <h2> Update</h2></span>');
                      }else if(response[1]["0"]=="insert"){
                          IngressMosaik.log('<img src='+ result.result[10] + ' height="42" width="42"><span>'+ result.result[1] + ' <h2> New</h2></span>');
                      }else{
                          IngressMosaik.log('<img src='+ result.result[10] + ' height="42" width="42"><span>'+ result.result[1] + ' <h2> Failed</h2></span>');
                      }
                      IngressMosaik.log(JSON.stringify(response));
                      //IngressMosaik.log(response[0]);
                      //IngressMosaik.log(response[1]["0"]);
                    },
                    error : function(err){
                        IngressMosaik.log(err);
                        alert('Fail! Pleas try this Mission in the next Plugin update');
                    }
                });
			IngressMosaik.processMissions();
		}, function() {
			IngressMosaik.log('Error loading mission data');
			IngressMosaik.processMissions();
		});
	} else {
		IngressMosaik.log('>>> Next portal...');
		IngressMosaik.processPortals();
	}
};

unsafeWindow.IngressMosaik.processPortals = function () {
    if (portals.length > 0) {
        var po = portals[0];
        portals = portals.slice(1);
        IngressMosaik.log('>> Processing portal: ' + po.options.data.title + ' (' + portals.length + ' left)');
		unsafeWindow.postAjax('getTopMissionsForPortal', {
			guid: po.options.guid,
		}, function(data) {
			if (data.result) {
				missions = data.result;
			}
			IngressMosaik.processMissions();
		}, function(error) {
			IngressMosaik.log('Error loading portal missions');
			IngressMosaik.processPortals();
		});

    } else {
        IngressMosaik.log('> Done!');
    }
};
unsafeWindow.IngressMosaik.start = function () {
    dialog({
        html: '<div id="mosaik_export_result" style="height: 600px;">',
        width: '500px',
    }).dialog('option', 'buttons', {
        'Abort': function () {
            portals = [];
            missions = [];
            $(this).dialog('close');
        },
    });
    var bounds = unsafeWindow.map.getBounds();
    for (var guid in unsafeWindow.portals) {
        var po = unsafeWindow.portals[guid];
        if (po.options && po.options.data) {
            if (po.options.data.latE6 > bounds.getSouth() * 1E6 && po.options.data.latE6 < bounds.getNorth() * 1E6 && po.options.data.lngE6 > bounds.getWest() * 1E6 && po.options.data.lngE6 < bounds.getEast() * 1E6 && (po.options.data.mission || po.options.data.mission50plus)) {
                portals.push(po);
            }
        }
    }
    IngressMosaik.log("> Found " + portals.length + " mission start portals in view!");
    IngressMosaik.processPortals();
};
var setup = function () {
    $('#toolbox').append('<a onclick="window.IngressMosaik.start();">IngressMosaik</a>');
};
setTimeout(setup, 3000);

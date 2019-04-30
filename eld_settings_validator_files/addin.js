geotab.addin.eldSettingsValidator = function(api, state) {
    var userList = [],
    vehicleList = [],
    vinsToDecode = [],
    vinResults = [],
    servers = "",
    database = "",
    refresh = document.getElementById("refresh"),
    userReport = document.getElementById("userReport"),
    vehicleReport = document.getElementById("vehicleReport"),
    helpButton = document.getElementById("toolTipHelp"),
    usersTab = document.getElementById("usersTab"),
    vehiclesTab = document.getElementById("vehiclesTab"),
    FMCSAOfficesTab = document.getElementById("FMCSAOfficesTab");
    usersMenu = document.getElementById("home"),
    vehiclesMenu = document.getElementById("menu1"),
    FMCSAOfficesMenu = document.getElementById("menu2");

    function getVinErrors() {
        let promise = new Promise(function(resolve, reject) {
                api.call("DecodeVins", {
                    "vins": vinsToDecode,
                }, function(results) {
                    results.forEach(function(item){
                        vinResults.push(item);
                    });
                    resolve(vinResults);
                });
            });
            return promise;
        }

    var vehicle = function() {
        api.call("Get", {
            "typeName": "Device",
			"search": {
				"fromDate": new Date().toISOString()
			}
        }, function(results) {
            results.forEach(function(item){
				if (item.vehicleIdentificationNumber != null) {
					vinsToDecode.push(item.vehicleIdentificationNumber);
				}
            });
            getVinErrors().then(function(success){
                for (var i = 0; i < results.length; i++) {
                    if (results[i].serialNumber !== "000-000-0000") {
                        var vinInfo = (results[i].vehicleIdentificationNumber && vinResults[i].error === "None") ? "yes" : "no";
                        var ratePlan = (results[i].devicePlans.length > 0 && results[i].devicePlans[0] !== "Base") ? "yes" : "no";
                        var licensePlateInfo = (results[i].licenseState && results[i].licensePlate) ? "yes" : "no";
                        //a null results[i].customFeatures means there are no custom changes, default is automatic
                        var autoHos = results[i].customFeatures ? results[i].customFeatures.autoHos : null;
                        switch (autoHos){
                            case null: //automatic
                                autoHos = "yes";
                                break;
                            case false: //off
                                autoHos = "no";
                                break;
                            case true: //on
                                autoHos = "yes";
                                break;
                            default:
                                autoHos = "no";
                        }
                        var nameVehicle = results[i].name || "no";
                        
                        var thisVehicle = [nameVehicle, vinInfo, licensePlateInfo, ratePlan, autoHos, results[i].id];
                        if ( thisVehicle.indexOf( "no" ) > -1 ) {
							vehicleList.push(thisVehicle);
						}
                    }
                }
                //for lexicographical order
                vehicleList = vehicleList.reverse();
                
                var table2 = document.getElementById("myTable2");

                if (!vehicleList.length && table2.rows.length < 2){
                    var tr = document.createElement("tr");
                    tr.style.textAlign = "center";
                    var td = document.createElement("td");
                    var txt = document.createTextNode("There are no vehicles with ELD settings issues.");

                    td.appendChild(document.createElement("br"));
                    td.appendChild(txt);
                    tr.appendChild(td);
                    table2.appendChild(tr);
                }
                
                for (row = 0; row < vehicleList.length; row++) {
                    tr = document.createElement('tr');
                    tr = table2.insertRow(1);
                    td = document.createElement('td');
                    div2 = document.createElement('div');
                    div2.className = "g-row checkmateListBuilderRow";
                    for (cell = 0; cell < 5; cell++) {
                        a = document.createElement('a');
                        a.className = "g-main xs-col activeElement sm-part-9 md-part-10";
                        div1 = document.createElement('div');
                        div1.className = "g-name";
                        
                        a.appendChild(div1);
                        
                        if (cell === 0){
                            div1.textContent = vehicleList[row][cell];
                            div1.style.display = "inline-block";
                        }
                        else{
                            var statusIcon = document.createElement("i");
                            statusIcon.classList.add("fas", "geotabPrimaryText");
                            statusIcon.classList.add(vehicleList[row][cell] === "yes" ? "fa-check" : "fa-times");
                            if (statusIcon.classList.contains("fa-times")) {
                                statusIcon.style.color = "red";
							}
							else {
								statusIcon.style.color = "green";
							}
                            statusIcon.style.fontSize = "25px";
                            div1.append(statusIcon);
                        }
                        div2.appendChild(a);
                    }
                    var createVehicleInfoClickHandler = function(arg) {
                        return function() {
                            //window.location.href = "https://" + servers + "/" + database + "/#device,id:" + arg;
                            window.open(("https://" + servers + "/" + database + "/#device,id:" + arg));
                        };
                    }
                    var id = vehicleList[row][5];
                    
                    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
					var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
					use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#info-circ');
					svg.setAttribute('class','svgIcon geotabButtonIcons informationButton');
					svg.appendChild(use);
					
                    var vehicleInfoButton = document.createElement('button');
                    vehicleInfoButton.className = "geotabButton emptyButton geotabButton-empty infoButton";
                    vehicleInfoButton.onclick = createVehicleInfoClickHandler(id);
                    
                    var div3 = document.createElement('div');
                    div3.className = "g-ctrl";
                    
                    vehicleInfoButton.appendChild(svg);
                    div3.appendChild(vehicleInfoButton);
                    div2.appendChild(div3);
                    td.appendChild(div2);
                    tr.appendChild(td);
                }
                refresh.disabled = false;
            }, function(error) {console.log("error");
        }); 
        }, function(e) {
            console.error("Failed:", e);
        });
    }
    
    var run = function() {
        
        api.call("Get", {
            "typeName": "User"
        }, function(result) {
            for (var i = 0; i < result.length; i++) {
                if (result[i].isDriver === true && new Date(result[i].activeTo) >= new Date()) {
                    var authorityInfo = (result[i].authorityName && result[i].authorityAddress) ? "yes" : "no";
                    var companyInfo = (result[i].companyName && result[i].companyAddress) ? "yes" : "no";
                    var licenseInfo = (result[i].licenseProvince && result[i].licenseNumber && result[i].licenseNumber !== "") ? "yes" : "no";
                    var nameInfo = (result[i].firstName.length > 2 && result[i].lastName.length > 2) ? "yes" : "no";
                    var carrierInfo = (result[i].carrierNumber && result[i].carrierNumber !== "") ? "yes" : "no";
                    var userNameInfo = result[i].name.length >= 4 ? result[i].name : "no";
                    
                    var thisUser = [userNameInfo, nameInfo, authorityInfo, companyInfo, carrierInfo, licenseInfo, result[i].id];
                    if ( thisUser.indexOf( "no" ) > -1 ) {
						userList.push(thisUser);
					}
                }
            }
            //for lexicographical order
            userList = userList.reverse();
            
            var table1 = document.getElementById("myTable");

            if (!userList.length && table1.rows.length < 2){
                var tr = document.createElement("tr");
                tr.style.textAlign = "center";
                var td = document.createElement("td");
                var txt = document.createTextNode("There are no users with ELD settings issues.");

                td.appendChild(document.createElement("br"));
                td.appendChild(txt);
                tr.appendChild(td);
                table1.appendChild(tr);
            }
            
            for (row = 0; row < userList.length; row++) {
                
                tr = document.createElement('tr');
                tr = table1.insertRow(1);
                
                td = document.createElement('td');
                div2 = document.createElement('div');
                div2.className = "g-row checkmateListBuilderRow";
                
                for (cell = 0; cell < 6; cell++) {
                    a = document.createElement('a');
                    a.className = "g-main xs-col activeElement sm-part-9 md-part-10";
                    div1 = document.createElement('div');
                    div1.className = "g-name";
                    
                    a.appendChild(div1);

                    if (cell === 0){
                        div1.textContent = userList[row][cell];
                        div1.style.display = "inline-block";
                    }
                    else{
                        var statusIcon = document.createElement("i");
                        statusIcon.classList.add("fas", "geotabPrimaryText");
                        statusIcon.classList.add(userList[row][cell] === "yes" ? "fa-check" : "fa-times");
                        if (statusIcon.classList.contains("fa-times")) {
                            statusIcon.style.color = "red";
						}
						else {
							statusIcon.style.color = "green";
						}
                        statusIcon.style.fontSize = "25px";
                        div1.append(statusIcon);
                    }
                    div2.appendChild(a);
                }
                
                var createUserInfoClickHandler = function(arg) {
                    return function() {
                        //window.location.href = "https://" + servers + "/" + database + "/#user,id:" + arg;
                        window.open(("https://" + servers + "/" + database + "/#user,id:" + arg));
                    };
                }
                
                var id = userList[row][6];
                
                var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
				var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
				use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#info-circ');
				svg.setAttribute('class','svgIcon geotabButtonIcons informationButton');
				svg.appendChild(use);
                
                var userInfoButton = document.createElement('button');
                userInfoButton.className = "geotabButton emptyButton geotabButton-empty infoButton";
                userInfoButton.onclick = createUserInfoClickHandler(id);
                
                var div3 = document.createElement('div');
                div3.className = "g-ctrl";
                
                userInfoButton.appendChild(svg);
                div3.appendChild(userInfoButton);
                div2.appendChild(div3);
                
                td.appendChild(div2);
                tr.appendChild(td);
            }
            
        }, function(e) {
            console.error("Failed:", e);
        });
        
        vehicle();
    }
    
    var empty = function() {
        var mytbl = document.getElementById("myTable");
        mytbl.getElementsByTagName("tbody")[0].innerHTML = mytbl.rows[0].innerHTML;
        
        var mytbl2 = document.getElementById("myTable2");
        mytbl2.getElementsByTagName("tbody")[0].innerHTML = mytbl2.rows[0].innerHTML;        
    }
    
    var toggleHelpText = function() {
        var toolTips = document.getElementById("usersToolTipDiv");
        $(toolTips).toggle();
        var toolTips = document.getElementById("vehiclesToolTipDiv");
        $(toolTips).toggle();
    }
    helpButton.addEventListener("click", function() {
        console.log(vehicleList.length);
        toggleHelpText();
    }, false);
    
    var makeActive = function(tabElement, menuElement){
        tabElement.classList.add("activeTab");
        menuElement.style.display = "block";
    }
    
    var makeInactive = function(tabElement, menuElement){
        tabElement.classList.remove("activeTab", "active");
        menuElement.style.display = "none";
    }
    
    usersTab.addEventListener("click", function() {
        makeActive(usersTab, usersMenu);
        makeInactive(vehiclesTab, vehiclesMenu);
        makeInactive(FMCSAOfficesTab, FMCSAOfficesMenu);
    }, false);
    
    vehiclesTab.addEventListener("click", function() {
        makeInactive(usersTab, usersMenu);
        makeActive(vehiclesTab, vehiclesMenu);
        makeInactive(FMCSAOfficesTab, FMCSAOfficesMenu);
    }, false);
    
    FMCSAOfficesTab.addEventListener("click", function() {
        makeInactive(usersTab, usersMenu);
        makeInactive(vehiclesTab, vehiclesMenu);
        makeActive(FMCSAOfficesTab, FMCSAOfficesMenu);
    }, false);
    
    refresh.addEventListener("click", function() {
        userList = [];
        vehicleList = [];
        var mytbl = document.getElementById("myTable");
        mytbl.getElementsByTagName("tbody")[0].innerHTML = mytbl.rows[0].innerHTML;
        
        var mytbl1 = document.getElementById("myTable2");
        mytbl1.getElementsByTagName("tbody")[0].innerHTML = mytbl1.rows[0].innerHTML;
        run();
        refresh.disabled = true;
    }, false);
    
    userReport.addEventListener("click", function() {
        var dict = {};
        var colArr = ["First Name","Last Name", "User Name", "Authority Name","Authority Address", "Home Terminal Name","Home Terminal Address","DOT Number","License Province","License Number","Hos Rule Set"];
        var JSONToCSVConvertor = function(JSONData, ReportTitle, ShowLabel) {
            //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
            var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
            
            var CSV = '';
            //Set Report title in first row or line
            
            CSV += ReportTitle + '\r\n\n';
            
            //This condition will generate the Label/Header
            if (ShowLabel) {
                var row = "";
                
                
                for (var index = 0; index < colArr.length; index++) {
                    row += colArr[index] + ',';
                }
                row = row.slice(0, -1);
                CSV += row + '\r\n';
            }
            
            //1st loop is to extract each row
            for (var i = 0; i < arrData.length; i++) {
                var row = "";
                //2nd loop will extract each column and convert it in string comma-seprated
                /* 			  	var colArr = ["dateTime", "serialNumber", "name","category"];
                */
                row += '"' + arrData[i].firstName + '",';
                row += '"' + arrData[i].lastName + '",';
                row += '"' + arrData[i].UserName + '",';
                row += '"' + arrData[i].authorityName + '",';
                row += '"' + arrData[i].authorityAddress + '",';
                row += '"' + arrData[i].companyName + '",';
                row += '"' + arrData[i].companyAddress + '",';
                row += '"' + arrData[i].DOT_Number + '",';
                row += '"' + arrData[i].licenseProvince + '",';
                row += '"' + arrData[i].licenseNumber + '",';
                row += '"' + arrData[i].hosRuleSet + '",';
                row.slice(0, 1);
                CSV += row + '\r\n';
            }
            
            
            if (CSV === '') {
                console.log("Invalid data");
                return;
            }
            
            //Generate a file name
            var fileName = "User_List";
            //this will remove the blank-spaces from the title and replace it with an underscore
            fileName += ReportTitle.replace(/ /g, "_");
            
            //Initialize file format you want csv or xls
            var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);
            
            // Now the little tricky part.
            // you can use either>> window.open(uri);
            // but this will not work in some browsers
            // or you will not get the correct file extension    
            
            //this trick will generate a temp <a /> tag
            var link = document.createElement("a");
            link.href = uri;
            
            //set the visibility hidden so it will not effect on your web-layout
            link.style = "visibility:hidden";
            link.download = fileName + ".csv";
            
            //this part will append the anchor tag and remove it after automatic click
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };
        
        var userIdList = [];
        for (var i = 0; i < userList.length; i++) {
            userIdList.push(["Get", { typeName: "User", search: { "id": userList[i][6] } }]);
        }
        
        api.multiCall(userIdList, function(result) {
            var usersList = [];
            
            if (result !== undefined && result.length > 0) {
                for (var i = 0; i < result.length; i++) {
                    if (result.length == 1) {
                        usersList.push({firstName:result[i].firstName,lastName:result[i].lastName,UserName:result[i].name,authorityName:result[i].authorityName,authorityAddress:result[i].authorityAddress,
                            companyName:result[i].companyName,companyAddress:result[i].companyAddress,DOT_Number:result[i].carrierNumber,licenseNumber:result[i].licenseNumber,licenseProvince:result[i].licenseProvince,hosRuleSet:result[i].hosRuleSet})							
                        } else {	
                            usersList.push({firstName:result[i][0].firstName,lastName:result[i][0].lastName,UserName:result[i][0].name,authorityName:result[i][0].authorityName,authorityAddress:result[i][0].authorityAddress,
                                companyName:result[i][0].companyName,companyAddress:result[i][0].companyAddress,DOT_Number:result[i][0].carrierNumber,licenseNumber:result[i][0].licenseNumber,licenseProvince:result[i][0].licenseProvince,hosRuleSet:result[i][0].hosRuleSet})	
                            }
                        }
                        
                        JSONToCSVConvertor(usersList, "User List", true);
                    }
                }, function(error) {
                    console.log(error);
                }); 
            }, false);
            
            vehicleReport.addEventListener("click", function() {
                var dict2 = {};
                var colArr2 = ["Vehicle Name","VIN", "License Plate", "Rate Plan","Automatic HOS Settings"];
                var JSONToCSVConvertor2 = function(JSONData, ReportTitle, ShowLabel) {
                    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
                    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
                    
                    var CSV = '';
                    //Set Report title in first row or line
                    
                    CSV += ReportTitle + '\r\n\n';
                    
                    //This condition will generate the Label/Header
                    if (ShowLabel) {
                        var row = "";
                        
                        for (var index = 0; index < colArr2.length; index++) {
                            row += colArr2[index] + ',';
                        }
                        row = row.slice(0, -1);
                        CSV += row + '\r\n';
                    }
                    
                    //1st loop is to extract each row
                    for (var i = 0; i < arrData.length; i++) {
                        var row = "";
                        row += '"' + arrData[i].name + '",';
                        row += '"' + arrData[i].vin + '",';
                        row += '"' + arrData[i].licensePlate + '",';
                        row += '"' + arrData[i].ratePlan + '",';
                        var autoSetting = arrData[i].automaticSetting;
                        switch (autoSetting){
                            case null: 
                                autoSetting = "Automatic";
                                break;
                            case false:
                                autoSetting = "Off";
                                break;
                            case true: 
                                autoSetting = "On";
                                break;
                            default:
                                autoSetting = "Unknown";
                        }
                        row += '"' + autoSetting + '",';
                        
                        row.slice(0, 1);
                        CSV += row + '\r\n';
                    }
                    
                    if (CSV === '') {
                        console.log("Invalid data");
                        return;
                    }
                    
                    //Generate a file name
                    var fileName = "User_List";
                    //this will remove the blank-spaces from the title and replace it with an underscore
                    fileName += ReportTitle.replace(/ /g, "_");
                    
                    //Initialize file format you want csv or xls
                    var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);
                    
                    // Now the little tricky part.
                    // you can use either>> window.open(uri);
                    // but this will not work in some browsers
                    // or you will not get the correct file extension    
                    
                    //this trick will generate a temp <a /> tag
                    var link = document.createElement("a");
                    link.href = uri;
                    
                    //set the visibility hidden so it will not effect on your web-layout
                    link.style = "visibility:hidden";
                    link.download = fileName + ".csv";
                    
                    //this part will append the anchor tag and remove it after automatic click
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                };
                var vehicleIdList = [];
                
                for (var i = 0; i < vehicleList.length; i++) {
                    vehicleIdList.push(["Get", { typeName: "Device", search: { "id": vehicleList[i][5] } }]);
                }
                
                api.multiCall(vehicleIdList, function(result) {
                    var vehicleList = [];
                    
                    if (result !== undefined && result.length > 0) {
                        for (var i = 0; i < result.length; i++) {
                            if (result.length == 1) {
                                vehicleList.push({
                                    name:result[i].name,
                                    vin:result[i].vehicleIdentificationNumber,
                                    licensePlate:result[i].licenseState+" "+ result[i].licensePlate,
                                    ratePlan:result[i].devicePlans[0],
                                    automaticSetting: result[i].customFeatures ? result[i].customFeatures.autoHos : null
                                });	
                            } else {
                                vehicleList.push({
                                    name:result[i][0].name,
                                    vin:result[i][0].vehicleIdentificationNumber,
                                    licensePlate:result[i][0].licenseState+" "+ result[i][0].licensePlate,
                                    ratePlan:result[i][0].devicePlans[0],
                                    automaticSetting: result[i][0].customFeatures ? result[i][0].customFeatures.autoHos : null
                                });
                            }
                        }
                        
                        JSONToCSVConvertor2(vehicleList, "Vehicle List", true);
                    }
                }, function(error) {
                    console.log(error);
                });
            }, false);
            
            return {
                initialize: function(api, state, initializeCallback) {
                    api.getSession(function(session, server) {
                        servers = server;
                        database = session.database;
                        var currentUser = session.userName;
                        api.call("Get", {
                            "typeName": "User",
                            "search": {
                                "name": currentUser
                            }
                        }, function(result) {
                            if (result.length === 0) {
                                throw "Unable to find currently logged on user."
                            }
                            initializeCallback();
                            refresh.disabled = true;
                        }, function(error) {
                            throw "Error while trying to load currently logged on user. " + error;
                        });
                    });
                },
                focus: function(api, state) {
                    run();
                },
                blur: function(api, state) {
                    userList = [];
                    vehicleList = [];
                    empty();
                }
            };
        };
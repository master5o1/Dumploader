function hide(id) {
    document.getElementById(id).style.visibility = 'hidden';
}

function checkUserName(displayed_username, changed_username) {
    changed_username = changed_username.replace(/[^A-Za-z0-9_]/g, '_');
    document.getElementById('change_username').value = changed_username;
    if (window.XMLHttpRequest) { xmlhttp=new XMLHttpRequest(); }
    else { xmlhttp=new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.open("GET", "/user/" + displayed_username + "/check_username?username=" + changed_username);
    xmlhttp.onreadystatechange = function() {//Call a function when the state changes.
        if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var result = JSON.parse(xmlhttp.responseText);
            if (result.allowed == true) {
                changeUserData(displayed_username, { username: displayed_username, new_username: changed_username }, function(result) {
                    if (result.success == true) {
                        var username_input = document.getElementById('change_username');
                        var displayName_input = document.getElementById('change_displayName');
                        var description_input = document.getElementById('change_description');
                        username_input.setAttribute('onblur', "checkUserName('" + changed_username + "', this.value)");
                        displayName_input.setAttribute('onblur', "changeDisplayName('" + changed_username + "', this.value)");
                        description_input.setAttribute('onblur', "changeDescription('" + changed_username + "', this.value)");
                        var username_input_error = document.getElementById('change_username_error');
                        username_input_error.style.visibility = "visible";
                        username_input_error.style.color = "green";
                        username_input_error.innerHTML = "&#x2713;";
                    } else {
                        var username_input_error = document.getElementById('change_username_error');
                        username_input_error.style.visibility = "visible";
                        username_input_error.style.color = "red";
                        username_input_error.innerHTML = "&times;";
                    }
                });
            } else {
                var username_input_error = document.getElementById('change_username_error');
                username_input_error.style.visibility = "visible";
                username_input_error.style.color = "red";
                username_input_error.innerHTML = "&times;";
            }
        }
    }
    xmlhttp.send();
}

function changeDisplayName(username, displayName) {
    changeUserData(username, { username: username, new_displayName: displayName }, function(result) {
        if (result.success == true) {
            var displayname_input_error = document.getElementById('change_displayName_error');
            displayname_input_error.style.visibility = "visible";
            displayname_input_error.style.color = "green";
            displayname_input_error.innerHTML = "&#x2713;";
        } else {
            var displayname_input_error = document.getElementById('change_displayName_error');
            displayname_input_error.style.visibility = "visible";
            displayname_input_error.style.color = "red";
            displayname_input_error.innerHTML = "&times;";
        }
    });
}

function changeDescription(username, description) {
    changeUserData(username, { username: username, new_description: description }, function(result) {
        if (result.success == true) {
            var description_input_error = document.getElementById('change_description_error');
            description_input_error.style.visibility = "visible";
            description_input_error.style.color = "green";
            description_input_error.innerHTML = "&#x2713;";
        } else {
            var description_input_error = document.getElementById('change_description_error');
            description_input_error.style.visibility = "visible";
            description_input_error.style.color = "red";
            description_input_error.innerHTML = "&times;";
        }
    });
}

function checksize(obj) {
    lines = obj.value.split('\n');
    obj.style.height = (1+lines.length) + 'em';
}
        
function changeUserData(username, data, callback) {
    var params = "changed_data=" + encodeURI(JSON.stringify(data));
    if (window.XMLHttpRequest) { xmlhttp=new XMLHttpRequest(); }
    else { xmlhttp=new ActiveXObject("Microsoft.XMLHTTP"); }
    xmlhttp.open("POST", "/user/" + username + "/edit", true);
    //Send the proper header information along with the request
    xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xmlhttp.onreadystatechange = function() {//Call a function when the state changes.
        if(xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            callback(JSON.parse(xmlhttp.responseText));
        }
    }
    xmlhttp.send(params);
}
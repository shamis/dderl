function update_user_information(user) {
    create_ws();
    $('#change-pswd-button').data("logged_in_user", user);
    $('#login-button').html('Log out ' + user);
}

function check_already_connected() {
    if(!window.opener || !window.opener.dderlState || !window.opener.dderlState.session ||
       !window.opener.$('#change-pswd-button').data("logged_in_user")) {
        loginAjax(null);
    } else {
        dderlState.session = window.opener.dderlState.session;
        dderlState.connectionSelected = window.opener.dderlState.connectionSelected;
        var user = window.opener.$('#change-pswd-button').data("logged_in_user");
        update_user_information(user);
        connect_dlg();
    }
}

function loginAjax(data) {
    ajaxCall(null, 'login', (data == null ? {} : data),
            'login', loginCb);
}

function loginCb(resp) {
    if (resp.hasOwnProperty('error')) {
        alert('Login falied : ' + resp.error);
        return null;
    } else if(resp.hasOwnProperty('pwdmd5')) {
        display({title  : "Login",
                 fields : [{type        : "text",
                            placeholder : "User",
                            val         : resp.pwdmd5.accountName},
                           {type        : "password",
                            placeholder : "Password",
                            val         : ""}]
        });
    } else if(resp.hasOwnProperty('smsott')) {
        display({title  : "Enter Token",
                 fields : [{type        : "label",
                            val         : "A token is send through SMS to "+resp.smsott.to+
                                          " for user "+resp.smsott.accountName+
                                          ". Please enter the token below"},
                           {type        : "text",
                            placeholder : "SMS Token",
                            val         : ""}]
        });
    } else if (resp.hasOwnProperty('accountName')) {
        update_user_information(resp.accountName);
        resetPingTimer();
        connect_dlg();
    } else {
        throw(resp);
        alert("Unexpected "+JSON.stringify(resp));
    }
}

function display(layout) {
    var dlg = $('<div title="'+layout.title+'" style="diaply:none">')
        .appendTo(document.body);
    var tab = $('<table border=0 width=100% cellpadding=0 cellspacing=0>')
        .appendTo(dlg);

    dlg.dialog({
        autoOpen: false,
        minHeight: 100,
        height: 'auto',
        width: 'auto',
        resizable: false,
        modal: false,
        position: { my: "left top", at: "left+50 top+20", of: "#main-body" },
        closeOnEscape: false,
        dialogClass: 'no-close',
        open: function(event, ui) {
            $(this).dialog("widget").appendTo("#main-body");
        },
        close: function() {
            $(this).dialog('destroy');
            $(this).remove();
        }
    });

    var focused = false;
    for(var fldIdx = 0; fldIdx < layout.fields.length; fldIdx++) {
        var td = $('<td valign=bottom>').appendTo($('<tr>').appendTo(tab));
        if(layout.fields[fldIdx].type == "label") {
            $('<span>').text(layout.fields[fldIdx].val).appendTo(td);
        } else if(layout.fields[fldIdx].type == "text") {
            var txt = $('<input type="text" placeholder="'+layout.fields[fldIdx].placeholder+
                        '" class="text ui-widget-content ui-corner-all"/>')
                            .val(layout.fields[fldIdx].val)
                            .keypress(function(e) {
                                if(e.which == 13) {
                                    inputEnter(layout);
                                    dlg.dialog("close");
                                }
                            })
                            .appendTo(td);
            layout.fields[fldIdx].elm = txt;
            if(!focused && layout.fields[fldIdx].val.length == 0) {
                focused = true;
                setTimeout(function() { txt.focus(); }, 10);
            }
       } else if(layout.fields[fldIdx].type == "password") {
            var pass = $('<input type="password" placeholder="'+layout.fields[fldIdx].placeholder+
                        '" class="text ui-widget-content ui-corner-all"/>')
                            .val(layout.fields[fldIdx].val)
                            .keypress(function(e) {
                                if(e.which == 13) {
                                    inputEnter(layout);
                                    dlg.dialog("close");
                                }
                            })
                            .appendTo(td);
            layout.fields[fldIdx].elm = pass;
            if(!focused) {
                focused = true;
                setTimeout(function() { pass.focus(); }, 10);
            }
        }
    }

    dlg.dialog("open")
       .dialog("widget")
       .draggable("option","containment","#main-body");
}

function inputEnter(layout) {
    var data = {};
    for(var fldIdx = 0; fldIdx < layout.fields.length; ++fldIdx) {
        if (layout.fields[fldIdx].hasOwnProperty('elm')) {
            layout.fields[fldIdx].val = layout.fields[fldIdx].elm.val();
        }
        if (layout.fields[fldIdx].type != "label") {
            if(layout.fields[fldIdx].type == "password") {
                data[layout.fields[fldIdx].placeholder] = md5Arr(layout.fields[fldIdx].val);
            } else {
                data[layout.fields[fldIdx].placeholder] = layout.fields[fldIdx].val;
            }
        }
    }
    loginAjax(data);
}

function logout() {

    if (!dderlState.session) {
        return;
    }

    var headers = new Object();

    if (dderlState.adapter != null) {
        headers['DDERL-Adapter'] = dderlState.adapter;
    }
    headers['DDERL-Session'] = (dderlState.session != null ? '' + dderlState.session : '');

    $.ajax({
        type: 'POST',
        url: 'app/logout',
        data: JSON.stringify({}),
        dataType: "JSON",
        contentType: "application/json; charset=utf-8",
        headers: headers,
        context: null,

        success: function(_data, textStatus, request) {
            console.log('Request logout Result ' + textStatus);
        },

        error: function (request, textStatus, errorThrown) {
            console.log('Request logout Error, status: ' + textStatus);
        }
    });
    process_logout();
}

function restart() {

    if (!dderlState.session) {
        return;
    }

    var headers = new Object();

    if (dderlState.adapter != null) {
        headers['DDERL-Adapter'] = dderlState.adapter;
    }
    headers['DDERL-Session'] = (dderlState.session != null ? '' + dderlState.session : '');

    $.ajax({
        type: 'POST',
        url: 'app/restart',
        data: JSON.stringify({}),
        dataType: "JSON",
        contentType: "application/json; charset=utf-8",
        headers: headers,
        context: null,

        success: function(_data, textStatus, request) {
            console.log('Request restart Result ' + textStatus);
            clearTimeout(dderlState.pingTimer);
        },

        error: function (request, textStatus, errorThrown) {
            console.log('Request restart Error, status: ' + textStatus);
        }
    });

    function checkRestartComplete(url) {
        $.ajax({
            type: 'GET',
            url: url,
            success: function(_data, textStatus, request) {
                console.log('Restart complete, status: ' + textStatus);
                process_logout();
            },
            error: function (request, textStatus, errorThrown) {
                console.log('Restarting... status: ' + textStatus);
                setTimeout(checkRestartComplete, 0, url);
            }
        });
    }
    setTimeout(checkRestartComplete, 0, window.location.href);
}


function process_logout() {
    dderlState.connection = null;
    dderlState.adapter = null;
    $(".ui-dialog-content").dialog('close');
    $('#dashboard-menu').empty();
    if (!dderlState.session) {
        return;
    }
    dderlState.session = null;
    resetPingTimer();

    $('#login-button').html('');
    $('#change-pswd-button').data("logged_in_user", "");
    $('#login-msg').html('Welcome guest');
    if(window.opener) {
        window.opener.process_logout();
    }
    if(children) {
        for(var i=0; i < children.length; ++i){
            if(!children[i].closed) {
                children[i].process_logout();
            }
        }
    }
    loginAjax(null);
}

function change_login_password(loggedInUser, shouldConnect)
{
    $('<div id="dialog-change-password" title="Change DDerl account password">' +
      '  <table border=0 width=100% height=85% cellpadding=0 cellspacing=0>' +
      '      <tr><td valign=center>User <b>'+loggedInUser+'</b></td></tr>' +
      '      <tr><td valign=bottom>' +
      '             <input type="password" id="old_password_login" placeholder="Old Password" class="text ui-widget-content ui-corner-all"/>' +
      '         </td></tr>' +
      '      <tr><td valign=bottom>' +
      '             <input type="password" id="password_change_login" placeholder="New Password" class="text ui-widget-content ui-corner-all"/>' +
      '         </td></tr>' +
      '      <tr><td valign=bottom>' +
      '             <input type="password" id="conf_password_login" placeholder="Confirm New Password" class="text ui-widget-content ui-corner-all"/>' +
      '         </td></tr>' +
      '  </table>' +
      '</div>').appendTo(document.body);
    $('#dialog-change-password').dialog({
        autoOpen: false,
        height: 200,
        width: 300,
        resizable: false,
        modal: false,
        open: function() {
            $(this).dialog("widget").appendTo("#main-body");
        },
        close: function() {
            $("#dialog-change-password").dialog('destroy');
            $("#dialog-change-password").remove();
        },
        buttons: {
            "Change Password": function() {
                if($('#conf_password_login').val() == $('#password_change_login').val()) {
                    var newPassJson = {
                        change_pswd: {
                            user  : loggedInUser,
                            password  : md5Arr($('#old_password_login').val()),
                            new_password  : md5Arr($('#password_change_login').val())
                        }};
                    ajaxCall(null,'login_change_pswd',newPassJson,'login_change_pswd', function(data) {
                        if(data == "ok") {
                            $("#dialog-change-password").dialog("close");
                            resetPingTimer();
                            if(shouldConnect) {
                                connect_dlg();
                            }
                        }
                        else {
                            alert('Change password falied : ' + data);
                        }
                    });
                }
                else alert("Confirm password missmatch!");
            },
            Cancel: function() {
                $(this).dialog("close");
            }
        }
    })
    .dialog("open")
    .dialog("widget").draggable("option","containment","#main-body");
}

function md5Arr(data) {
    var dataMd5 = md5(data);
    var dataArr = [];
    for(var i = 0; i < dataMd5.length; i += 2) {
        dataArr.push(parseInt(dataMd5.substring(i,i+2), 16));
    }
    return dataArr;
}

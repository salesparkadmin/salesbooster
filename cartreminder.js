const app_url = globalJavascript.webApi;
const xhr = new XMLHttpRequest();
let sound = null;
var setting = null;
var reminderTimer = null;
var pushReminderTimer = null;
const apiRoot = "https://"+Shopify.shop+"/apps/storefront/";
function transformToAssocArray(prmstr) {
    var params = {};
    var prmarr = prmstr.split("&");
    for (var i = 0; i < prmarr.length; i++) {
        var tmparr = prmarr[i].split("=");
        params[tmparr[0]] = tmparr[1];
    }
    return params;
}
function getQueryParameters() {
    var prmstr = window.location.search.substr(1);
    return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
}
function salesParkCartReminder() {
    this.init = function (callback, callbackArgs) {
        /*xhr.open("GET", app_url + "api/cart-reminder/settings/" + shop);
        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === 4 && this.status === 200) {
                const response = JSON.parse(this.response);
                if (response.status) {
                    notifyMe(response.data);
                    console.log(response)
                }
            }
        });
        xhr.send();*/
        setting = globalJavascript.globalSettingsAndData.carteminder;
        if (typeof callback == 'function') {
            callback.apply(this, callbackArgs);
        }
    }
    this.process = function() {
        loadSound(setting);
        var queryParametersArray = getQueryParameters();
        if(queryParametersArray.tryTitleBar == 'yes') {
            if(globalJavascript.globalSettingsAndData.carteminder.is_title_bar_active !== null && globalJavascript.globalSettingsAndData.carteminder.is_title_bar_active == '1') {
                if(globalJavascript.globalSettingsAndData.carteminder.title_bar_options.favicon_image !== null) {
                    var faviconUrl = globalJavascript.globalSettingsAndData.carteminder.title_bar_options.favicon_image;
                    if(faviconUrl != null) {
                        faviconUrl = faviconUrl.replace("public","storage");
                        faviconUrl = apiRoot+faviconUrl;
                        console.log("fav icon = "+faviconUrl);
                        (function() {
                            var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
                            link.type = 'image/x-icon';
                            link.rel = 'shortcut icon';
                            link.href = faviconUrl;
                            document.getElementsByTagName('head')[0].appendChild(link);
                            console.log("Changed FavIcon");
                        })();
                    }
                }
                if(globalJavascript.globalSettingsAndData.carteminder.title_bar_options.title !== null) {
                    titleScroller(globalJavascript.globalSettingsAndData.carteminder.title_bar_options.title);
                }
            }
        }
    }
    function loadSound(setting) {
        if (setting.options.sound) {
            sound = new Audio(setting.options.sound_file);
            sound.type = 'audio/mp3';
        }
    }

    window.addEventListener('message', function(event) {
        if(event.data == "salesparkcartcreated") {
            // Do actions after cart creation
            localStorage.setItem('salesparkcartcreated','yes');
            // Do actions after cart creation
        }
        // console.log(event.data);    // Message from page script
        // console.log(event.origin);
    }, false);

    function titleScroller(titleText) {
        window.document.title = titleText;
        setTimeout(function () {
            titleScroller(titleText.substr(1) + titleText.substr(0, 1));
        }, 500);
    }

    window.onblur = function() {
        //Tab Switched
        if(localStorage.getItem('salesparkcartcreated') !== null) {
            if(localStorage.getItem('salesparkcartcreated') == 'yes') {
                console.log("tab Switched");
                var interval = 5000;
                var pushInterval = 5000;
                if(globalJavascript.globalSettingsAndData.carteminder.title_bar_options.delay_interval !== null) {
                    interval = globalJavascript.globalSettingsAndData.carteminder.title_bar_options.delay_interval*1000;
                }

                if(globalJavascript.globalSettingsAndData.carteminder.reminder_time !== null) {
                    pushInterval = globalJavascript.globalSettingsAndData.carteminder.reminder_time*1000;
                }
                console.log("interval = "+interval);
                console.log("pushinterval = "+pushInterval);
                if(globalJavascript.globalSettingsAndData.carteminder.is_title_bar_active !== null && globalJavascript.globalSettingsAndData.carteminder.is_title_bar_active == '1') {
                    reminderTimer = setInterval(function () {
                        if(globalJavascript.globalSettingsAndData.carteminder.title_bar_options.favicon_image !== null) {
                            var faviconUrl = globalJavascript.globalSettingsAndData.carteminder.title_bar_options.favicon_image;
                            if(faviconUrl != null) {
                                faviconUrl = faviconUrl.replace("public","storage");
                                faviconUrl = apiRoot+faviconUrl;
                                console.log("fav icon = "+faviconUrl);
                                (function() {
                                    var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
                                    link.type = 'image/x-icon';
                                    link.rel = 'shortcut icon';
                                    link.href = faviconUrl;
                                    document.getElementsByTagName('head')[0].appendChild(link);
                                    console.log("Changed FavIcon");
                                })();
                            }
                        }
                        if(globalJavascript.globalSettingsAndData.carteminder.title_bar_options.title !== null) {
                            titleScroller(globalJavascript.globalSettingsAndData.carteminder.title_bar_options.title);
                        }
                        clearInterval(reminderTimer);
                    },interval);
                }
                if(globalJavascript.globalSettingsAndData.carteminder.is_active !== null && globalJavascript.globalSettingsAndData.carteminder.is_active == '1') {
                    if(localStorage.getItem('localNotifPermission') !== null || Push.Permission.has()) {
                        if(localStorage.getItem('localNotifPermission') == 'yes' || Push.Permission.has()) {
                            localStorage.setItem('localNotifPermission','yes');
                            pushReminderTimer = setInterval(function () {
                                const pushOptions = {
                                    body: setting.body,
                                    icon: setting.options.icon,
                                    silent: setting.options.default_sound,
                                    image: setting.options.image,
                                    badge: setting.options.badge,
                                    vibrate: [200, 100, 200],
                                    actions: [{
                                        action: setting.options.action,
                                        title: setting.options.action_title,
                                        icon: setting.options.action_icon
                                    }],
                                    dir: setting.options.dir,
                                    requireInteraction: true,
                                    data: window.location.href,
                                };
                                if (!setting.options.actions) {
                                    delete pushOptions.actions
                                }
                                if (setting.options.default_sound) {
                                    delete pushOptions.vibrate
                                }
                                Push.create(setting.title, pushOptions);
                                clearInterval(pushReminderTimer);
                            },pushInterval);
                        }
                    }
                }

            }
        }
    }

    $(window).focus(function() {
        //Tab Focused
        console.log("tab Active");
        clearInterval(reminderTimer);
        clearInterval(pushReminderTimer);
    });


}
var salesParkCartReminder = new salesParkCartReminder();
salesParkCartReminder.init(salesParkCartReminder.process, [0]);



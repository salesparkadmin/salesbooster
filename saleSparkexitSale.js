function getNow() {
    var d = new Date(),
        hrs = d.getHours(),
        min = d.getMinutes(),
        sec = d.getSeconds();

    if (hrs < 10) { hrs = "0" + hrs; }
    if (min < 10) { min = "0" + min; }
    if (sec < 10) { sec = "0" + sec; }

    return hrs + ":" + min + ":" + sec;
}

function exitPopup() {
    var settings = globalJavascript.globalSettingsAndData.exitpopup;
    var Notifsettings = {};
    Notifsettings.body = settings.notif_body;
    Notifsettings.options = settings.notif_options;
    Notifsettings.title = settings.notif_title;
    Notifsettings.is_active = settings.notif_is_active;
    Notifsettings.reminder_time = settings.notif_reminder_time;
    const xhr = new XMLHttpRequest();
    this.init = function (callback, callbackArgs) {
        //For purging the data
        //Donleeve.purgeBlocks(Date.now());
        //For purging the data
        Donleeve.onTrigger = function (e) {
            //console.log("<strong>" + getNow() + "</strong> " + e.type, logsTriggers);
        };

        Donleeve.onStorageBlock = function (str, time) {
            console.log("Blocked on <strong>" + str + "</strong> URLs for <strong>" + time + "</strong> milliseconds.");
        };

        Donleeve.init({
            bindDelay: 2000,
            ignoreFlagBlocking: true
        }, function (e) {
            salesparkswal.fire({
                title: '',
                html: settings.popup_body,
                //input: 'email',
                //inputPlaceholder: addToCartPopUpData.email_placeholder,
                inputAutoTrim: true,
                //confirmButtonText:  "<span style='font-size:" + buttonFontSize +";color:"+ buttonColor +";font-style:"+ buttonFontStyle +";font-weight:" + buttonFontWeight +"'>"+addToCartPopUpData.button_text+"</span>",
                //confirmButtonColor: addToCartPopUpData.button_background_color,
                showConfirmButton: false,
                showCancelButton: false,
                cancelButtonText: 'No, cancel!',
                showCloseButton: false,
                //imageUrl: webApi+'/'+bannerImage,
                //imageWidth: 100,
                allowOutsideClick: true,
                //footer: 'Footer text',
                //reverseButtons: true,
                //type: 'success'

            }).then(function (result) {
            });

            if(Notifsettings.is_active == '1') {
                scheduleBrowserNotif();
            }

            console.log("Exit intent activated by <strong>" + e.type + "</strong>!");

            if (!Donleeve.options.ignoreFlagBlocking) {
                console.log("On this page, an option is set that prevents multiple exit intents to appear on one page load. Refresh the page to see how Storage Blocking works. The block will last " + Math.ceil(Donleeve.options.storageBlockingMinutes * 60) + " seconds.");
            }
        });

        ActiveTimeout.set(function () {
            console.log("Events bound!");
        }, function (left) {
            if (left < 0) left = 0;
        }, Donleeve.options.bindDelay);
        if (typeof callback == 'function') {
            callback.apply(this, callbackArgs);
        }
    }

    this.process = function (callback, callbackArgs) {
        if(Notifsettings.is_active == '1') {
            //notifyMe(Notifsettings);
        }
    }

    function loadSound(setting) {
        if (setting.options.sound) {
            sound = new Audio(setting.options.sound_file);
            sound.type = 'audio/mp3';
        }
    }

    /**
     * checks if Push notification are supported by your browser
     */
    function isPushNotificationSupported() {
        return "serviceWorker" in navigator && "PushManager" in window;
    }

    /**
     * asks user consent to receive push notifications and returns the response of the user, one of granted, default, denied
     */
    function PushNotificationsPermission() {
        return Notification.requestPermission();
    }

    /**
     *
     */
    function registerServiceWorker() {
        navigator.serviceWorker.register(globalJavascript.scriptBase + "sw.js").then(function (swReg) {
        }).catch(function (error) {
            console.error('Service Worker Error', error);
        });
    }

    /**
     * shows a notification
     */
    function sendNotification(setting) {
        const options = {
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
            requireInteraction: setting.options.requireInteraction,
            data: window.location.href,
        };
        if (!setting.options.actions) {
            delete options.actions
        }
        if (setting.options.default_sound) {
            delete options.vibrate
        }
        if (Notification.permission === 'granted') {
            loadSound(setting);
            navigator.serviceWorker.getRegistrations().then(function (registration) {
                registration[0].showNotification(setting.title, options).then(async function () {
                    if (setting.options.sound) {
                        await sound.play();
                    }
                });
            }, function (err) {
            });
        } else {
            //askedPermission();
        }
    }

    function askedPermission() {
        const pushNotificationSupported = isPushNotificationSupported();
        if (pushNotificationSupported) {
            registerServiceWorker();
            PushNotificationsPermission().then(function (consent) {
                if (consent === 'granted') {
                    console.log("Granted");
                } else {
                    console.log("Not granted");
                }
            });
        } else {
            console.log("Not supported");
            //you can do something
        }
    }

    function scheduleBrowserNotif() {
        console.log('Schedule Notif Now');
        let setTimeOut = null;
        setTimeOut = setTimeout(function () {
            sendNotification(Notifsettings)
        }, Notifsettings.reminder_time * 1000);
    }

    function notifyMe(setting) {
        askedPermission();
        /*document.addEventListener("visibilitychange", function () {
            if (document.hidden) {
                setTimeOut = setTimeout(function () {
                    sendNotification(setting)
                }, setting.reminder_time * 1000)
            } else {
                if (setTimeOut) {
                    clearTimeout(setTimeOut)
                }
            }
        });*/
    }
}


var exitPopup = new exitPopup();
exitPopup.init(exitPopup.process, [0]);

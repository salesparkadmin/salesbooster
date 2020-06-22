// SaleSpark 2020 - Version 1.0
// Changed on 6-JUNE-2020
var isAjax = 0;
var isCartLoading = 0;
var isCheckForCall = true;
var cartHash_cached = 0;
var cartHash_live = 0;

function getQueryParameters() {
    var prmstr = window.location.search.substr(1);
    return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
}

function transformToAssocArray(prmstr) {
    var params = {};
    var prmarr = prmstr.split("&");
    for (var i = 0; i < prmarr.length; i++) {
        var tmparr = prmarr[i].split("=");
        params[tmparr[0]] = tmparr[1];
    }
    return params;
}

function scriptInjection(src, callback) {
    var script = document.createElement('script');
    script.type = "text/javascript";

    script.src = src;
    if (typeof callback == 'function') {
        script.addEventListener('load', callback);
    }
    document.getElementsByTagName('head')[0].appendChild(script);
}

function cssFileInjection(href) {
    var link = document.createElement("link");
    link.href = href;
    link.type = "text/css";
    link.rel = "stylesheet";
    document.getElementsByTagName("head")[0].appendChild(link);
}

function requestPermission() {
    Push.Permission.request(function () {
        localStorage.setItem('localNotifPermission', 'yes');
    }, function () {
        localStorage.setItem('localNotifPermission', 'no');
    });
}

function saleSparkCartTrigger() {

    var customer = {};
    var store = {};
    var webApi = "https://" + window.location.hostname + "/apps/storefront/api/storefront/";
    this.init = function (callback, callbackArgs) {
        scriptInjection("https://code.jquery.com/jquery-3.4.1.min.js", function () {
            scriptInjection("https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.2/rollups/md5.js", function () {
                window.salesparkJquery = jQuery.noConflict(true);
                scriptInjection("https://use.fontawesome.com/e0a385ecbc.js");
                addJqueryEventListeners();
                if (typeof callback == 'function') {
                    callback.apply(this, callbackArgs);
                }
            });
        })
    }


    function getCart(callback) {
        salesparkJquery.ajax({
            url: '/cart.js',
            type: 'GET',
            dataType: 'JSON',
            success: function (response) {
                callback(response);
            },
            error: function (error) {
                callback(error.responseText);
            }
        });
    }

    function clearCart(callback) {
        salesparkJquery.ajax({
            url: '/cart/clear.js',
            type: 'GET',
            dataType: 'JSON',
            success: function (response) {
                callback(response);
            },
            error: function (error) {
                callback(error.responseText);
            }
        });
    }

    function getCartFromCommandCenter(id, callback) {
        salesparkJquery.ajax({
            url: webApi + "/api/cart/store-front/" + id,
            data: {
                store: store
            },
            success: function (response) {
                if (!response.records.hasOwnProperty('cart')) {
                    window.location = '/cart';
                } else {
                    callback(response.records.cart);
                }
            }
        });
    }

    function addProductToCart(product, callback) {

        salesparkJquery.ajax({
            url: "/cart/add.js",
            type: 'POST',
            dataType: 'JSON',
            data: product,
            success: function (response) {
                callback(response);
                console.log('------------- Recreation of cart started -------------');
                console.log(response);
                console.log('------------- Recreation of cart end     -------------');
            }
        });
    }


    function updateCartTokenOnCommandCenter(newToken, cart, callback) {

        var data = {
            newToken: newToken,
            store: store
        };

        salesparkJquery.ajax({
            url: webApi + "/api/cart/store-front/update-token/" + cart.id,
            type: 'POST',
            dataType: 'json',
            data: data,
            success: function (response) {
                callback(response);
                console.log('------------- Update cart token started -------------');
                console.log(response);
                console.log('------------- Update cart token end     -------------');
                callback(response);
            }
        });

    }


    function isOnlyRecoverCart(cart) {
        if (isCartLoading == 1) {
            return;
        }
        var queryParametersArray = getQueryParameters();
        console.log("Parameter Now: " + queryParametersArray.recover_care_cart);
        if (typeof queryParametersArray != "undefined" && typeof queryParametersArray.recover_care_cart != 'undefined' && queryParametersArray.recover_care_cart != '') {
            isCartLoading = 1;
            salesparkJquery('body').html('Loading....');
            getCartFromCommandCenter(queryParametersArray.recover_care_cart, function (recoveryCart) {
                recoverCart(cart, recoveryCart);
            });
            return true;
        }
        return false;
    }

    function recoverCart(cart, recoveryCart) {

        clearCart(function (clearCartResponse) {

            var productsProcessedCount = 0;

            var isProductAddedToCart = undefined;

            if (!recoveryCart.items || !recoveryCart.items.length > 0) {
                window.location = '/cart';
            }


            if (recoveryCart.items.length > 0) {
                var isProductAddedToCartInterval = setInterval(function () {
                    if (isProductAddedToCart == undefined) {
                        isProductAddedToCart = false;
                        addProductToCart(recoveryCart.items[productsProcessedCount], function (addProductToCartResponse) {
                            productsProcessedCount++;
                            isProductAddedToCart = true;
                        });

                    } else if (isProductAddedToCart == true) {
                        isProductAddedToCart = undefined;
                    }

                    if (productsProcessedCount == recoveryCart.items.length) { //all products added to cart now stop that loop
                        console.log("done ..... " + productsProcessedCount);
                        clearInterval(isProductAddedToCartInterval);
                    }


                }, 100);
            }


            var isAllProductsProcessedInterval = setInterval(function () {

                if (productsProcessedCount == recoveryCart.items.length) {
                    console.log("Products processed: " + productsProcessedCount);
                    clearInterval(isAllProductsProcessedInterval);
                    if (cart != undefined) {
                        getCart(function (cart) {
                            console.log("Cart Now: " + cart);
                            var newToken = cart.token;
                            var oldToken = recoveryCart.token;

                            updateCartTokenOnCommandCenter(newToken, recoveryCart, function (updateCartTokenOnCommandCenterResponse) {
                                window.location = '/cart';
                            });
                        });
                    } else {

                        location.reload();
                        return false;
                    }
                }
            }, 100);

        });

    };


    function show_scroll_popup(addToCartexitPopUpData) {
        if (addToCartexitPopUpData.length > 0) {
            for (var ipc = 0; ipc < addToCartexitPopUpData.length; ipc++) {
                if (addToCartexitPopUpData[ipc].triggerjson.timer_trigger_page == "on") {
                    if (addToCartexitPopUpData[ipc].triggerjson.timer_trigger_page_value != null) {
                        var page_value = parseInt(addToCartexitPopUpData[ipc].triggerjson.timer_trigger_page_value);
                    } else {
                        var page_value = 10;
                    }
                    var s = $(window).scrollTop(),
                        d = $(document).height(),
                        c = $(window).height();
                    var scrollPercent = (s / (d - c)) * 100;
                    if (scrollPercent > page_value) {
                        checkAddToCartexitPopup(addToCartexitPopUpData[ipc], 4);
                    }
                }
            }
        }
    }

    var cartdata;
    this.process = function (isCapturedByPopup, callBack, isCapturedByMagnet, impressionBy = '') {

        getCart(function (cart) {

            window.postMessage("salesparkcartcreated", "https://" + window.location.hostname);
            if (isCapturedByPopup == 1) {
                cart.is_email_captured_by_popup = 1;
                impressionBy = 'EMAILCOLLECTOR';
            }

            if (isCapturedByMagnet == 1) {
                cart.is_captured_by_email_magnet = 1;
                impressionBy = 'EMAILMAGNET';
            }
            var data = {
                customer: customer,
                cart: cart,
                store: Shopify.shop,
                productPagePath: getProductPagePath(),
                currentPageUrlWithoutQueryParameters: getCurrentPageUrlWithoutQueryParameters(),
                impressionBy: impressionBy
            };
            cartdata = cart;


            if (isOnlyRecoverCart(cart)) {
                console.log('Recovering cart...')
            } else {
                console.log("Update cart on command center");
                try {
                    cartHash_cached = String(window.localStorage.getItem('cartHash_cached'));
                    cartHash_live = CryptoJS.MD5(JSON.stringify(cart)).toString();
                    console.log(cartHash_cached + " ---- " + cartHash_live);
                } catch (e) {
                }

                jQuery(document).on('mouseleave', function (e) {
                    if (typeof globalJavascript.globalSettingsAndData.exitpopup != 'undefined') {
                        if (e.clientY < 0) { // less than 60px is close enough to the top
                            var addToCartexitPopUpData = globalJavascript.globalSettingsAndData.exitpopup;
                            if (addToCartexitPopUpData.length > 0) {
                                for (var ipc = 0; ipc < addToCartexitPopUpData.length; ipc++) {
                                    if (addToCartexitPopUpData[ipc].triggerjson.timer_trigger_exit == "on") {
                                        checkAddToCartexitPopup(addToCartexitPopUpData[ipc], 3);
                                    }
                                }
                            }
                        }
                    }
                });

                window.addEventListener("scroll", function (event) {
                    if (typeof globalJavascript.globalSettingsAndData.exitpopup != 'undefined') {
                        show_scroll_popup(globalJavascript.globalSettingsAndData.exitpopup);
                    }
                });


                var addToCartexitPopUpData = typeof globalJavascript.globalSettingsAndData.exitpopup != 'undefined' ? globalJavascript.globalSettingsAndData.exitpopup : [];

                if (addToCartexitPopUpData.length > 0) {
                    for (var ipc = 0; ipc < addToCartexitPopUpData.length; ipc++) {
                        if (addToCartexitPopUpData[ipc].triggerjson.timer_trigger == "on") {
                            if (addToCartexitPopUpData[ipc].triggerjson.timer_trigger_value != null) {
                                var time_value = parseInt(addToCartexitPopUpData[ipc].triggerjson.timer_trigger_value) * 1000;
                            } else {
                                var time_value = 0;
                            }
                            time_value = parseInt(addToCartexitPopUpData[ipc].triggerjson.time_trigger_value) * 1000;
                            (function (ipc, addToCartexitPopUpData) {
                                setTimeout(function () {
                                    checkAddToCartexitPopup(addToCartexitPopUpData[ipc], 2);
                                }, time_value);
                            }(ipc, addToCartexitPopUpData));
                        }
                    }
                }

                if ((cartHash_cached != cartHash_live || impressionBy != '') && data.cart.item_count > 0) {
                    salesparkJquery.ajax({
                        url: webApi + "cart/create",
                        dataType: 'json',
                        type: 'POST',
                        data: data,
                        crossDomain: true,
                        withCredentials: false,
                        async: false,
                        success: function (response) {
                            console.log(response._metadata.message);
                            if (response._metadata.message == 'success') {
                                window.localStorage.setItem('cartHash_cached', cartHash_live);
                                var cartData = data.cart;
                                saleSparkCartTrigger.CartItemData = cartData;
                                var addToCartPopUpData = globalJavascript.globalSettingsAndData.emailCollector;
                                if (addToCartPopUpData.template.length > 0) {
                                    checkAddToCartPopup(cartData, addToCartPopUpData.template, callBack, '');
                                }
                                enableEmailMagnet(cartData);
                                var addToCartexitPopUpData = typeof globalJavascript.globalSettingsAndData.exitpopup != 'undefined' ? globalJavascript.globalSettingsAndData.exitpopup : [];
                                /* trigger check */
                                if (addToCartexitPopUpData.length > 0) {
                                    for (var ipc = 0; ipc < addToCartexitPopUpData.length; ipc++) {
                                        if (addToCartexitPopUpData[ipc].triggerjson.timer_trigger_cart == "on") {
                                            checkAddToCartexitPopup(addToCartexitPopUpData[ipc], 1);
                                        }
                                    }
                                }
                                /*trigger check */
                                if (typeof callBack == 'function') {
                                    callBack();
                                }
                            }
                        }
                    });
                }
            }
        });
    };


    function enableEmailMagnet(cartData) {
        if (cartData && !cartData.email && globalJavascript.globalSettingsAndData.emailCollector.is_email_magnet_enable == '1') {
            salesparkJquery(document).on('blur', 'input', function (e) {
                if (!e.originalEvent.isTrusted) {
                    return false;
                }
                if ($(this).attr('id') == 'sp-email-address' && $(this).attr('type') == 'email') {
                    return false;
                }
                var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                if (re.test(String(salesparkJquery(this).val()))) {
                    customer.email = salesparkJquery(this).val();
                    console.log('Email Magnet Captured');
                    saleSparkCartTrigger.process(0, '', 1, 'EMAILMAGNET');
                }
            });
        }
    }

    function getProductPagePath() {
        var productDetailsPath = /https?\:\/\/([^\/]*)(.*\/products[^\?]*).*/;
        var currentUrl = String(getCurrentURL());
        var matched = currentUrl.match(productDetailsPath);
        return matched != null && matched.length > 2 ? matched[2] : null;
    }

    function getCurrentPageUrlWithoutQueryParameters() {
        var productDetailsPath = /https?\:\/\/([^\/]*)([^\?]*).*/;
        var currentUrl = String(getCurrentURL());
        var matched = currentUrl.match(productDetailsPath);
        return matched != null && matched.length > 2 ? matched[2] : null;
    }

    function getCurrentURL() {
        return window.location.href;
    }

    function showNotification() {
        if (globalJavascript.globalSettingsAndData.emailCollector.push_options != null) {
            if (globalJavascript.globalSettingsAndData.emailCollector.push_options.reminder_time) {
                var notifTimer = null;
                var setting = globalJavascript.globalSettingsAndData.emailCollector.push_options;
                notifTimer = setInterval(function () {
                    const pushOptions = {
                        body: setting.body,
                        icon: setting.icon,
                        silent: setting.default_sound,
                        image: setting.image,
                        badge: setting.badge,
                        vibrate: [200, 100, 200],
                        actions: [{
                            action: setting.action,
                            title: setting.action_title,
                            icon: setting.action_icon
                        }],
                        dir: setting.dir,
                        requireInteraction: true,
                        data: window.location.href,
                    };
                    if (!setting.actions) {
                        delete pushOptions.actions
                    }
                    if (setting.default_sound) {
                        delete pushOptions.vibrate
                    }
                    Push.create(setting.title, pushOptions);
                    clearInterval(notifTimer);
                }, globalJavascript.globalSettingsAndData.emailCollector.push_options.reminder_time);
            } else {

            }
        }
    }


    function checkAddToCartPopup(cartData, addToCartPopUpData, callBack, activeInterface) {
        //salesparkJquery('#CartDrawer').removeAttr('tabindex');

        var previousCachedTime = window.localStorage.getItem('timeData');
        if (previousCachedTime !== undefined) {
            var currentTime = new Date();
            var previousTime = new Date(previousCachedTime);
            var msec = parseInt(currentTime - previousTime);
            var mins = parseInt(Math.floor(msec / 60000));
            if (mins <= 5) {
                console.log('Time remaining : ' + mins);
                return;
            }
        }

        if (localStorage.getItem('localNotifPermission') !== null) {
            if (localStorage.getItem('localNotifPermission') == 'yes') {
                showNotification();
            }
        }

        //console.log(addToCartPopUpData);
        /*addToCartPopUpData = addToCartPopUpData[0];
        if(addToCartPopUpData.banner_image!=''){
            bannerImage = addToCartPopUpData.banner_image
        }else{
            bannerImage = 'img/cart-popup.png';
        }*/
        if (salesparkswal.isVisible()) {
            return;
        }
        salesparkswal.fire({
            title: '',
            html: addToCartPopUpData,
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
            // console.log({'then':result});
            if (result.value) {
                customer.email = result.value;
                var timeNow = new Date();
                window.localStorage.setItem('timeData', timeNow);
                console.log('From email collector popup');
                saleSparkCartTrigger.process(1, function () {
                    salesparkJquery('form[action="/cart/add"]').submit();
                }, '', 'EMAILCOLLECTOR');
            } else if (result.dismiss) {
                var timeNow = new Date();
                window.localStorage.setItem('timeData', timeNow);
                console.log('From email collector popup 1');
                saleSparkCartTrigger.process(0, '', '', 'EMAILCOLLECTOR');
            }
        });
        if (typeof callBack == 'function') {
            callBack();
        }
    }


    function checkAddToCartexitPopup(addToCartexitPopUpData, statuscheck) {

        if (addToCartexitPopUpData.collectioninfo != "") {
            if (ShopifyAnalytics.meta.page.pageType == 'product') {
                if (jQuery.inArray(ShopifyAnalytics.meta.product.id, addToCartexitPopUpData.collectioninfo) == -1) {
                    return;
                }
            }
        }

        var addToCartexitPopUpData_id = addToCartexitPopUpData.id;
        var localNotifpopupids_array = [];
        var carget = 0;
        if (addToCartexitPopUpData.usecode == 2) {
            if (cartdata) {
                if (cartdata.item_count == 0) {
                    return;
                } else {
                    carget = 1;
                }
            } else {
                return;
            }
        }
        if (statuscheck == 1) {
            if (localStorage.getItem('localNotifpopupids1') != '' && localStorage.getItem('localNotifpopupids1') != null) {
                var localNotifpopupids = localStorage.getItem('localNotifpopupids1');
                var str_id = localNotifpopupids.indexOf(",");
                localNotifpopupids_array = localNotifpopupids.split(',');
                var countnotifids_leg = localNotifpopupids_array.length;
                ckflag = 0;
                for (var ick = 0; ick < countnotifids_leg; ick++) {
                    if (localNotifpopupids_array[ick] == addToCartexitPopUpData_id) {
                        ckflag = 1;
                        return;
                    }
                }
                if (ckflag != 1) {
                    localNotifpopupids_array[countnotifids_leg] = addToCartexitPopUpData_id;
                    localNotifpopupids = localNotifpopupids_array.join(',');
                    localStorage.setItem('localNotifpopupids1', localNotifpopupids);
                }
            } else {
                localStorage.setItem('localNotifpopupids1', addToCartexitPopUpData_id);
            }
        }
        if (statuscheck == 2) {
            if (localStorage.getItem('localNotifpopupids2') != '' && localStorage.getItem('localNotifpopupids2') != null) {
                var localNotifpopupids = localStorage.getItem('localNotifpopupids2');
                var str_id = localNotifpopupids.indexOf(",");
                localNotifpopupids_array = localNotifpopupids.split(',');
                var countnotifids_leg = localNotifpopupids_array.length;
                ckflag = 0;
                for (var ick = 0; ick < countnotifids_leg; ick++) {
                    if (localNotifpopupids_array[ick] == addToCartexitPopUpData_id) {
                        ckflag = 1;
                        return;
                    }
                }
                if (ckflag != 1) {
                    localNotifpopupids_array[countnotifids_leg] = addToCartexitPopUpData_id;
                    localNotifpopupids = localNotifpopupids_array.join(',');
                    localStorage.setItem('localNotifpopupids2', localNotifpopupids);
                }
            } else {
                localStorage.setItem('localNotifpopupids2', addToCartexitPopUpData_id);
            }
        }
        if (statuscheck == 3) {
            if (localStorage.getItem('localNotifpopupids3') != '' && localStorage.getItem('localNotifpopupids3') != null) {
                var localNotifpopupids = localStorage.getItem('localNotifpopupids3');
                var str_id = localNotifpopupids.indexOf(",");
                localNotifpopupids_array = localNotifpopupids.split(',');
                var countnotifids_leg = localNotifpopupids_array.length;
                ckflag = 0;
                for (var ick = 0; ick < countnotifids_leg; ick++) {
                    if (localNotifpopupids_array[ick] == addToCartexitPopUpData_id) {
                        ckflag = 1;
                        return;
                    }
                }
                if (ckflag != 1) {
                    localNotifpopupids_array[countnotifids_leg] = addToCartexitPopUpData_id;
                    localNotifpopupids = localNotifpopupids_array.join(',');
                    localStorage.setItem('localNotifpopupids3', localNotifpopupids);
                }
            } else {
                localStorage.setItem('localNotifpopupids3', addToCartexitPopUpData_id);
            }
        }
        if (statuscheck == 4) {
            if (localStorage.getItem('localNotifpopupids4') != '' && localStorage.getItem('localNotifpopupids4') != null) {
                var localNotifpopupids = localStorage.getItem('localNotifpopupids4');
                var str_id = localNotifpopupids.indexOf(",");
                localNotifpopupids_array = localNotifpopupids.split(',');
                var countnotifids_leg = localNotifpopupids_array.length;
                ckflag = 0;
                for (var ick = 0; ick < countnotifids_leg; ick++) {
                    if (localNotifpopupids_array[ick] == addToCartexitPopUpData_id) {
                        ckflag = 1;
                        return;
                    }
                }
                if (ckflag != 1) {
                    localNotifpopupids_array[countnotifids_leg] = addToCartexitPopUpData_id;
                    localNotifpopupids = localNotifpopupids_array.join(',');
                    localStorage.setItem('localNotifpopupids4', localNotifpopupids);
                }
            } else {
                localStorage.setItem('localNotifpopupids4', addToCartexitPopUpData_id);
            }
        }

        if (addToCartexitPopUpData.displaydevices == 'mobile') {
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            } else {
                return;
            }
        }

        if (carget == 1) {
            addToCartexitPopUpData.design[0] = get_cart_coupon(cartdata, localNotifpopupids, addToCartexitPopUpData);
        } else {
            show_popup_sweetalert(addToCartexitPopUpData.design[0]);
        }


        jQuery(document).on('submit', ".popup-backform", function (e) {
            add_to_local_poup_id(jQuery(this).attr('popup-id'));
            salesparkJquery.ajax({
                url: webApi + "popup/customer",
                dataType: 'json',
                type: 'POST',
                data: jQuery(this).serialize(),
                crossDomain: true,
                withCredentials: false,
                async: false,
                success: function (response) {
                    // console.log(response._metadata.message);
                    if (response._metadata.message == 'success') {
                        salesparkswal.close();
                    }
                }
            });
        });

    }


    function show_popup_sweetalert(addToCartexitdesign) {
        if (salesparkswal.isVisible()) {
            return;
        }
        salesparkswal.fire({
            title: '',
            html: addToCartexitdesign,
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
            // console.log({'then':result});
            /*if (result.value) {
                customer.email = result.value;
                var timeNow = new Date();
                window.localStorage.setItem('timeData', timeNow);
                console.log('From email collector popup');
                saleSparkCartTrigger.process(1, function () {
                    salesparkJquery('form[action="/cart/add"]').submit();
                },'', 'EMAILCOLLECTOR');
            }else if(result.dismiss){
                var timeNow = new Date();
                window.localStorage.setItem('timeData', timeNow);
                console.log('From email collector popup 1');
                saleSparkCartTrigger.process(0,'','','EMAILCOLLECTOR');
            }*/
        });
        if (typeof callBack == 'function') {
            callBack();
        }
    }

    function get_cart_coupon(cart_data, localNotifpopupids, addToCartexitPopUpData) {
        var customerid = ShopifyAnalytics.meta.page.customerId;
        if (customerid == null) {
            customerid = 0;
        }
        salesparkJquery.ajax({
            url: webApi + "popup/dynamic-coupon?shop=" + Shopify.shop + "&customer_id=" + customerid,
            dataType: 'json',
            type: 'POST',
            data: cart_data,
            crossDomain: true,
            withCredentials: false,
            async: false,
            success: function (response) {
                if (response._metadata.message == 'success') {
                    var html = addToCartexitPopUpData.design[0];
                    var records_coupon = response.records;
                    var amount_coupon = records_coupon.value;
                    amount_coupon = amount_coupon.toString();
                    amount_coupon = amount_coupon.replace("-", "");
                    if (records_coupon.value_type == 'percentage') {
                        amount_coupon = amount_coupon + '%';
                    } else {
                        amount_coupon = amount_coupon + Shopify.currency.active;
                    }
                    html = html.replace("%discount%", amount_coupon);
                    html = html.replace("%hidden_copon%", '<input type="hidden" name="couponcode" class="coupon_' + addToCartexitPopUpData.id + '" value="' + records_coupon.code + '">');
                    show_popup_sweetalert(html);
                }
            }
        });
    }

    function add_to_local_poup_id(addToCartexitPopUpData_id) {
        var localNotifpopupids_array = [];
        if (localStorage.getItem('localNotifpopupids1') != '' && localStorage.getItem('localNotifpopupids1') != null) {
            var localNotifpopupids = localStorage.getItem('localNotifpopupids1');
            var str_id = localNotifpopupids.indexOf(",");
            localNotifpopupids_array = localNotifpopupids.split(',');
            var countnotifids_leg = localNotifpopupids_array.length;
            ckflag = 0;
            for (var ick = 0; ick < countnotifids_leg; ick++) {
                if (localNotifpopupids_array[ick] == addToCartexitPopUpData_id) {
                    ckflag = 1;
                }
            }
            if (ckflag != 1) {
                localNotifpopupids_array[countnotifids_leg] = addToCartexitPopUpData_id;
                localNotifpopupids = localNotifpopupids_array.join(',');
                localStorage.setItem('localNotifpopupids1', localNotifpopupids);
            }
        } else {
            localStorage.setItem('localNotifpopupids1', addToCartexitPopUpData_id);
        }
        if (localStorage.getItem('localNotifpopupids2') != '' && localStorage.getItem('localNotifpopupids2') != null) {
            var localNotifpopupids = localStorage.getItem('localNotifpopupids2');
            var str_id = localNotifpopupids.indexOf(",");
            localNotifpopupids_array = localNotifpopupids.split(',');
            var countnotifids_leg = localNotifpopupids_array.length;
            ckflag = 0;
            for (var ick = 0; ick < countnotifids_leg; ick++) {
                if (localNotifpopupids_array[ick] == addToCartexitPopUpData_id) {
                    ckflag = 1;
                }
            }
            if (ckflag != 1) {
                localNotifpopupids_array[countnotifids_leg] = addToCartexitPopUpData_id;
                localNotifpopupids = localNotifpopupids_array.join(',');
                localStorage.setItem('localNotifpopupids2', localNotifpopupids);
            }
        } else {
            localStorage.setItem('localNotifpopupids2', addToCartexitPopUpData_id);
        }
        if (localStorage.getItem('localNotifpopupids3') != '' && localStorage.getItem('localNotifpopupids3') != null) {
            var localNotifpopupids = localStorage.getItem('localNotifpopupids3');
            var str_id = localNotifpopupids.indexOf(",");
            localNotifpopupids_array = localNotifpopupids.split(',');
            var countnotifids_leg = localNotifpopupids_array.length;
            ckflag = 0;
            for (var ick = 0; ick < countnotifids_leg; ick++) {
                if (localNotifpopupids_array[ick] == addToCartexitPopUpData_id) {
                    ckflag = 1;
                }
            }
            if (ckflag != 1) {
                localNotifpopupids_array[countnotifids_leg] = addToCartexitPopUpData_id;
                localNotifpopupids = localNotifpopupids_array.join(',');
                localStorage.setItem('localNotifpopupids3', localNotifpopupids);
            }
        } else {
            localStorage.setItem('localNotifpopupids3', addToCartexitPopUpData_id);
        }
        if (localStorage.getItem('localNotifpopupids4') != '' && localStorage.getItem('localNotifpopupids4') != null) {
            var localNotifpopupids = localStorage.getItem('localNotifpopupids4');
            var str_id = localNotifpopupids.indexOf(",");
            localNotifpopupids_array = localNotifpopupids.split(',');
            var countnotifids_leg = localNotifpopupids_array.length;
            ckflag = 0;
            for (var ick = 0; ick < countnotifids_leg; ick++) {
                if (localNotifpopupids_array[ick] == addToCartexitPopUpData_id) {
                    ckflag = 1;
                }
            }
            if (ckflag != 1) {
                localNotifpopupids_array[countnotifids_leg] = addToCartexitPopUpData_id;
                localNotifpopupids = localNotifpopupids_array.join(',');
                localStorage.setItem('localNotifpopupids4', localNotifpopupids);
            }
        } else {
            localStorage.setItem('localNotifpopupids4', addToCartexitPopUpData_id);
        }
    }


    function addJqueryEventListeners() {


        salesparkJquery.ajaxSetup({
            xhrFields: {
                withCredentials: true
            }
        });

        if (getParameterByName('cc-preview-email-collector')) {

            if (saleSparkCartTrigger.globalSettingsAndData.addToCartPopUp != undefined && saleSparkCartTrigger.globalSettingsAndData.addToCartPopUp.length > 0) {
                addToCartPopUpData = saleSparkCartTrigger.globalSettingsAndData.addToCartPopUp[0]
                if (addToCartPopUpData.banner_image != '') {
                    bannerImage = addToCartPopUpData.banner_image
                } else {
                    bannerImage = 'img/cart-popup.png';
                }
                if (salesparkswal.isVisible()) {
                    return;
                }
                var headingFontWeight = (addToCartPopUpData.heading_is_bold == 1) ? 'bold' : 'normal';
                var headingFontStyle = (addToCartPopUpData.heading_is_italic == 1) ? 'italic' : 'normal';
                var headingFontSize = addToCartPopUpData.heading_font_size + 'px';
                var headingTextAlignment = addToCartPopUpData.heading_text_align.toLowerCase();
                var headingColor = addToCartPopUpData.heading_color;
                var headingText = addToCartPopUpData.heading_text;

                var descriptionFontWeight = (addToCartPopUpData.description_is_bold == 1) ? 'bold' : 'normal';
                var descriptionFontStyle = (addToCartPopUpData.description_is_italic == 1) ? 'italic' : 'normal';
                var descriptionFontSize = addToCartPopUpData.description_font_size + 'px';
                var descriptionTextAlignment = addToCartPopUpData.description_text_align.toLowerCase();
                var descriptionColor = addToCartPopUpData.description_color;
                var descriptionText = addToCartPopUpData.description_text;

                var emailPlaceHolder = addToCartPopUpData.email_placeholder;

                var buttonFontWeight = (addToCartPopUpData.button_is_bold == 1) ? 'bold' : 'normal';
                var buttonFontStyle = (addToCartPopUpData.button_is_italic == 1) ? 'italic' : 'normal';
                var buttonFontSize = addToCartPopUpData.button_font_size + 'px';
                var buttonTextAlignment = addToCartPopUpData.button_text_align.toLowerCase();
                var buttonColor = addToCartPopUpData.button_text_color;
                var buttonText = addToCartPopUpData.button_text;
                var buttonBackgroundColor = addToCartPopUpData.button_background_color;

                var titlehtml = "<h2 style='text-transform: unset;font-family: Open Sans, sans-serif;font-size:" + headingFontSize + ";color:" + headingColor + " ;text-align:" + headingTextAlignment + ";font-weight:" + headingFontWeight + ";font-style: " + headingFontStyle + "'>" + headingText + "</h2>"; //addToCartPopUpData.heading_text,
                var descripionText = "<p style='text-transform: unset;font-family: Open Sans, sans-serif;font-size:" + descriptionFontSize + ";color:" + descriptionColor + ";text-align:" + descriptionTextAlignment + ";font-weight: " + descriptionFontWeight + ";font-style:" + descriptionFontStyle + ";'>" + descriptionText + "</p>";

                salesparkswal.fire({
                    title: titlehtml,
                    html: descripionText,
                    input: 'email',
                    inputPlaceholder: addToCartPopUpData.email_placeholder,
                    inputAutoTrim: true,
                    confirmButtonText: "<span style='font-size:" + buttonFontSize + ";color:" + buttonColor + ";font-style:" + buttonFontStyle + ";font-weight:" + buttonFontWeight + "'>" + addToCartPopUpData.button_text + "</span>",
                    confirmButtonColor: addToCartPopUpData.button_background_color,
                    showCancelButton: false,
                    cancelButtonText: 'No, cancel!',
                    showCloseButton: (addToCartPopUpData.is_active_close_button == 1 ? true : false),
                    imageUrl: webApi + '/' + bannerImage,
                    imageWidth: 100,
                    allowOutsideClick: false,
                    //footer: 'Footer text',
                    //reverseButtons: true,
                    //type: 'success'

                }).then(function (result) {

                });
            } else {
                salesparkJquery.ajax({
                    url: webApi + "/api/cart/popupSettings?shop=" + store.domain,
                    dataType: 'json',
                    type: 'GET',
                    success: function (response) {
                        var addToCartPopUpData = response.records.addToCartPopUp;
                        if (addToCartPopUpData.banner_image != '') {
                            bannerImage = addToCartPopUpData.banner_image
                        } else {
                            bannerImage = 'img/cart-popup.png';
                        }
                        if (salesparkswal.isVisible()) {
                            return;
                        }
                        var headingFontWeight = (addToCartPopUpData.heading_is_bold == 1) ? 'bold' : 'normal';
                        var headingFontStyle = (addToCartPopUpData.heading_is_italic == 1) ? 'italic' : 'normal';
                        var headingFontSize = addToCartPopUpData.heading_font_size + 'px';
                        var headingTextAlignment = addToCartPopUpData.heading_text_align.toLowerCase();
                        var headingColor = addToCartPopUpData.heading_color;
                        var headingText = addToCartPopUpData.heading_text;

                        var descriptionFontWeight = (addToCartPopUpData.description_is_bold == 1) ? 'bold' : 'normal';
                        var descriptionFontStyle = (addToCartPopUpData.description_is_italic == 1) ? 'italic' : 'normal';
                        var descriptionFontSize = addToCartPopUpData.description_font_size + 'px';
                        var descriptionTextAlignment = addToCartPopUpData.description_text_align.toLowerCase();
                        var descriptionColor = addToCartPopUpData.description_color;
                        var descriptionText = addToCartPopUpData.description_text;

                        var emailPlaceHolder = addToCartPopUpData.email_placeholder;

                        var buttonFontWeight = (addToCartPopUpData.button_is_bold == 1) ? 'bold' : 'normal';
                        var buttonFontStyle = (addToCartPopUpData.button_is_italic == 1) ? 'italic' : 'normal';
                        var buttonFontSize = addToCartPopUpData.button_font_size + 'px';
                        var buttonTextAlignment = addToCartPopUpData.button_text_align.toLowerCase();
                        var buttonColor = addToCartPopUpData.button_text_color;
                        var buttonText = addToCartPopUpData.button_text;
                        var buttonBackgroundColor = addToCartPopUpData.button_background_color;

                        var titlehtml = "<h2 style='text-transform: unset;font-family: Open Sans, sans-serif;font-size:" + headingFontSize + ";color:" + headingColor + " ;text-align:" + headingTextAlignment + ";font-weight:" + headingFontWeight + ";font-style: " + headingFontStyle + "'>" + headingText + "</h2>"; //addToCartPopUpData.heading_text,
                        var descripionText = "<p style='text-transform: unset;font-family: Open Sans, sans-serif;font-size:" + descriptionFontSize + ";color:" + descriptionColor + ";text-align:" + descriptionTextAlignment + ";font-weight: " + descriptionFontWeight + ";font-style:" + descriptionFontStyle + ";'>" + descriptionText + "</p>";
                        salesparkswal.fire({
                            title: titlehtml,
                            html: descripionText,
                            input: 'email',
                            inputPlaceholder: addToCartPopUpData.email_placeholder,
                            inputAutoTrim: true,
                            confirmButtonText: "<span style='font-size:" + buttonFontSize + ";color:" + buttonColor + ";font-style:" + buttonFontStyle + ";font-weight:" + buttonFontWeight + "'>" + addToCartPopUpData.button_text + "</span>",
                            confirmButtonColor: addToCartPopUpData.button_background_color,
                            showCancelButton: false,
                            cancelButtonText: 'No, cancel!',
                            showCloseButton: (addToCartPopUpData.is_active_close_button == 1 ? true : false),
                            imageUrl: webApi + '/' + bannerImage,
                            imageWidth: 100,
                            allowOutsideClick: false,
                            //footer: 'Footer text',
                            //reverseButtons: true,
                            //type: 'success'

                        }).then(function (result) {

                        });

                    }
                });
            }


        }


        salesparkJquery('body').on('click', '#cc_f-p-preview-email-btn', function () {
            if (getParameterByName('cc-preview-email-collector')) {
                salesparkJquery('#cc-atcp-table', 'body').hide();
            } else {
                salesparkJquery('#cc_f-p-preview-email-placeholder-error', 'body').hide();
                var email = salesparkJquery('#cc_f-p-preview-email-placeholder', 'body').val();
                if (!validateEmail(email)) {
                    salesparkJquery('#cc_f-p-preview-email-placeholder-error', 'body').show();
                } else {
                    customer.email = email;
                    console.log('From cc preview function');
                    saleSparkCartTrigger.process(1, function () {
                        salesparkJquery('form[action="/cart/add"]').submit();
                    });
                }
            }
        });


        salesparkJquery('body').on('click', '#sp-email-collector-button', function () {
            var email = salesparkJquery('input#sp-email-address', 'body').val();
            console.log(email);
            if (!validateEmail(email)) {
                salesparkJquery('#sp-email-error-span', 'body').remove();
                salesparkJquery('#sp-email-address', 'body').parent().append('<span id="sp-email-error-span" style="color: darkred">Please enter a valid email address</span>');
            } else {
                customer.email = email;
                console.log('From sp email collector function');
                saleSparkCartTrigger.process(1, function () {
                    console.log("Going to Redirect");
                    salesparkJquery('form[action="/cart/add"]').submit();
                });
            }
        });


        var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
        var eventer = window[eventMethod];
        var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

        // Listen to message from child window
        eventer(messageEvent, function (e) {
            //console.log(e);
            var key = e.message ? "message" : "data";
            var data = e[key];
            //run function//
            //console.log(data.email);
            if (data != null && data == 'close_email') {
                salesparkJquery('#cc-atcp-table', 'body').hide();
            }
            if (data.email != null) {
                customer.email = data.email;
                //console.log(customer.email);
                console.log('From event listener');
                saleSparkCartTrigger.process(1, function () {
                    if (isAjax == 0) {
                        salesparkJquery('form[action="/cart/add"]').submit();
                    }
                });
                salesparkJquery('#cc-atcp-table', 'body').hide();
            }
            if (data == 'mobilefocus') {
                if (salesparkJquery('.fancybox-content').width() <= 450) {
                    //salesparkJquery( '.fancybox-content' ).css('width', '100%');
                    setTimeout(function () {
                        salesparkJquery('.fancybox-content').css('width', '100%');
                    }, 1000);
                }
            }

        }, false);

        var proxied = window.XMLHttpRequest.prototype.send;
        window.XMLHttpRequest.prototype.send = function () {
            //console.log( arguments );
            //Here is where you can add any code to process the request.
            //If you want to pass the Ajax request object, pass the 'pointer' below
            var pointer = this
            var intervalId = window.setInterval(function () {
                if (pointer.readyState != 4) {
                    return;
                }
                var url = pointer.responseURL;
                var lastPart = url.split('/');
                var name = lastPart[lastPart.length - 1];
                if (name == 'add.js' || name == 'change.js') {
                    //Show email collector
                    isAjax = 1;
                    console.log('show collector in ajax call from ajax');
                    if (!Push.Permission.has()) {
                        requestPermission();
                    }
                    saleSparkCartTrigger.process(0);
                    setTimeout(function () {
                        salesparkJquery('.mfp-wrap').css('display', 'block');
                    }, 2000);

                }
                //Here is where you can add any code to process the response.
                //If you want to pass the Ajax request object, pass the 'pointer' below
                clearInterval(intervalId);

            }, 1);//I found a delay of 1 to be sufficient, modify it as you need.
            return proxied.apply(this, [].slice.call(arguments));
        };

        salesparkJquery('body').on('submit', 'form[action="/cart/add"]', function (e) {
            console.log(Push.Permission.has());
            if (!Push.Permission.has()) {
                requestPermission();
            }
            //console.clear();
            console.log('add to cart clicked....');
            setTimeout(function () {
                isAjax = 0;
                console.log('From time setout');
                saleSparkCartTrigger.process(0);
            }, 2000);
        });

    }


    function getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    };

    function validateEmail(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (email != undefined && email != null && email != '') {
            return re.test(email.toLowerCase());
            return false;
        }
    }
}


var saleSparkCartTrigger = new saleSparkCartTrigger();
saleSparkCartTrigger.init(saleSparkCartTrigger.process, [0]);

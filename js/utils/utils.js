(function(app, window, document) {
    // Public api
    var api = {
        checkIfInViewPort: checkIfInViewPort,
        scrollTo: scrollTo,
        debounce: debounce,
        addMultipleEventListeners: addMultipleEventListeners,
        removeMultipleEventListeners: removeMultipleEventListeners
    };
    app.utils = api;

    function debounce(fn, delay) {
        var timer = null;
        return function () {
            var context = this, args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                fn.apply(context, args);
            }, delay);
        };
    }

    function checkIfInViewPort (el, offsetTop, offsetBottom, returnDetails) {
        var rect, windowHeight, elHeight, topInView, bottomInView, elInView;
        rect         = el.getBoundingClientRect();
        offsetTop    = offsetTop          || 0;
        offsetBottom = offsetBottom       || 0;
        windowHeight = window.innerHeight || document.documentElement.clientHeight;
        elHeight     = el.offsetHeight;
        topInView    = rect.top >= 0 && rect.top + offsetTop <= windowHeight;
        bottomInView = rect.bottom >= offsetBottom && rect.bottom <= elHeight;
        elInView     = topInView || bottomInView ? true: false;
        if (returnDetails) {
            return {
                inView:     elInView,
                fromTop:    rect.top - offsetTop
            };
        }
        return elInView;
    }

    function addMultipleEventListeners(events, handler) {
        for (var i = 0; i < events.length; i++) {
            window.addEventListener(events[i], handler);
        }
    }

    function removeMultipleEventListeners(events, handler) {
        for (var i = 0; i < events.length; i++) {
            window.removeEventListener(events[i], handler);
        }
    }

    function scrollTo (to, duration, callback) {
        var doc, start, change, currTime, freq, scrollInterval, scrollVal;

        doc      = document.documentElement,
        start    = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0),
        change   = to - start,
        currTime = 0,
        freq     = 20,

        scrollInterval = setInterval(function () {
            currTime += freq;
            scrollVal = easeInOutQuad(currTime, start, change, duration);
            window.scrollTo(0, scrollVal);
            if (currTime >= duration) {
                clearInterval(scrollInterval);
                if (callback) {
                    callback();
                }
            }
        }, freq);
    }

    function easeInOutQuad (t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    return app;
})(app, window, document);
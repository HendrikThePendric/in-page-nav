(function(app, utils, Item, Marker, window, document){
    // Change this to determine when to use or cancel
    var minWindowWidth, navigator;
    minWindowWidth = 600;
    app.Navigator  = Navigator;

    function Navigator() {
        this.el             = document.getElementById('in-page-nav');
        this.mainMenu       = document.getElementById('menu-main');
        this.body           = document.getElementsByTagName('body')[0];
        this.moveUpElems    = [this.el, this.mainMenu]; 
        // Always listen for resizes so we can load/disable/reset
        this.resizeListener = utils.debounce(this.resizeHandler.bind(this), 150);
        this.addResizeListener();
        // Only load on large enough screens
        if (!this.isMobile()) {
            this.load();
        } else {
            this.el.classList.add('hidden');
            this.body.classList.add('single-menu');
        }
    }
    Navigator.prototype.isMobile = function() {
        return window.innerWidth < minWindowWidth;
    };
    Navigator.prototype.load = function() {
        // Store items in an associative array
        this.items           = {};
        // But markers in a normal array
        this.markers         = [];
        this.scrollListener  = this.scrollHandler.bind(this);
        this.atTop           = true;
        this.offset          = 0;
        this.lastScrollPos   = 0;
        this.activeMarkerId  = this.activeMarkerId || null;
        this.enabled         = true;
        this.lastToggle      = Date.now();
        this.lastWindowWidth = window.innerWidth;
        this.scrollToBusy    = false;
        this.singleMenu      = false;
        this.el.classList.remove('hidden');
        this.body.classList.remove('single-menu');
        this.createItemsAndMarkers();
        this.addScrollListener();
        if (this.isTooLarge()) {
            this.disable();
        }
    };
    Navigator.prototype.disable = function() {
        // remove all listeners
        this.removeListeners();
        // Clear class from menu
        this.mainMenu.classList.remove('moved-up');
        this.el.classList.add('hidden');
        this.body.classList.add('single-menu');
        this.enabled = false;
    };
    Navigator.prototype.reset = function() {
        this.disable();
        this.load();
    };
    Navigator.prototype.createItemsAndMarkers = function() {
        var itemElems, markerElems, currMarker;
        itemElems   = this.el.getElementsByClassName('in-page-nav-item');
        markerElems = document.getElementsByClassName('in-page-nav-marker');
        for (var i = 0; i < itemElems.length; i++) {
            currMarker = new Marker(markerElems[i], (i+1), this);
            this.markers.push(currMarker);
            this.items['id_' + (i+1)] = new Item(itemElems[i], (i+1), currMarker, this);
        }
    };
    Navigator.prototype.scrollHandler = function () {
        this.updatePositionProps();
        this.updateMarkersVisibility();
        this.updateActiveMarkerId();
    };
    Navigator.prototype.resizeHandler = function () {
        // On touch devices this event may be called unexpectedly
        // so we work with a cached version of the windowWidth
        if (window.innerWidth !== this.lastWindowWidth) {
            // Actual change
            this.lastWindowWidth = window.innerWidth;
        } else {
            // Fake event
            return false;
        }
        // Switching to mobile viewport width, disable the lot
        if (this.isMobile() && this.enabled) {
            this.disable();
        } else {
            // If not enabled yet, do so now
            if (!this.enabled) {
                this.load();
            } else {
                // resizes in desktop
                this.reset();
            }
        }
    };
    Navigator.prototype.addResizeListener = function () {
        utils.addMultipleEventListeners(['resize'], this.resizeListener);
    };
    Navigator.prototype.addScrollListener = function () {
        utils.addMultipleEventListeners(['DOMContentLoaded', 'load', 'scroll'], this.scrollListener);
    };
    Navigator.prototype.removeListeners = function () {
        utils.removeMultipleEventListeners(['DOMContentLoaded', 'load', 'scroll'], this.scrollListener);
        for (var i = 0; i < this.markers.length; i++) {
            this.items['id_' + (i + 1)].removeClickListener();
        }
        this.markers = null;
        this.items   = null;
    };
    Navigator.prototype.updateMarkersVisibility = function () {
        for (var i = 0; i < this.markers.length; i++) {
            this.markers[i].updateVisibility();
        }
    };
    Navigator.prototype.updatePositionProps = function () {
        var now, doc, scrollPos, downwards, singleMenu;
        now        = Date.now();
        doc        = document.documentElement;
        scrollPos  = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
        downwards  = scrollPos > this.lastScrollPos;
        singleMenu = true;
        this.atTop = scrollPos === 0;
        // Toggle menu based on scroll direction
        if (now - this.lastToggle > 1000) {
            this.lastToggle = now;
            // Going up on a natural scroll, or with scrollTo when men is double already
            if (!downwards && (!this.scrollToBusy || !this.singleMenu)) {
                singleMenu = false;
            }
            // Toggle when a state switch is needed
            if (singleMenu && !this.singleMenu) {
                this.toSingleMenu();
            }
            if (!singleMenu && this.singleMenu) {
                this.toDoubleMenu();
            }
        }
        this.lastScrollPos = scrollPos;
    };
    Navigator.prototype.toSingleMenu = function () {
        this.singleMenu = true;
        this.toggleMovedUpClass('add');
        this.offset = this.el.offsetHeight;
    };
    Navigator.prototype.toDoubleMenu = function () {
        this.singleMenu = false;
        this.toggleMovedUpClass('remove');
        this.offset = this.el.offsetHeight + this.mainMenu.offsetHeight;
    };
    Navigator.prototype.toggleMovedUpClass = function (operation) {
        for (var i = 0; i < this.moveUpElems.length; i++) {
            this.moveUpElems[i].classList[operation]('moved-up');
        }
    };
    Navigator.prototype.updateActiveMarkerId = function () {
        var m, activeIds, threshold, tempThreshold, activeId;
        activeIds = [];
        threshold = window.innerHeight * (1/2);
        for (var i = 0; i < this.markers.length; i++) {
            m = this.markers[i];
            if (m.inView) {
                // Threshold cannot exceed m.yPageBottom because you can't scroll past page bottom
                tempThreshold = m.yPageBottom < threshold ? m.yPageBottom : threshold;
                // Marker in view by some margin
                if (m.fromTop <= tempThreshold) {
                    activeIds.push(m.id);
                }
            }
        }
        // Sanity check 1: if none are in view and none have been set,
        // We need to compute the closest one
        if (activeIds.length === 0 && !this.activeMarkerId) {
            activeId = this.findClosestMarkerId();
        } else if (activeIds.length > 1) {
            // Sanity check 2: if there are multiple candidates, select the last one
            activeId = activeIds[activeIds.length - 1];
        } else {
            // Usually there will be only one in view
            activeId = activeIds[0];
        }
        // Update in case of change
        if (activeId && activeId !== this.activeMarkerId) {
            this.updateItems(activeId);
        }
    };
    Navigator.prototype.updateItems = function (newActiveMarkerId) {
        // Deactivate current if there is one defined
        if (this.activeMarkerId) {
            this.items['id_' + this.activeMarkerId].deactivate();
        }
        // Switch active marker ID
        this.activeMarkerId = newActiveMarkerId;
        // Activate new
        this.items['id_' + this.activeMarkerId].activate();
    };
    Navigator.prototype.findClosestMarkerId = function () {
        var myPosY, markerPosY, activeId;
        myPosY = window.scrollY;
        for (var i = 0; i < this.markers.length; i++) {
            markerPosY = this.markers[i].el.offsetTop;
            if (markerPosY > myPosY) {
                activeId = this.markers[i - 1].id;
                break;
            }
        }
        if (!activeId) {
            activeId = this.markers[this.markers.length - 1].id;
        }
        return activeId;
    };
    Navigator.prototype.isTooLarge = function () {
        var availableWidth, totalWidth;
        availableWidth = window.innerWidth;
        totalWidth     = 0;
        for (var i = 0; i < this.markers.length; i++) {
            totalWidth += this.items['id_' + (i+1)].getWidth();
        }
        return totalWidth + 100 > availableWidth;
    };
    Navigator.prototype.toggleScrollToBusy = function () {
        this.scrollToBusy = !this.scrollToBusy;
    };

    navigator = new Navigator();

    return app;
})(app, app.utils, app.Item, app.Marker, window, document);
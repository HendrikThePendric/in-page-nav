(function(app, scrollTo, window, document){
    app.Item = Item;

    function Item(el, id, marker, parent) {
        this.el            = el;
        this.id            = id;
        this.marker        = marker;
        this.parent        = parent;
        this.active        = false;
        this.clicklistener = this.clickHandler.bind(this);
        this.addClickListener();
    }
    Item.prototype.activate = function () {
        this.active = true;
        this.el.classList.add('active');
    };
    Item.prototype.deactivate = function () {
        this.active = false;
        this.el.classList.remove('active');
    };
    Item.prototype.addClickListener = function () {
        this.el.addEventListener('click', this.clicklistener, false);
    };
    Item.prototype.removeClickListener = function () {
        this.el.removeEventListener('click', this.clicklistener, false);
    };
    Item.prototype.clickHandler = function () {
        this.parent.toggleScrollToBusy();
        scrollTo(
            this.marker.el.offsetTop - this.parent.el.offsetHeight,
            400,
            this.parent.toggleScrollToBusy.bind(this.parent)
        );
    };
    Item.prototype.getWidth = function () {
        return this.el.clientWidth;
    };

    return app;
})(app, app.utils.scrollTo, window, document);
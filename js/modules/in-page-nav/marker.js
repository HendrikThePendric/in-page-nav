(function(app, checkIfInViewPort, window, document){
    app.Marker = Marker;

    function Marker(el, id, parent) {
        this.el          = el;
        this.id          = id;
        this.parent      = parent;
        this.inView      = false;
        this.yWindowTop  = 0;
        this.setPageBottom();
    }
    Marker.prototype.updateVisibility = function () {
        var visibility  = checkIfInViewPort(
            this.el,
            this.parent.offset,
            this.parent.offset,
            true
        );
        this.inView     = visibility.inView;
        this.fromTop    = visibility.fromTop;
        this.fromBottom = visibility.fromBottom;
    };
    Marker.prototype.setPageBottom = function () {
        var body, html, docHeight;
        body      = document.body;
        html      = document.documentElement;
        docHeight = Math.max(
            body.scrollHeight,
            body.offsetHeight,
            html.clientHeight,
            html.scrollHeight,
            html.offsetHeight
        );
        this.yPageBottom = docHeight - this.el.offsetTop;
    };

    return app;
})(app, app.utils.checkIfInViewPort, window, document);
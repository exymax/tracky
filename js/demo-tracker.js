var DemoTracker = function(controls) {
    this.constructor(controls);
};

DemoTracker.prototype.constructor = function(controls) {
    this.tracker = new HandTracker.Tracker({
        fast: controls.fast || true
    });
    this.video = controls.video;
    this.canvas = controls.canvas;
    this.cbxHull = controls.enableHull;
    this.cbxDefects = controls.enableDefects;
    this.cbxSkin = controls.enableSkin;

    this.context = this.canvas.getContext("2d");
    this.canvas.width = parseInt(this.canvas.style.width);
    this.canvas.height = parseInt(this.canvas.style.height);
}

DemoTracker.prototype.start = function() {
    var self = this;

    this.image = this.context.createImageData(
        this.canvas.width * 0.2, this.canvas.height * 0.2);

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (navigator.getUserMedia){
        navigator.getUserMedia(
            {
                video: true
            },
            function(stream) {
                return self.videoReady(stream);
            },
            function(error) {
                return self.videoError(error);
        });
    }
};

DemoTracker.prototype.videoReady = function(stream){
    if (window.webkitURL) {
        this.video.src = window.webkitURL.createObjectURL(stream);
    } else if (video.mozSrcObject !== undefined) {
        this.video.mozSrcObject = stream;
    } else {
        this.video.src = stream;
    }

    this.tick();
};

DemoTracker.prototype.videoError = function(error){
    console.error(error);
    alert(error);
};

DemoTracker.prototype.tick = function(){
    var self = this, image, candidate;

    requestAnimationFrame( function() { return self.tick(); } );

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA){
        image = this.snapshot();

        candidate = this.tracker.detect(image);

        this.draw(candidate);
    }
};

DemoTracker.prototype.snapshot = function(){
    this.context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

    return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
};

DemoTracker.prototype.draw = function(candidate){
    if (candidate) {

        if (this.cbxHull.checked){
            this.drawHull(candidate.hull, "red");
        }

        if (this.cbxDefects.checked){
            this.drawDefects(candidate.defects, "blue");
        }
    }

    if (this.cbxSkin.checked){
        this.context.putImageData(
            this.createImage(this.tracker.mask, this.image),
            this.canvas.width - this.image.width,
            this.canvas.height - this.image.height);
    }
};

DemoTracker.prototype.drawHull = function(hull, color){
    var len = hull.length, i = 1;

    if (len > 0){
        this.context.beginPath();
        this.context.lineWidth = 3;
        this.context.strokeStyle = color;
        this.context.moveTo(hull[0].x, hull[0].y);
        for (; i < len; ++ i){
            this.context.lineTo(hull[i].x, hull[i].y);
        }
        this.context.stroke();
        this.context.closePath();
    }
};

DemoTracker.prototype.drawDefects = function(defects, color){
    var len = defects.length, i = 0, point;

    if (len > 0){
        this.context.beginPath();
        this.context.lineWidth = 3;
        this.context.strokeStyle = color;
        for (; i < len; ++ i){
            point = defects[i].depthPoint;
            this.context.strokeRect(point.x - 4, point.y - 4, 8, 8);
        }
        this.context.stroke();
        this.context.closePath();
    }
};

DemoTracker.prototype.createImage = function(imageSrc, imageDst){
    var src = imageSrc.data, dst = imageDst.data,
        width = imageSrc.width, span = 4 * width,
        len = src.length, i = 0, j = 0, k = 0;

    for(i = 0; i < len; i += span){

        for(j = 0; j < width; j += 5){

            dst[k] = dst[k + 1] = dst[k + 2] = src[i];
            dst[k + 3] = 255;
            k += 4;

            i += 5;
        }
    }

    return imageDst;
};
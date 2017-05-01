var HandTracker = HandTracker || {};

HandTracker.Tracker = function (params) {
    this.params = params || {};

    this.mask = new CV.Image();
    this.eroded = new CV.Image();
    this.contours = [];

    this.skinner = new HandTracker.Skinner();
};

HandTracker.Tracker.prototype.detect = function (image) {
    this.skinner.mask(image, this.mask);

    if (this.params.fast) {
        this.blackBorder(this.mask);
    } else {
        CV.erode(this.mask, this.eroded);
        CV.dilate(this.eroded, this.mask);
    }

    this.contours = CV.findContours(this.mask);

    return this.findCandidate(this.contours, image.width * image.height * 0.05, 0.005);
};

HandTracker.Tracker.prototype.findCandidate = function (contours, minSize, epsilon) {
    var contour, candidate;

    contour = this.findMaxArea(contours, minSize);
    if (contour) {
        contour = CV.approxPolyDP(contour, contour.length * epsilon);

        candidate = new HandTracker.Candidate(contour);
    }

    return candidate;
};

HandTracker.Tracker.prototype.findMaxArea = function (contours, minSize) {
    var len = contours.length, i = 0,
        maxArea = -Infinity, area, contour;

    for (; i < len; ++i) {
        area = CV.area(contours[i]);
        if (area >= minSize) {

            if (area > maxArea) {
                maxArea = area;

                contour = contours[i];
            }
        }
    }

    return contour;
};

HandTracker.Tracker.prototype.blackBorder = function (image) {
    var img = image.data, width = image.width, height = image.height,
        pos = 0, i;

    for (i = 0; i < width; ++i) {
        img[pos++] = 0;
    }

    for (i = 2; i < height; ++i) {
        img[pos] = img[pos + width - 1] = 0;

        pos += width;
    }

    for (i = 0; i < width; ++i) {
        img[pos++] = 0;
    }

    return image;
};

HandTracker.Candidate = function (contour) {
    this.contour = contour;
    this.hull = CV.convexHull(contour);
    this.defects = CV.convexityDefects(contour, this.hull);
};

HandTracker.Skinner = function () {
};

HandTracker.Skinner.prototype.mask = function (imageSrc, imageDst) {
    var src = imageSrc.data, dst = imageDst.data, len = src.length,
        i, j = 0,
        r, g, b, h, s, v, value, isSkinPixel = false;

    for (i = 0; i < len; i += 4) {
        r = src[i];
        g = src[i + 1];
        b = src[i + 2];

        v = Math.max(r, g, b);
        s = v === 0 ? 0 : 255 * ( v - Math.min(r, g, b) ) / v;
        h = 0;

        if (0 !== s) {
            if (v === r) {
                h = 30 * (g - b) / s;
            } else if (v === g) {
                h = 60 + ( (b - r) / s);
            } else {
                h = 120 + ( (r - g) / s);
            }
            if (h < 0) {
                h += 360;
            }
        }

        value = 0;

        isSkinPixel = (v >= 15 && v <= 250) && (h >= 3 && h <= 33);
        if (isSkinPixel) {
            value = 255;
        }

        dst[j++] = value;
        isSkinPixel = false;
    }

    imageDst.width = imageSrc.width;
    imageDst.height = imageSrc.height;

    return imageDst;
};

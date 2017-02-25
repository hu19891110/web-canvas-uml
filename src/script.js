/**
 * Created by mafz on 25/02/2017.
 */
const REC_WIDTH = 20;
const REC_HEIGHT = 20;
const TRI_WIDTH = 10;
const TRI_HEIGHT = 10;
var canvas = new fabric.Canvas('canvas');

resizeCanvas();

// we need this here because this is when the canvas gets initialized
['object:moving', 'object:scaling'].forEach(addChildMoveLine);

function addRect() {
    var rect = new fabric.Rect({
        left: 100,
        top: 100,
        fill: 'blue',
        width: REC_WIDTH,
        height: REC_HEIGHT
    });
    canvas.add(rect);
}

function addChild() {
    canvas.addChild = {
        start: canvas.getActiveObject()
    };

    // for when addChild is clicked twice
    canvas.off('object:selected', addChildLine);
    canvas.on('object:selected', addChildLine);
}

function deleteObject() {
    var object = canvas.getActiveObject();

    // remove lines (if any)
    if (object.addChild) {
        if (object.addChild.from)
        // step backwards since we are deleting
            for (var i = object.addChild.from.length - 1; i >= 0; i--) {
                var line = object.addChild.from[i];
                line.addChildRemove();
                line.remove();
            }
        if (object.addChild.to)
            for (var i = object.addChild.to.length - 1; i >= 0; i--) {
                var line = object.addChild.to[i];
                line.addChildRemove();
                line.remove();
            }
    }

    object.remove();
}

function calcArrowAngle(x1, y1, x2, y2) {
    var angle = 0,
        x, y;

    x = (x2 - x1);
    y = (y2 - y1);

    if (x === 0) {
        angle = (y === 0) ? 0 : (y > 0) ? Math.PI / 2 : Math.PI * 3 / 2;
    } else if (y === 0) {
        angle = (x > 0) ? 0 : Math.PI;
    } else {
        angle = (x < 0) ? Math.atan(y / x) + Math.PI : (y < 0) ? Math.atan(y / x) + (2 * Math.PI) : Math.atan(y / x);
    }

    return (angle * 180 / Math.PI + 90);
}

function addChildLine(options) {
    canvas.off('object:selected', addChildLine);

    // add the line
    var fromObject = canvas.addChild.start;
    var toObject = options.target;
    var from = fromObject.getCenterPoint();
    var to = toObject.getCenterPoint();
    var fromX = from.x;
    var fromY = from.y;
    var toX = to.x;
    var toY = to.y;

    var dis = REC_WIDTH/2 + TRI_WIDTH;

    if(fromX < toX) {
        fromX += REC_WIDTH/2;
        toX -= dis;
    } else {
        fromX -= REC_WIDTH/2;
        toX += dis;
    }

    var line = new fabric.Line([fromX, fromY, toX, toY], {
        fill: 'red',
        stroke: 'red',
        strokeWidth: 2,
        selectable: false
    });

    // wth are these used for???
    centerX = (from.x + to.x)/2;
    centerY = (from.y + to.y)/2;
    deltaX = line.left - centerX;
    deltaY = line.top - centerY;

    triangle = new fabric.Triangle({
        left: line.x2,
        top: line.y2,
        angle: calcArrowAngle(line.x1, line.y1, line.x2, line.y2),
        originX: 'center',
        originY: 'center',
        hasBorders: false,
        hasControls: false,
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true,
        pointType: 'arrow_start',
        width: TRI_WIDTH,
        height: TRI_HEIGHT,
        fill: 'red',
        selectable: false
    });

    canvas.add(line, triangle);

    //canvas.add(line);
    // so that the line is behind the connected shapes
    //line.sendToBack();

    // add a reference to the line to each object
    fromObject.addChild = {
        // this retains the existing arrays (if there were any)
        from: (fromObject.addChild && fromObject.addChild.from) || [],
        to: (fromObject.addChild && fromObject.addChild.to)
    };
    fromObject.addChild.from.push(line);
    toObject.addChild = {
        from: (toObject.addChild && toObject.addChild.from),
        to: (toObject.addChild && toObject.addChild.to) || []
    };
    toObject.addChild.to.push(line);

    // to remove line references when the line gets removed
    line.addChildRemove = function() {
        fromObject.addChild.from.forEach(function(e, i, arr) {
            if (e === line)
                arr.splice(i, 1);
        });
        toObject.addChild.to.forEach(function(e, i, arr) {
            if (e === line)
                arr.splice(i, 1);
        });
    };

    // undefined instead of delete since we are anyway going to do this many times
    canvas.addChild = undefined;
}

function addChildMoveLine(event) {
    canvas.on(event, function(options) {
        var object = options.target;
        var objectCenter = object.getCenterPoint();

        /* TODO
            1. Fix issues when boxes are moved around arrow needs to move around box
            2. Bug when boxes are moved arrow prints remain on canvas
            3. If boxes have two lines connected to each other -> distinguish
        */

        // udpate lines (if any)
        if (object.addChild) {
            if (object.addChild.from) {
                object.addChild.from.forEach(function(line) {
                    var x = objectCenter.x;
                    line.set({
                        'x1': x < line.x1 ? x += REC_WIDTH/2 : x -= REC_WIDTH/2,
                        'y1': objectCenter.y
                    });
                    triangle.set({
                        'left': line.x2, 'top': line.y2,
                        'angle': calcArrowAngle(line.x1, line.y1, line.x2, line.y2)
                    });
                });
            }
            if (object.addChild.to){
                object.addChild.to.forEach(function(line) {
                    var x = objectCenter.x;
                    var dis = REC_WIDTH/2 + TRI_WIDTH;
                    line.set({
                        'x2': x > line.x2 ? x -= dis : x += dis,
                        'y2': objectCenter.y
                    });
                    triangle.set({
                        'left': line.x2, 'top': line.y2,
                        'angle': calcArrowAngle(line.x1, line.y1, line.x2, line.y2)
                    });
                });
            }
        }

        canvas.renderAll();
    });
}

function calibrateLineX(from, to) {
    if(from < to) {
        from += REC_WIDTH/2;
        tp -= REC_WIDTH;
    } else {
        from -= REC_WIDTH/2;
        to += REC_WIDTH;
    }
    return {from:from, to:to}
}

$(window).resize(resizeCanvas);

function resizeCanvas(){
    if($('canvas').height >= $('canvas').maxHeight) {
        $('canvas').setProperty('width', '800px', 'important')
    }
    $('canvas').height($('canvas').width() / 2.031);
    $('.canvas-container').height($('canvas').width() / 2.031);
}

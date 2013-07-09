var app = {
  md5Path: null,

  reloadIfMd5SumChanged: function(data) {
    var newMd5Sum = parseInt(data, 16);
    if (app.md5Sum != newMd5Sum) {
      console.log('md5sum changed: ' + app.md5Sum + ' -> ' + newMd5Sum);
      console.log('reload');
      location.reload();
    }
  },

  md5Sum: null,

  maybeReload: function() {
    if ($('input#reload').is(':checked')) {
      $.get(app.md5Path, app.reloadIfMd5SumChanged).
        fail(function() { 'md5 check failed'; }).
        always(function() { 'md5 check done'; });
    } else {
      console.log('no reload');
    }
  },

  setMd5Sum: function(newSum) {
    app.md5Sum = newSum;
  },

  // Id of interval-checking for new content to reload. 
  execution: null,

  // Outputting object's coordinates (in console's log) every time object is moved
  setupMouseEvents: function(canvas) {
    canvas.on('object:moving', function(e) {
      var activeObject = e.target;
      // just a demo
      // console.log('Object moving:' + activeObject.get('left'), activeObject.get('top'));
    });

    canvas.on('object:over', function(e) {
      var activeObject = e.target;
      // just a demo
      // console.log('Object Hover:' + activeObject.get('left'), activeObject.get('top'));
    });


    // piggyback on `canvas.findTarget`, to fire "object:over" and "object:out" events
    canvas.findTarget = (function(originalFn) {
      return function() {
        var target = originalFn.apply(this, arguments);
        if (target) {
          if (this._hoveredTarget !== target) {
            canvas.fire('object:over', { target: target });
            if (this._hoveredTarget) {
              canvas.fire('object:out', { target: this._hoveredTarget });
            }
            this._hoveredTarget = target;
          }
        }
        else if (this._hoveredTarget) {
          canvas.fire('object:out', { target: this._hoveredTarget });
          this._hoveredTarget = null;
        }
        return target;
      };
    })(canvas.findTarget);

    //piggyback on mouseup for object mouseup
    canvas._onMouseUp = (function(originalFn) {
      return function(e) {
        _this = canvas;
        _this.__onMouseUp(e);
        if (_this.getActiveObject()) {
          _this.fire('object:mouseup', { target: _this.getActiveObject() }, e);  
        }
        removeListener = fabric.util.removeListener;
        addListener = fabric.util.addListener;
        
        removeListener(fabric.document, 'mouseup', _this._onMouseUp);
        fabric.isTouchSupported && removeListener(fabric.document, 'touchend', _this._onMouseUp);
        
        removeListener(fabric.document, 'mousemove', _this._onMouseMove);
        fabric.isTouchSupported && removeListener(fabric.document, 'touchmove', _this._onMouseMove);

        addListener(_this.upperCanvasEl, 'mousemove', _this._onMouseMove);
        fabric.isTouchSupported && addListener(_this.upperCanvasEl, 'touchmove', _this._onMouseMove);
      };
    })(canvas.setActiveObject);
  },
 
  makeCanvas: function() {
    return new fabric.Canvas('main-canvas', {
      selection: false,
      selectionColor: 'rgba(210, 210, 210, 0.3)',
      selectionLineWidth: 2
    });
  },

  makeGroup: function(members, config) {
    return new fabric.Group(members, $.extend({
        perPixelTargetFind : true,
        hasControls : false,
        hasBorders : false
        }, config));
  },

  call: function() { 
    var canvas = app.makeCanvas();
    app.setupMouseEvents(canvas);
    app.md5Path = $('input#md5path').val(),
    $.get(app.md5Path, function(data) { app.setMd5Sum(parseInt(data, 16)); });
    var red = "#a80000";
    var green = "#00a800";
    var blue = "#0000a8";
    var black = "#000000";
    var white = "#ffffff";
    var grey = "#bfbfbf";
    var diam = 30;
    var altitude = Math.sqrt(3)/2;
    function triangle(config) {
        return new fabric.Triangle($.extend({
          //hasBorders: true,
          //borderColor: black,
          width: diam,
          height: diam * altitude,
          perPixelTargetFind: true,
          hasControls: false
        }, config));
    }
  
    function shallowcopy(obj) {
      return $.extend({}, obj);
    }
  
    // Calisson shapes
    function calisson(internal, loco, cabo, external) {
      var t1 = triangle($.extend($.extend({flipY: false, angle: 90}, internal), loco));
      var t2 = triangle($.extend($.extend({flipY: false, angle: -90},
      internal), cabo));
      return app.makeGroup([t1,t2], external);
    } 
    function ca() {
      return calisson(
        {fill: red},
        {},
        {left: -diam*altitude}
      ); 
    }
    function cb() {
      return calisson(
        {fill: green},
        {},
        {top: diam/2 * altitude, left: 0}
      ); 
    }
    function cc() {
      return calisson(
        {fill: blue},
        {},
        {top: -diam/2 , left: 0}
      ); 
    }
  
    function getOffset(config) {
      return { 
         // constants determined via trial and error.
        top: config.top + -diam/4 + 1 +
          (config.top-config.radius) * (altitude+1) ,
        left: config.left +
         -diam/4+ -1*(config.left-config.radius)
      }
    }
  
    function relativeToGrid(config,gridConfig) {
      var adjusted =  { 
         // constants determined via trial and error.
        top:  gridConfig.top + 
        (config.top) * diam + 5 +
        // 0*(config.top/2-gridConfig.radius) * altitude +
        0,
        left: gridConfig.left +
        (config.left) * diam*altitude +
        // 0*(config.left/2-gridConfig.radius) _
        0
      }
      //console.log(JSON.stringify(config));
      //console.log(JSON.stringify(gridConfig));
      //console.log(JSON.stringify(adjusted));
      return adjusted;
    }
  
    function adjustOffset(config, radius) {
      var config = $.extend(config, relativeToGrid(config, radius));
      return config;
    };
  
    function gridTriangle(config) {
      var triangleConfig = shallowcopy({opacity:0.9,
      fill: (config.type == 'extreme' ? grey : grey), angle: 90});
      triangleConfig.flipY = config.flipY;
      var offset = getOffset(config);
      $.extend(triangleConfig, {
          top: (-(config.radius-0.5) +config.top)*altitude*diam + offset.top ,
          left: (config.left-0.5)*altitude*diam + offset.left
      });
      return triangle(triangleConfig);
    }
  
    function grid(gridConfig) {
      var gr = gridConfig.radius;
      var triangles = [];
      var ad = altitude * diam;
      var configs;
  
      for (var row = 0; row < gr; row++ ) {
        for (var col = 0; col < (row+1)*2; col++) {
          var even = col %2 == 0;
          configs = [
                { top: row * 0.5, left:col-row, flipY: even},
                { top: 2*gr - (1+ row * 0.5), left:col-row, flipY: even},
            ];
            for (var i = 0; i < configs.length; i++ ) {
              var config = configs[i];
              config.row = row;
              config.col = col;
              config.radius = gr;
              config.type = 'extreme';
              var triangle = gridTriangle(config);
              if (triangle) { triangles.push(triangle); }
            }
          }
      }
  
      for (var row = 0; row <= (gr-1)*2; row++ ) {
        for (var col = 0; col < gr*2; col++) {
          var even = (row+col) %2 == 0;
          configs = [
                { top: gr/2 + (row) * 0.5, left:-gr+col+1, flipY: !even},
            ];
            for (var i = 0; i < configs.length; i++ ) {
              var config = configs[i];
              config.row = row;
              config.col = col;
              config.radius = gr;
              config.type = 'middle';
              var triangle = gridTriangle(config);
              if (triangle) { triangles.push(triangle); }
            }
          }
      }
 
      console.log("" + triangles.length + " triangles in grid");
      triangles.push(new fabric.Circle({ fill: 'red', radius: 5, width: 5}));
      return app.makeGroup(triangles, {
        selectable: false,
        top: gridConfig.top,
        left: gridConfig.left});
    }
  
    app.gridConfig = { 
      top: 300,
      left: 300,
      radius: 6
    };
    var gridConfig = app.gridConfig;
  
  
    function drawCorners() {
      // valid positions are those with (top+left)%2 == 1
      var generator = function() { return ca() };
      for (var row = 0; row < gridConfig.radius+1; row++) {
        for (var col = -row/2+0.5; col < row/2; col++) {
          canvas.add(generator().set(adjustOffset({top: row/2 - .5, left: col*2}, gridConfig)));
        }
      }
      for (var row = 0; row < gridConfig.radius; row++) {
        for (var col = -row/2+0.5; col < row/2; col++) {
          canvas.add(generator().set(adjustOffset({top: gridConfig.radius-row/2 - .5, left: col*2}, gridConfig)));
        }
      }
      var generator = function() { return cb() };
      for (var row = 0; row < gridConfig.radius; row++) {
        for (var col = 0; col < gridConfig.radius; col++) {
          var config = adjustOffset({
            top: -row+col/2 - .5, left: col+0.5
          }, gridConfig);
          canvas.add(generator().set(config));
        }
      }
      var generator = function() { return cc() };
      for (var row = 0; row < gridConfig.radius; row++) {
        for (var col = 0; col < gridConfig.radius; col++) {
          var config = adjustOffset({
            top: -row+col/2 - .5, left: -(col+0.5)
          }, gridConfig);
          canvas.add(generator().set(config));
        }
      }
    }
  
    function draw() {
      canvas.add(grid(gridConfig));
      drawCorners();
  
      console.log(canvas._objects);
      canvas.renderAll();
    }
  
    function main() {
      var timer = Math.max(5, $('input#reload-every').val());
      console.log('Checking for updates every ' + timer + ' seconds.');
      execution = setInterval(app.maybeReload, timer * 1000);
      try {
        console.log('Calisson!');
        draw();
      } catch (e) {
        console.log(e);
        console.log(e.trace);
        throw e;
      }
    }
  
    main();
  }
};

$(app.call);

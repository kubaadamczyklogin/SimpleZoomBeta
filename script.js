(function ($) {
  var SimpleZoom = function (options, $container, $img, img) {
    var SimpleZoom = this;

    var settings = $.extend(
      {
        zoomModifier: 1.25
      },
      options
    );

    var startSize,
      maxSize,
      containerSize,
      startPosition,
      currentPosition,
      notUsed = true,
      sizes = [],
      zoomLevel = 0,
      beyond = { x: false, y: false },
      pinchZoom;

    SimpleZoom.load = function () {
      if (img.naturalHeight !== 0) {
        SimpleZoom.initialize();
      } else {
        $img.on("load.simpleZoomLoaded", function () {
          SimpleZoom.initialize();
        });
      }
    };

    SimpleZoom.initialize = function () {
      SimpleZoom.setParameters();
      SimpleZoom.setSteps();
      SimpleZoom.setDefaultCss();
      SimpleZoom.addControlls();
      SimpleZoom.bindWheel();
      SimpleZoom.bindMoving();
      SimpleZoom.bindPinch();
    };

    SimpleZoom.setParameters = function () {
      startSize = { x: img.width, y: img.height };
      maxSize = { x: img.naturalWidth, y: img.naturalHeight };
      containerSize = { x: $container.width(), y: $container.height() };
      startPosition = {
        x: parseInt($img.position().left),
        y: parseInt($img.position().top)
      };
      currentPosition = startPosition;
    };

    SimpleZoom.setDefaultCss = function () {
      $container.css({
        display: "block"
      });

      $container.addClass("smallest");

      $img.css({
        display: "block",
        maxWidth: "unset",
        maxHeight: "unset",
        position: "absolute",
        top: startPosition.y + "px",
        left: startPosition.x + "px",
        width: startSize.x + "px",
        height: startSize.y + "px"
      });
    };

    SimpleZoom.setSteps = function () {
      var tempSizes = [],
        tempX = startSize.x;

      while (tempX < maxSize.x) {
        tempSizes.push(tempX);
        tempX = Math.floor(tempX * settings.zoomModifier);
      }

      zoomSteps = tempSizes.length - 1;

      var maxTempSize = tempSizes[zoomSteps];

      sizes = tempSizes.map(function (item, index) {
        var newX;

        if (index === 0) {
          newX = item;
        } else {
          newX =
            item +
            Math.floor(
              ((maxSize.x - maxTempSize) / (maxTempSize - startSize.x)) *
                (item - startSize.x)
            );
        }

        return {
          x: newX,
          y: Math.floor((startSize.y / startSize.x) * newX)
        };
      });
    };

    SimpleZoom.addControlls = function () {
      var controlls =
        "<div class='controlls'><div class='zoomIn'>+</div><div class='zoomOut'>-</div></div>";
      $container.append(controlls);
      $container.find(".zoomIn").click(SimpleZoom.zoomIn);
      $container.find(".zoomOut").click(SimpleZoom.zoomOut);
    };

    SimpleZoom.sizeChange = function () {
      beyond.x = sizes[zoomLevel].x > containerSize.x ? true : false;
      beyond.y = sizes[zoomLevel].y > containerSize.y ? true : false;

      $img.animate(
        {
          left: currentPosition.x,
          top: currentPosition.y,
          width: sizes[zoomLevel].x,
          height: sizes[zoomLevel].y
        },
        200,
        function () {
          SimpleZoom.animateAfterChange();
        }
      );
    };

    SimpleZoom.animateAfterChange = function () {
      var animateAfter = false;

      if (beyond.x) {
        if (currentPosition.x > 0) {
          animateAfter = true;
          currentPosition.x = 0;
        } else if (currentPosition.x + sizes[zoomLevel].x < containerSize.x) {
          animateAfter = true;
          currentPosition.x = -(sizes[zoomLevel].x - containerSize.x);
        }
      } else {
        if (currentPosition.x < 0) {
          animateAfter = true;
          currentPosition.x = 0;
        } else if (currentPosition.x + sizes[zoomLevel].x > containerSize.x) {
          animateAfter = true;
          currentPosition.x = containerSize.x - sizes[zoomLevel].x;
        }
      }
      if (beyond.y) {
        if (currentPosition.y > 0) {
          animateAfter = true;
          currentPosition.y = 0;
        } else if (currentPosition.y + sizes[zoomLevel].y < containerSize.y) {
          animateAfter = true;
          currentPosition.y = -(sizes[zoomLevel].y - containerSize.y);
        }
      } else {
        if (currentPosition.y < 0) {
          animateAfter = true;
          currentPosition.y = 0;
        } else if (currentPosition.y + sizes[zoomLevel].y > containerSize.y) {
          animateAfter = true;
          currentPosition.y = containerSize.y - sizes[zoomLevel].y;
        }
      }

      if (animateAfter)
        $img.animate({ left: currentPosition.x, top: currentPosition.y }, 300);
    };

    SimpleZoom.zoomIn = function () {
      if (zoomLevel < zoomSteps) {
        if (notUsed) {
          notUsed = false;
        }
        zoomLevel++;
        $container.removeClass("smallest");
        currentPosition.x =
          currentPosition.x - (sizes[zoomLevel].x - sizes[zoomLevel - 1].x) / 2;
        currentPosition.y =
          currentPosition.y - (sizes[zoomLevel].y - sizes[zoomLevel - 1].y) / 2;
        SimpleZoom.sizeChange();
        if (zoomLevel === zoomSteps) $container.addClass("biggest");
      }
    };

    SimpleZoom.zoomOut = function () {
      if (zoomLevel > 0) {
        zoomLevel--;
        $container.removeClass("biggest");
        currentPosition.x =
          currentPosition.x + (sizes[zoomLevel + 1].x - sizes[zoomLevel].x) / 2;
        currentPosition.y =
          currentPosition.y + (sizes[zoomLevel + 1].y - sizes[zoomLevel].y) / 2;
        SimpleZoom.sizeChange();
        if (zoomLevel < 1) $container.addClass("smallest");
      }
    };

    SimpleZoom.bindWheel = function () {
      var wheelZoom = false;

      $img.on("wheel", function (e) {
        e.preventDefault();
        if (!wheelZoom) {
          wheelZoom = true;
          if (e.originalEvent.deltaY < 0) {
            SimpleZoom.zoomIn();
          } else if (e.originalEvent.deltaY > 0) {
            SimpleZoom.zoomOut();
          }
          setTimeout(function () {
            wheelZoom = false;
          }, 200);
        }
      });
    };

    SimpleZoom.bindPinch = function () {
      var pinchDistance = { start: "", end: "" },
        pinchZoomFinished = false;

      $img
        .on("touchstart", function (e) {
          if (e.touches.length === 2) {
            pinchZoom = true;
            pinchDistance.start = Math.hypot(
              e.touches[0].pageX - e.touches[1].pageX,
              e.touches[0].pageY - e.touches[1].pageY
            );
          }
        })
        .on("touchmove", function (e) {
          if (pinchZoom) {
            pinchDistance.end = Math.hypot(
              e.touches[0].pageX - e.touches[1].pageX,
              e.touches[0].pageY - e.touches[1].pageY
            );
            if (!pinchZoomFinished) {
              if (pinchDistance.start + 20 < pinchDistance.end) {
                pinchZoomFinished = true;
                SimpleZoom.zoomIn();
              } else if (pinchDistance.start - 20 > pinchDistance.end) {
                SimpleZoom.zoomOut();
                pinchZoomFinished = true;
              }
            }
          }
        });

      $container.on("touchend", function () {
        if (pinchZoom) {
          pinchZoom = false;
          pinchZoomFinished = false;
        }
      });
    };

    SimpleZoom.bindMoving = function () {
      var moving = 0,
        cursorPosition = { x: "", y: "" },
        cursorNewPosition = { x: "", y: "" };

      $img
        .on("mousedown", function (e) {
          if (!notUsed) {
            e.preventDefault();
            moving = 1;
            cursorPosition.x = e.pageX;
            cursorPosition.y = e.pageY;
          }
        })
        .on("mousemove touchmove", function (e) {
          if (!notUsed && moving > 0 && !pinchZoom) {
            moving = 2;
            if (e.type == "touchmove")
              e =
                e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];

            cursorNewPosition.x = e.pageX - cursorPosition.x;
            cursorNewPosition.y = e.pageY - cursorPosition.y;
            $img.css({
              left: currentPosition.x + cursorNewPosition.x,
              top: currentPosition.y + cursorNewPosition.y
            });
          }
        })
        .on("touchstart", function (e) {
          if (e.touches.length < 2 && !notUsed) {
            e.preventDefault();
            var touch =
              e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
            moving = 1;
            cursorPosition.x = touch.pageX;
            cursorPosition.y = touch.pageY;
          }
        });

      $container.on("mouseup mouseleave touchend", function (e) {
        if (!notUsed && !pinchZoom && moving === 2) {
          currentPosition.x = currentPosition.x + cursorNewPosition.x;
          currentPosition.y = currentPosition.y + cursorNewPosition.y;
          cursorNewPosition = { x: 0, y: 0 };
          SimpleZoom.animateAfterChange();
        }
        moving = 0;
      });
    };

    SimpleZoom.load();
  };

  $.fn.simpleZoom = function (options) {
    return this.each(function () {
      var $container = $(this),
        $img = $(this).find("img"),
        img = $(this).find("img")[0];

      this.simpleZoom = new SimpleZoom(options, $container, $img, img);
    });
  };

  var test = $(".plugin-container");

  test.simpleZoom({ zoomModifier: 1.3 });
})(jQuery);

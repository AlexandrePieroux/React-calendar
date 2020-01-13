import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useContext,
  createRef,
  createContext
} from "react";

import "./Utils.css";

import moment from "moment";

Number.prototype.mod = function(n) {
  return ((this % n) + n) % n;
};

function preventGlobalMouseEvents() {
  document.body.style["pointer-events"] = "none";
}

function restoreGlobalMouseEvents() {
  document.body.style["pointer-events"] = null;
}

function displayOnTwoDigits(number) {
  return ("0" + number).slice(-2);
}

/**
 *
 * Functions
 *
 */
export function getDOMElementAtPos(className, x, y) {
  var elements = document.getElementsByClassName(className);
  for (var i = 0; i < elements.length; i++) {
    var rect = elements[i].getBoundingClientRect();
    if (
      y >= rect.top &&
      y <= rect.bottom &&
      x >= rect.left &&
      x <= rect.right
    ) {
      return elements[i];
    }
  }
}

export function getTodayDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function getDaysOfWeek(current) {
  var week = [];
  const currentDate = new Date(current);
  currentDate.setHours(0, 0, 0, 0);
  currentDate.setDate(
    currentDate.getDate() - (currentDate.getDay() - 1).mod(7)
  );
  for (var i = 0; i < 7; i++) {
    week.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return week;
}

export function getTimezoneStringShort() {
  require("moment-timezone");
  var timezone = moment.tz.guess();
  timezone = moment.tz(timezone).format("z");
  return timezone;
}

export function getElementByDataId(className, attr, id) {
  const elements = document.getElementsByClassName(className);
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].getAttribute(attr) === id) return elements[i];
  }
}

export function getHourString(date) {
  return `${displayOnTwoDigits(date.getHours())}:${displayOnTwoDigits(
    date.getMinutes()
  )}`;
}

/**
 *
 * Component
 *
 */
export const InputOverlay = props => {
  const { onMouseDown, onMouseUp, onClick, setOverlayRef, ...other } = props;

  const ref = createRef();

  const setRef = r => {
    if (setOverlayRef) setOverlayRef(r);
    ref.current = r;
  };

  const onMouseDownHandler = e => {
    if (e.target !== ref.current) return;

    preventGlobalMouseEvents();
    if (onMouseDown) onMouseDown(e);
    window.addEventListener("mouseup", onMouseUpHandler);
  };

  const onMouseUpHandler = e => {
    restoreGlobalMouseEvents();
    if (onMouseUp) onMouseUp(e);
    window.removeEventListener("mouseup", onMouseUpHandler);
  };

  return (
    <div
      {...other}
      ref={setRef}
      className="col input-overlay"
      onMouseDown={onMouseDownHandler}
    />
  );
};

const BRCContext = createContext();

const BRCBody = props => {
  const { className, ...other } = props;
  const { resizableContainerRef, compStyle } = useContext(BRCContext);

  return (
    <div
      {...other}
      ref={resizableContainerRef}
      className={"bottom-resizable-container " + (className || "")}
      style={compStyle}
    >
      {props.children}
    </div>
  );
};

const BRCResizeZone = props => {
  const { startResize } = useContext(BRCContext);
  return (
    <div className="resize-zone" onMouseDown={startResize}>
      {props.children}
    </div>
  );
};

export const BottomResizableContainer = props => {
  const {
    heightModulo = 1,
    onHeightChange = null,
    onHeightChangeStop = null,
    resizeOnCreation = false,
    style
  } = props;

  const [compStyle, setCompStyle] = useState(style);

  const resizableContainerRef = useRef();
  const resizeOnCreationRef = useRef(resizeOnCreation);
  const isResizingRef = useRef(resizeOnCreation);

  const resize = useCallback(
    e => {
      if (
        resizableContainerRef.current &&
        isResizingRef.current &&
        heightModulo !== 0
      ) {
        var boundingRect = resizableContainerRef.current.getBoundingClientRect();
        var height = e.offsetY - boundingRect.top;
        var heightSnapped = Math.ceil(height / heightModulo) * heightModulo;

        if (heightSnapped > height && heightSnapped >= heightModulo) {
          setCompStyle({ ...compStyle, height: heightSnapped + "px" });
          onHeightChange(heightSnapped);
        }
      }
    },
    [heightModulo, onHeightChange, compStyle]
  );

  const stopResize = useCallback(
    e => {
      restoreGlobalMouseEvents();
      isResizingRef.current = false;

      if (onHeightChangeStop && resizableContainerRef.current) {
        var boundingRect = resizableContainerRef.current.getBoundingClientRect();
        onHeightChangeStop(boundingRect.height);
      }

      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResize);
    },
    [resize, onHeightChangeStop]
  );

  const initResizing = useCallback(() => {
    preventGlobalMouseEvents();
    isResizingRef.current = true;
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResize);
  }, [resize, stopResize]);

  const startResize = useCallback(
    e => {
      if (typeof e.button === "number" && e.button !== 0) return false;
      initResizing();
    },
    [initResizing]
  );

  const value = useMemo(
    () => ({
      compStyle,
      resizableContainerRef,
      startResize
    }),
    [compStyle, startResize]
  );

  // Allow resizing at creation of the event
  if (resizeOnCreationRef.current) {
    initResizing();
    resizeOnCreationRef.current = false;
  }

  return (
    <BRCContext.Provider value={value}>{props.children}</BRCContext.Provider>
  );
};

BottomResizableContainer.Body = BRCBody;
BottomResizableContainer.ResizeZone = BRCResizeZone;

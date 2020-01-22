import { loadCSS } from "fg-loadcss";
import DateFnsUtils from "@date-io/date-fns";

import {
  Grid,
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl
} from "@material-ui/core";
import { SpeedDial, SpeedDialIcon, SpeedDialAction } from "@material-ui/lab";
import { FileCopyIcon, ShareIcon, UserIcon } from "@material-ui/icons";
import { makeStyles } from "@material-ui/core/styles";
import { DateTimePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo
} from "react";

import {
  getDOMElementAtPos,
  getTodayDate,
  getDaysOfWeek,
  getTimezoneStringShort,
  getElementByDataId,
  getHourString,
  InputOverlay,
  BottomResizableContainer
} from "./Utils";

import "./Calendar.css";

/**
 * Function Utils
 */

const viewEnum = {
  DAY: 0,
  WEEK: 1,
  MONTH: 2
};

function preProcessEvents(events) {
  return events.map(e => {
    e.startDate = new Date(e.startDate);
    e.endDate = new Date(e.endDate);
    return e;
  });
}

/**
 * Components utils
 */
const CalendarDayHeaderDay = ({ day, onClickCallBack }) => {
  const todayDate = new Date().getDate();
  return (
    <Grid item className="border-cell" key={day} xs>
      <Box className="day-name">
        {day.toLocaleString(window.navigator.language, {
          weekday: "short"
        })}
      </Box>
      <Box
        className={
          day.getDate() === todayDate ? "day-number today" : "day-number"
        }
        onClick={onClickCallBack}
      >
        {day.getDate()}
      </Box>
    </Grid>
  );
};

const CalendarWeekHeader = ({ day, onClickCallBack }) => (
  <Grid container item className="calendar-header">
    {/** Timezone cell */}
    <Grid item className="timezone-cell">
      <Box component="span">{getTimezoneStringShort()}</Box>
    </Grid>
    <Grid item className="header-offset border-cell">
      <Box>&nbsp;</Box>
    </Grid>

    {/** Day cells */}
    {getDaysOfWeek(day).map(weekDay => (
      <CalendarDayHeaderDay
        key={"calendar-header-day-" + weekDay.getDay()}
        day={weekDay}
        onClickCallBack={() => onClickCallBack(weekDay)}
      />
    ))}
  </Grid>
);

const CalendarDayHeaderCol = ({ setRowReference, children }) => {
  return (
    <Grid container item className="calendar-body">
      {/* Row overlay (display only)*/}
      <Grid container direction="column" className="cell-rows">
        <Box
          ref={setRowReference}
          className="hour-row"
          key="cell-0"
          data-row-id="0"
        >
          &nbsp;
        </Box>
        {[...Array(23).keys()].map(hourCell => (
          <Box
            className="hour-row"
            key={"cell-" + (hourCell + 1)}
            data-row-id={hourCell + 1}
          >
            &nbsp;
          </Box>
        ))}
      </Grid>

      {/* Hour header display column */}
      <Grid
        item
        container
        direction="column"
        className="hours-col"
        style={{ width: 40 }}
      >
        <Grid item className="hour-cell">
          &nbsp;
        </Grid>
        {[...Array(23).keys()].map(hourOfDay => (
          <Grid item className="hour-cell" key={hourOfDay}>
            <Box component="span">{hourOfDay + 1}:00</Box>
          </Grid>
        ))}
      </Grid>

      {children}
    </Grid>
  );
};

const CalendarDayCol = ({ dayOfWeek, setColReference, children }) => (
  <Grid
    container
    item
    ref={setColReference}
    className="day-col"
    key={"col-" + dayOfWeek.getTime()}
    data-col-id={dayOfWeek.getTime()}
    xs
  >
    {children}
  </Grid>
);

const CalendarEventModal = props => {
  const { open, calEvent, onCreate, onCancel } = props;

  const useStyles = makeStyles(theme => ({
    formControl: {
      marginTop: theme.spacing(2),
      minWidth: 120
    },
    formControlLabel: {
      marginTop: theme.spacing(1)
    }
  }));

  const classes = useStyles();
  const [openState, setOpenState] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    setStartDate(calEvent.startDate);
    setEndDate(calEvent.endDate);
  }, [calEvent.startDate, calEvent.endDate]);

  useEffect(() => {
    setOpenState(open);
  }, [open]);

  const reset = useCallback(
    e => {
      setTitle("");
      setDescription("");
      setLocation("");
    },
    [setTitle, setDescription, setLocation]
  );

  const closeHandler = useCallback(
    e => {
      setOpenState(false);
      if (calEvent && onCancel) onCancel(calEvent);
      reset();
    },
    [onCancel, calEvent, reset]
  );

  const createHandler = useCallback(
    e => {
      setOpenState(false);
      var newEvent = Object.assign({}, calEvent);
      newEvent = Object.assign(newEvent, {
        title: title,
        description: description,
        location: location,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });

      if (onCreate) onCreate(newEvent);
      reset();
    },
    [
      calEvent,
      onCreate,
      title,
      description,
      location,
      startDate,
      endDate,
      reset
    ]
  );

  return (
    <Dialog open={openState} aria-labelledby="form-dialog-title" fullWidth>
      <FormControl className={classes.formControl}>
        <DialogContent>
          <TextField fullWidth required autoFocus id="name" label="Title" />
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <DateTimePicker
              variant="inline"
              label="Start"
              value={startDate}
              onChange={date => setStartDate(date)}
            />
            <DateTimePicker
              variant="inline"
              label="End"
              value={endDate}
              onChange={date => setEndDate(date)}
            />
          </MuiPickersUtilsProvider>
          <TextField fullWidth id="location" label="Location" />
          <TextField fullWidth multiline id="description" label="Description" />
        </DialogContent>

        <DialogActions>
          <Button onClick={closeHandler} color="primary">
            Cancel
          </Button>
          <Button onClick={createHandler} color="primary">
            Create
          </Button>
        </DialogActions>
      </FormControl>
    </Dialog>
  );
};

const CalendarEventPopover = props => {
  const { open, calEvent } = props;

  const useStyles = makeStyles(theme => ({
    speedDial: {
      position: "absolute",
      "&.MuiSpeedDial-directionUp, &.MuiSpeedDial-directionLeft": {
        bottom: theme.spacing(2),
        right: theme.spacing(2)
      },
      "&.MuiSpeedDial-directionDown, &.MuiSpeedDial-directionRight": {
        top: theme.spacing(2),
        left: theme.spacing(2)
      }
    }
  }));

  const actions = [
    { icon: <FileCopyIcon />, name: "Copy" },
    { icon: <ShareIcon />, name: "Share" }
  ];

  const classes = useStyles();
  const [openState, setOpenState] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);

  const handleAction = action => e => {
    switch (action.name) {
      case "Copy":
        console.log("Copy event");
        break;
      case "Share":
        console.log("Share event");
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    setOpenState(open);
  }, [open]);

  return (
    <Dialog open={openState} aria-labelledby="form-dialog-title">
      <DialogTitle id="form-dialog-title">
        <span className="text">{calEvent.title}</span>

        <SpeedDial
          ariaLabel="SpeedDial example"
          className={classes.speedDial}
          icon={<SpeedDialIcon />}
          onClose={() => setSpeedDialOpen(false)}
          onOpen={() => setSpeedDialOpen(true)}
          open={speedDialOpen}
          direction="down"
        >
          {actions.map(action => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={e => handleAction(action)(e)}
            />
          ))}
        </SpeedDial>
      </DialogTitle>
      <DialogContent>
        <MuiPickersUtilsProvider utils={DateFnsUtils}>
          <DateTimePicker
            variant="inline"
            label="Start"
            value={calEvent.startDate}
          />
          <DateTimePicker
            readOnly
            variant="inline"
            label="End"
            value={calEvent.endDate}
          />
        </MuiPickersUtilsProvider>

        <UserIcon />

        <strong>{calEvent.owner}</strong>

        <p>{calEvent.description}</p>

        <UserIcon />

        <p>{calEvent.location}</p>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenState(false)} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const CalendarEvent = props => {
  const {
    onHeightChangeStop,
    onClick,
    overlayBounds,
    dayWidth,
    minuteHeight,
    resizeOnCreation,
    startDate,
    endDate,
    setEndDate,
    title,
    description,
    owner,
    location,
    onEdit,
    onCopy,
    onDelete
  } = props;

  const getHeight = useCallback(() => {
    var heightTmp = Math.round(((endDate - startDate) * minuteHeight) / 60000);
    return heightTmp > 3 ? heightTmp - 3 : 0;
  }, [startDate, endDate, minuteHeight]);

  const getPosition = useCallback(() => {
    if (!overlayBounds)
      return {
        x: 0,
        y: 0
      };
    const weekDay = new Date(startDate);
    weekDay.setHours(0, 0, 0, 0);
    const day = getElementByDataId(
      "day-col",
      "data-col-id",
      weekDay.getTime().toString()
    );
    const dayBounds = day.getBoundingClientRect();

    const hourStart = startDate.getHours();
    const hour = getElementByDataId(
      "hour-row",
      "data-row-id",
      hourStart.toString()
    );
    const hourBounds = hour.getBoundingClientRect();

    return {
      x: dayBounds.left - overlayBounds.left,
      y:
        hourBounds.top -
        overlayBounds.top +
        minuteHeight * startDate.getMinutes()
    };
  }, [overlayBounds, startDate, minuteHeight]);

  const getLocalHourString = () => {
    return `${getHourString(startDate)} - ${getHourString(endDate)}`;
  };

  const [position, setPosition] = useState(getPosition());
  const [height, setHeight] = useState(getHeight());
  const [hourString, setHourString] = useState(getLocalHourString());
  const [className, setClassName] = useState("calendar-event-wrapper");

  // Only used update display of the tile
  useEffect(() => {
    // Reset position
    setPosition(getPosition());

    // Reset heigth
    setHeight(getHeight());
  }, [getPosition, getHeight]);

  const onHeightChangeStopHandler = useCallback(() => {
    // Callback end udpate
    if (onHeightChangeStop) onHeightChangeStop();

    setClassName("calendar-event-wrapper");
  }, [onHeightChangeStop]);

  const onHeightChange = useCallback(
    containerHeight => {
      var newEventDuration = Math.round(containerHeight / minuteHeight);
      var newEndDate = new Date(startDate);
      newEndDate.setMinutes(newEndDate.getMinutes() + newEventDuration);

      // Set the record new end date
      setEndDate(newEndDate);
      setHeight(containerHeight);

      // Set the modification style
      setClassName("calendar-event-wrapper calendar-event-edit");
      setHourString(
        `${getHourString(startDate)} - ${getHourString(newEndDate)}`
      );
    },
    [startDate, minuteHeight, setEndDate]
  );

  return (
    <BottomResizableContainer
      heightModulo={minuteHeight * 15}
      resizeOnCreation={resizeOnCreation}
      onHeightChange={onHeightChange}
      onHeightChangeStop={onHeightChangeStopHandler}
      style={{
        height: height + "px"
      }}
    >
      <Box
        onClick={onClick}
        className={className}
        style={{
          position: "absolute",
          width: dayWidth * 0.9 + "px",
          top: position.y + "px"
        }}
      >
        <BottomResizableContainer.Body>
          <Grid container item direction="column">
            <Box component="span" className="calendar-event">
              <strong>{title}</strong>
            </Box>
            <Box className="description-event mx-2">
              <p>{hourString}</p>
            </Box>
          </Grid>
        </BottomResizableContainer.Body>
        <BottomResizableContainer.ResizeZone />
      </Box>
    </BottomResizableContainer>
  );
};

const CalendarEventsOverlay = ({
  events,
  onEventCreation,
  onEventUpdate,
  onEventDelete,
  rowRef,
  colRef
}) => {
  const overlayRef = useRef();

  const getDimensions = useCallback(() => {
    if (!overlayRef.current || !rowRef.current || !colRef.current)
      return {
        overlayBounds: false,
        dayWidth: 0,
        minuteHeight: 0
      };

    var dayWidth = colRef.current.getBoundingClientRect();
    var minuteHeight = rowRef.current.getBoundingClientRect();

    return {
      overlayBounds: overlayRef.current.getBoundingClientRect(),
      dayWidth: dayWidth.width - 3,
      minuteHeight: minuteHeight.height / 60
    };
  }, [colRef, rowRef]);

  const [localEvents, setLocalEvents] = useState(events);
  const [modalShow, setModalShow] = useState(false);
  const [popoverShow, setPopoverShow] = useState(false);
  const [dimensions, setDimensions] = useState(getDimensions());
  const [selectedEvent, setSelectedEvent] = useState(false);
  const [overlayCreationMode, setOverlayCreationMode] = useState(false);

  /**
   * Utilites functions
   */
  const createEvent = useCallback(e => {
    var eventStartDay = getDOMElementAtPos("day-col", e.clientX, e.clientY);
    var eventStartHour = getDOMElementAtPos("hour-row", e.clientX, e.clientY);

    eventStartDay = new Date(parseInt(eventStartDay.dataset.colId, 10));
    eventStartDay.setHours(parseInt(eventStartHour.dataset.rowId, 10));

    const eventEnd = new Date(eventStartDay);
    const eventData = {
      renderKey: "event_" + new Date().getTime(),
      resizeOnCreation: true,
      startDate: eventStartDay,
      endDate: eventEnd,
      title: "",
      description: "",
      location: ""
    };

    return eventData;
  }, []);

  const updateTileLayout = useCallback(() => {
    if (overlayRef.current) {
      // Get all events that overlap wiht current one
      var elements = document.getElementsByClassName("calendar-event-wrapper");
      elements = Array.from(elements);

      // Sort by start date
      elements.sort(
        (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top
      );

      // Work in layer to display the event tiles
      var numLayer = 1;
      const makeLayer = (l, nl, z, b) => {
        if (l.length < 1) return;

        const e = l.shift();
        const rectE = e.getBoundingClientRect();
        e.style.border = b;
        e.style.borderRadius = "4px";
        e.style.zIndex = z.toString();

        // build current layer
        l.slice().forEach(i => {
          const rectI = i.getBoundingClientRect();
          if (rectE.bottom >= rectI.top) {
            nl.push(i);
            l.shift();
          } else {
            makeLayer(l, nl, z, b);
          }
        });

        // Build next layer
        if (nl.length > 0) {
          numLayer++;
          makeLayer(nl, [], z + 1, "1px solid white");
        }

        //Compute left offset and width
        var leftOffset = (100 * z) / numLayer;
        e.style.left = leftOffset + "%";
        var width = (dimensions.dayWidth * (90 - leftOffset)) / 100;
        width = width > 35 ? width : 35; // Min width
        e.style.width = width + "px";
      };

      // Recursion start point
      makeLayer(elements, [], 0, "");
    }
  }, [overlayRef, dimensions.dayWidth]);

  /**
   * Windows effect function
   */
  useEffect(() => {
    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {}, 250);
      setDimensions(getDimensions());
    }

    var resizeTimer;
    window.addEventListener("resize", handleResize);
    setDimensions(getDimensions());

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [setDimensions, getDimensions]);

  /**
   * Trigger event update
   */
  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  /**
   * Update tile layout as soon as the localEvents changes (create, update, delete)
   */
  useEffect(() => {
    updateTileLayout();
  });

  /**
   * InputOverlay CB functions
   */
  const overlayEventCreationStart = useCallback(
    e => {
      if (modalShow) return;
      setOverlayCreationMode(true);
      setSelectedEvent(createEvent(e));
    },
    [modalShow, setSelectedEvent, createEvent]
  );

  const overlayEventCreationStop = useCallback(e => {
    setModalShow(true);
    setOverlayCreationMode(false);
  }, []);

  /**
   * Modal CB functions
   */
  const eventCreationCancel = useCallback(
    e => {
      setSelectedEvent(false);
    },
    [setSelectedEvent]
  );

  const eventCreationConfirm = useCallback(
    e => {
      if (onEventCreation) {
        e.resizeOnCreation = false;
        onEventCreation(e);
        setSelectedEvent(false);
      }
    },
    [onEventCreation, setSelectedEvent]
  );

  /**
   * Event CB functions
   */
  const eventHeightChangeStop = useCallback(
    e => {
      if (!overlayCreationMode) {
        onEventUpdate(e, e);
      }
    },
    [overlayCreationMode, onEventUpdate]
  );

  const eventClick = useCallback(e => {
    setSelectedEvent(e);
    setPopoverShow(true);
  }, []);

  return (
    <InputOverlay
      onMouseDown={overlayEventCreationStart}
      onMouseUp={overlayEventCreationStop}
      setOverlayRef={r => (overlayRef.current = r)}
    >
      <CalendarTimeMarker
        overlayBounds={dimensions.overlayBounds}
        minuteHeight={dimensions.minuteHeight}
      />

      <CalendarEventModal
        open={modalShow}
        calEvent={selectedEvent}
        onCreate={eventCreationConfirm}
        onCancel={eventCreationCancel}
      />

      <CalendarEventPopover open={popoverShow} calEvent={selectedEvent} />

      {[...(selectedEvent ? [selectedEvent] : []), ...localEvents].map(e => (
        <CalendarEvent
          // Dimensions dataeventClick
          overlayBounds={dimensions.overlayBounds}
          dayWidth={dimensions.dayWidth}
          minuteHeight={dimensions.minuteHeight}
          // Event Callbacks
          onHeightChangeStop={() => eventHeightChangeStop(e)}
          onClick={() => eventClick(e)}
          onEdit={false}
          onCopy={false}
          onDelete={false}
          // Event data
          resizeOnCreation={e.resizeOnCreation}
          startDate={e.startDate}
          endDate={e.endDate}
          setEndDate={date => (e.endDate = date)}
          description={e.description}
          owner={"Admin"}
          location={e.location}
          // Props
          title={e.title}
          // Others
          key={e.renderKey || e.id}
        />
      ))}
    </InputOverlay>
  );
};

const CalendarTimeMarker = props => {
  const { overlayBounds, minuteHeight } = props;

  const getOffset = useCallback(() => {
    if (!overlayBounds) return 0;

    const now = new Date();
    const hour = now.getHours();
    const hourDOM = getElementByDataId(
      "hour-row",
      "data-row-id",
      hour.toString()
    );
    const bounds = hourDOM.getBoundingClientRect();

    return bounds.top - overlayBounds.top - 1 + now.getMinutes() * minuteHeight;
  }, [minuteHeight, overlayBounds]);

  const [offset, setOffset] = useState(getOffset());

  useEffect(() => {
    const timerId = setInterval(() => {
      setOffset(getOffset());
    }, 60000);

    setOffset(getOffset());
    return () => clearInterval(timerId);
  }, [setOffset, getOffset]);

  return (
    <div className="time-marker-wrapper" style={{ top: offset + "px" }}>
      <div className="time-marker-tip" />
      <div className="time-marker" />
    </div>
  );
};

/**
 * Calendar
 */
const Calendar = props => {
  /**
   * Should have the events processing:
   *  - Get the events from the API
   *  - Create a subset of events depending on view
   *
   * Control which view is displayed.
   *
   * View displayed is stored in state.
   * View chooser is in header
   */
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(getTodayDate());
  const [view, setView] = useState(viewEnum.DAY);

  // Load FontAwesome if not already
  useEffect(() => {
    loadCSS(
      "https://use.fontawesome.com/releases/v5.1.0/css/all.css",
      document.querySelector("#font-awesome-css")
    );
  }, []);

  // TODO: Does not re-render the events in GUI
  const createEvent = useCallback(
    newEvent => {
      setEvents([newEvent, ...events]);
      console.log("Event Creation");
      console.log(events);
    },
    [events, setEvents]
  );

  const updateEvent = useCallback(
    (oldEvent, newEvent) => {
      const key = oldEvent.renderKey || oldEvent.id;
      const id = oldEvent.renderKey ? "renderKey" : "id";

      const eventsCpy = [...events];
      const eventData = eventsCpy.find(event => event[id] === key);
      Object.assign(eventData, newEvent);

      setEvents(eventsCpy);
      console.log("Event Update");
      console.log(eventData);
    },
    [events, setEvents]
  );

  const cancelEvent = useCallback(
    oldEvent => {
      const key = oldEvent.renderKey || oldEvent.id;
      const id = oldEvent.renderKey ? "renderKey" : "id";
      setEvents(events.filter(event => event[id] !== key));

      console.log("Event Cancel");
      console.log(events);
    },
    [events, setEvents]
  );

  return (
    <Grid container>
      {/** Controls header */}
      <CalendarHeader changeView={setView} />

      {/** View mode selector */}
      {view === viewEnum.DAY && (
        <CalendarDayView
          day={selectedDay}
          events={events}
          createEvent={createEvent}
          updateEvent={updateEvent}
          cancelEvent={cancelEvent}
        />
      )}
    </Grid>
  );
};

const CalendarHeader = props => {
  /**
   * TODO
   */
  return <Grid container item />;
};

/**
 * Calendar Day View
 */
const CalendarDayView = props => {
  const { day, events, ...other } = props;
  const switchDayHandler = useCallback(selectedDay => {
    console.log(
      "Switch day to " +
        selectedDay.toLocaleString(window.navigator.language, {
          weekday: "short"
        })
    );
  }, []);

  const filteredEvents = useMemo(() => {
    var currentDay = new Date(day);
    currentDay.setHours(0, 0, 0, 0);

    var endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 99);

    return events.filter(
      e =>
        endOfDay.getTime() >= e.startDate.getTime() &&
        currentDay.getTime() <= e.endDate.getTime()
    );
  }, [day, events]);

  return (
    <Grid container item direction="column">
      <CalendarWeekHeader day={day} onClickCallBack={switchDayHandler} />
      <CalendarDayBody events={filteredEvents} day={day} {...other} />
    </Grid>
  );
};

const CalendarDayBody = props => {
  const {
    events,
    day,
    createEvent,
    updateEvent,
    cancelEvent,
    ...other
  } = props;
  const colRef = useRef();
  const rowRef = useRef();

  return (
    <CalendarDayHeaderCol
      {...other}
      setRowReference={r => (rowRef.current = r)}
    >
      <CalendarDayCol
        setColReference={r => (colRef.current = r)}
        dayOfWeek={day}
      >
        <CalendarEventsOverlay
          events={events}
          onEventCreation={createEvent}
          onEventUpdate={updateEvent}
          onEventDelete={cancelEvent}
          rowRef={rowRef}
          colRef={colRef}
        />
      </CalendarDayCol>
    </CalendarDayHeaderCol>
  );
};

export default Calendar;

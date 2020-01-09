import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-css-only/css/bootstrap.min.css";
import "mdbreact/dist/css/mdb.css";

import DateFnsUtils from "@date-io/date-fns";

import { DateTimePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo
} from "react";

import {
  MDBRow,
  MDBCol,
  MDBModal,
  MDBModalBody,
  MDBInput,
  MDBModalFooter,
  MDBPopover,
  MDBPopoverHeader,
  MDBPopoverBody,
  MDBBtn,
  MDBContainer,
  MDBBtnGroup,
  MDBIcon,
  MDBDropdown,
  MDBDropdownToggle,
  MDBDropdownMenu,
  MDBDropdownItem
} from "mdbreact";

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
const CalendarDayHeaderWrapper = ({ children, ...props }) => (
  <MDBRow className="calendar-header">
    <MDBCol className="timezone-cell">
      <span>{getTimezoneStringShort()}</span>
    </MDBCol>
    <MDBCol className="header-offset border-cell">&nbsp;</MDBCol>
    {children}
  </MDBRow>
);

const CalendarDayHeaderDay = ({ day, onClickCallBack }) => {
  const todayDate = new Date().getDate();
  return (
    <MDBCol className="border-cell" key={day}>
      <div className="day-name">
        {day.toLocaleString(window.navigator.language, {
          weekday: "short"
        })}
      </div>
      <div
        className={
          day.getDate() === todayDate ? "day-number today" : "day-number"
        }
        onClick={onClickCallBack}
      >
        {day.getDate()}
      </div>
    </MDBCol>
  );
};

const CalendarWeekHeader = ({ day, onClickCallBack }) => (
  <CalendarDayHeaderWrapper>
    {getDaysOfWeek(day).map(weekDay => (
      <CalendarDayHeaderDay
        key={"calendar-header-day-" + weekDay.getDay()}
        day={weekDay}
        onClickCallBack={() => onClickCallBack(weekDay)}
      />
    ))}
  </CalendarDayHeaderWrapper>
);

const CalendarDayHeaderCol = React.forwardRef(
  ({ setRowReference, children, ...props }, ref) => {
    return (
      <MDBRow className="calendar-body">
        {/* Row display overlay */}
        <MDBCol className="cell-rows">
          <MDBContainer>
            <div
              ref={setRowReference}
              className="row hour-row"
              key="cell-0"
              data-row-id="0"
            >
              <MDBCol>&nbsp;</MDBCol>
            </div>
            {[...Array(23).keys()].map(hourCell => (
              <MDBRow
                className="hour-row"
                key={"cell-" + (hourCell + 1)}
                data-row-id={hourCell + 1}
              >
                <MDBCol>&nbsp;</MDBCol>
              </MDBRow>
            ))}
          </MDBContainer>
        </MDBCol>

        {/* Hour header display column */}
        <MDBCol className="hours-col">
          <MDBContainer>
            <MDBRow className="hour-cell">
              <MDBCol>&nbsp;</MDBCol>
            </MDBRow>
            {[...Array(23).keys()].map(hourOfDay => (
              <MDBRow className="hour-cell" key={hourOfDay}>
                <MDBCol>
                  <span>{hourOfDay + 1}:00</span>
                </MDBCol>
              </MDBRow>
            ))}
          </MDBContainer>
        </MDBCol>

        {children}
      </MDBRow>
    );
  }
);

const CalendarDayCol = ({ dayOfWeek, setColReference }) => (
  <div
    ref={setColReference}
    className="col day-col"
    key={"col-" + dayOfWeek.getTime()}
    data-col-id={dayOfWeek.getTime()}
  >
    &nbsp;
  </div>
);

const CalendarEventCreationModal = props => {
  const { isOpen, toggle, calEvent, onCreate, onCancel, ...other } = props;

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    setStartDate(new Date(calEvent.startDate));
    setEndDate(new Date(calEvent.endDate));
  }, [calEvent.startDate, calEvent.endDate]);

  const handleInput = setFunction => e => {
    setFunction(e.target.value);
  };

  const toggleHandler = useCallback(
    e => {
      setTitle("");
      setStartDate(new Date());
      setEndDate(new Date());
      setDescription("");
      setLocation("");
      if (toggle) toggle(e);
    },
    [setTitle, setStartDate, setEndDate, setDescription, setLocation, toggle]
  );

  const closeHandler = useCallback(
    e => {
      e.stopPropagation();
      if (calEvent && onCancel) onCancel(calEvent);
      toggleHandler();
    },
    [onCancel, calEvent, toggleHandler]
  );

  const createHandler = useCallback(
    e => {
      var newEvent = Object.assign({}, calEvent);
      newEvent = Object.assign(newEvent, {
        title: title,
        description: description,
        location: location,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });

      if (onCreate) onCreate(newEvent);
      toggleHandler();
    },
    [
      calEvent,
      onCreate,
      title,
      description,
      location,
      startDate,
      endDate,
      toggleHandler
    ]
  );

  return (
    <MDBModal
      isOpen={isOpen}
      toggle={toggle}
      fullHeight
      position="right"
      animation="right"
    >
      <MDBModalBody>
        <form className="mx-3 grey-text" onMouseDown={e => e.stopPropagation()}>
          <MDBInput
            label="Title"
            group
            type="text"
            validate
            error="wrong"
            success="right"
            name="title"
            onInput={handleInput(setTitle)}
          />
          <MuiPickersUtilsProvider utils={DateFnsUtils}>
            <MDBRow>
              <MDBCol>
                <DateTimePicker
                  variant="inline"
                  label="Start"
                  value={startDate}
                  onChange={date => setStartDate(date)}
                />
              </MDBCol>
            </MDBRow>
            <MDBRow>
              <MDBCol>
                <DateTimePicker
                  variant="inline"
                  label="End"
                  value={endDate}
                  onChange={date => setEndDate(date)}
                />
              </MDBCol>
            </MDBRow>
          </MuiPickersUtilsProvider>

          <MDBInput
            label="Description"
            group
            type="textarea"
            validate
            rows="1"
            error="wrong"
            success="right"
            name="description"
            onInput={handleInput(setDescription)}
          />
          <MDBInput
            label="Location"
            group
            type="text"
            validate
            error="wrong"
            success="right"
            name="location"
            onInput={handleInput(setLocation)}
          />
        </form>
      </MDBModalBody>
      <MDBModalFooter>
        <MDBBtn color="mdb-color" onMouseDown={createHandler}>
          Create
        </MDBBtn>
        <MDBBtn color="mdb-color" outline onMouseDown={closeHandler}>
          Close
        </MDBBtn>
      </MDBModalFooter>
    </MDBModal>
  );
};

const CalendarEventPopover = props => {
  const {
    dateString,
    hourString,
    title,
    owner,
    description,
    onEdit,
    onCopy,
    onDelete,
    onDismiss,
    children
  } = props;
  return (
    <MDBPopover popover clickable domElement>
      {children}
      <div>
        <MDBPopoverHeader>
          <MDBCol md="auto" className="mr-auto">
            <span className="text">{title}</span>
          </MDBCol>
          <MDBCol xl="4" md="12">
            <div className="btn-toolbar" role="toolbar">
              <MDBBtnGroup className="mr-2" size="sm">
                <MDBBtn color="stylish-color lighten-2">
                  <MDBIcon icon="edit" />
                </MDBBtn>
                <MDBBtn color="stylish-color lighten-2">
                  <MDBIcon icon="heart" />
                </MDBBtn>
                <MDBDropdown color="stylish-color lighten-2">
                  <MDBDropdownToggle color="info" className="h-100">
                    <MDBIcon icon="heart" />
                  </MDBDropdownToggle>
                  <MDBDropdownMenu color="info">
                    <MDBDropdownItem>Duplicate</MDBDropdownItem>
                    <MDBDropdownItem>Send</MDBDropdownItem>
                  </MDBDropdownMenu>
                </MDBDropdown>
              </MDBBtnGroup>
            </div>
          </MDBCol>
        </MDBPopoverHeader>
        <MDBPopoverBody>
          <MDBContainer>
            <MDBRow>
              <MDBCol md="1">
                <MDBIcon far icon="clock" />
              </MDBCol>
              <MDBCol>
                <strong>{hourString}</strong> {dateString}
              </MDBCol>
            </MDBRow>
            <MDBRow>
              <MDBCol md="1">
                <MDBIcon far icon="user" />
              </MDBCol>
              <MDBCol>
                <strong>{owner}</strong>
              </MDBCol>
            </MDBRow>
            <MDBRow>
              <MDBCol>
                <p>{description}</p>
              </MDBCol>
            </MDBRow>
          </MDBContainer>
        </MDBPopoverBody>
      </div>
    </MDBPopover>
  );
};

const CalendarEvent = props => {
  const {
    onHeightChangeStop,
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
    <CalendarEventPopover
      id="popover-contained"
      dateString={startDate.toDateString()}
      hourString={hourString}
      title={title}
      owner="Admin" // TODO: Test purpose
      description={description}
      onEdit={onEdit}
      onCopy={onCopy}
      onDelete={onDelete}
      onDismiss={false}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        className={className}
        style={{
          position: "absolute",
          width: dayWidth * 0.9 + "px",
          top: position.y + "px",
          left: position.x + "px"
        }}
      >
        <BottomResizableContainer
          heightModulo={minuteHeight * 15}
          resizeOnCreation={resizeOnCreation}
          onHeightChange={onHeightChange}
          onHeightChangeStop={onHeightChangeStopHandler}
          style={{
            height: height + "px"
          }}
        >
          <MDBContainer className={"calendar-event"}>
            <MDBRow className="mx-2 mt-1">
              <span>
                <strong>{title}</strong>
              </span>
            </MDBRow>
            <MDBRow className="description-event mx-2">
              <p>{hourString}</p>
            </MDBRow>
          </MDBContainer>
        </BottomResizableContainer>
      </div>
    </CalendarEventPopover>
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
  }, [localEvents]);

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
  const modalToggle = useCallback(
    e => {
      if (modalShow) {
        setSelectedEvent(false);
      }
      setModalShow(!modalShow);
    },
    [modalShow, setModalShow]
  );

  const eventCreationConfirm = useCallback(
    e => {
      if (onEventCreation) {
        e.resizeOnCreation = false;
        onEventCreation(e);
      }
    },
    [onEventCreation]
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

      <MDBContainer onMouseDown={e => e.stopPropagation()}>
        <CalendarEventCreationModal
          isOpen={modalShow}
          toggle={modalToggle}
          calEvent={selectedEvent}
          onCreate={eventCreationConfirm}
        />
      </MDBContainer>

      {[...(selectedEvent ? [selectedEvent] : []), ...localEvents].map(e => (
        <CalendarEvent
          // Dimensions data
          overlayBounds={dimensions.overlayBounds}
          dayWidth={dimensions.dayWidth}
          minuteHeight={dimensions.minuteHeight}
          // Event Callbacks
          onHeightChangeStop={() => eventHeightChangeStop(e)}
          onEdit={false}
          onCopy={false}
          onDelete={false}
          // Event data
          resizeOnCreation={e.resizeOnCreation}
          startDate={e.startDate}
          endDate={e.endDate}
          setEndDate={date => (e.endDate = date)}
          description={e.description}
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
    <MDBContainer>
      <CalendarHeader changeView={setView} />
      {view === viewEnum.DAY && (
        <CalendarDayView
          day={selectedDay}
          events={events}
          createEvent={createEvent}
          updateEvent={updateEvent}
          cancelEvent={cancelEvent}
        />
      )}
    </MDBContainer>
  );
};

const CalendarHeader = props => {
  /**
   * TODO
   */
  return <div />;
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
    <MDBContainer>
      <CalendarWeekHeader day={day} onClickCallBack={switchDayHandler} />
      <CalendarDayBody events={filteredEvents} day={day} {...other} />
    </MDBContainer>
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
      <MDBCol className="body-main-col">
        <MDBContainer className="cell-columns">
          <MDBRow>
            <CalendarDayCol
              setColReference={r => (colRef.current = r)}
              dayOfWeek={day}
            />
          </MDBRow>
        </MDBContainer>
        <CalendarEventsOverlay
          events={events}
          onEventCreation={createEvent}
          onEventUpdate={updateEvent}
          onEventDelete={cancelEvent}
          rowRef={rowRef}
          colRef={colRef}
        />
      </MDBCol>
    </CalendarDayHeaderCol>
  );
};

export default Calendar;

import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo
} from "react";

import {
  Col,
  Card,
  Accordion,
  Form,
  Modal,
  OverlayTrigger,
  Popover,
  Button
} from "react-bootstrap";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAlignJustify, faMapMarker } from "@fortawesome/free-solid-svg-icons";

import {
  getDOMElementAtPos,
  getTodayDate,
  getDaysOfWeek,
  getTimezoneStringShort,
  getElementByDataId,
  getHourString,
  InputOverlay,
  BottomResizableContainer,
  MovableContainer
} from "./Utils";

import "bootstrap/dist/css/bootstrap.css";
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
const CalendarDayHeaderWrapper = props => (
  <div className="row calendar-header">
    <div className="col timezone-cell">
      <span>{getTimezoneStringShort()}</span>
    </div>
    <div className="col header-offset border-cell">&nbsp;</div>
    {props.children}
  </div>
);

const CalendarDayHeaderDay = ({ day, onClickCallBack }) => (
  <div className="col border-cell" key={day}>
    <div className="day-name">
      {day.toLocaleString(window.navigator.language, {
        weekday: "short"
      })}
    </div>
    <div className="day-number" onClick={onClickCallBack}>
      {day.getDate()}
    </div>
  </div>
);

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

const CalendarDayHeaderCol = props => {
  const { setRowReference, children } = props;
  return (
    <div className="row calendar-body">
      {/* Row display overlay */}
      <div className="col cell-rows">
        <div className="container">
          <div
            ref={setRowReference}
            className="row hour-row"
            key="cell-0"
            data-row-id="0"
          >
            <div className="col">&nbsp;</div>
          </div>
          {[...Array(23).keys()].map(hourCell => (
            <div
              className="row hour-row"
              key={"cell-" + (hourCell + 1)}
              data-row-id={hourCell + 1}
            >
              <div className="col">&nbsp;</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hour header display column */}
      <div className="col hours-col">
        <div className="container">
          <div className="row hour-cell">
            <div className="col">&nbsp;</div>
          </div>
          {[...Array(23).keys()].map(hourOfDay => (
            <div className="row hour-cell" key={hourOfDay}>
              <div className="col">
                <span>{hourOfDay + 1}:00</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {children}
    </div>
  );
};

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
  const { calEvent, onHide, onCreate, onCancel, ...other } = props;

  const titleRef = useRef();

  const startDateRef = useRef();
  const startDateHourRef = useRef();

  const endDateRef = useRef();
  const endDateHourRef = useRef();

  const descriptionRef = useRef();
  const locationRef = useRef();

  useEffect(() => {});

  const closeHandler = useCallback(
    e => {
      e.stopPropagation();
      if (calEvent && onCancel) onCancel(calEvent);
      if (onHide) onHide(e);
    },
    [onCancel, calEvent, onHide]
  );

  const createHandler = useCallback(
    e => {
      e.stopPropagation();
      var newEvent = Object.assign({}, calEvent);
      newEvent = Object.assign(newEvent, {
        title: titleRef.current.value,
        description: descriptionRef.current.value,
        location: locationRef.current.value,
        startDate: new Date(
          `${startDateRef.current.value}T${startDateHourRef.current.value}:00`
        ),
        endDate: new Date(
          `${endDateRef.current.value}T${endDateHourRef.current.value}:00`
        )
      });

      if (onCreate) onCreate(newEvent);
      if (onHide) onHide(e);
    },
    [calEvent, onHide, onCreate]
  );

  return (
    <Modal {...other} size="lg" centered onHide={onHide}>
      <Form>
        <Modal.Body>
          <Form.Row>
            <Col>
              {/** Title */}
              <Form.Row>
                <Form.Group as={Col} controlId="newEventTitle">
                  <Form.Control
                    ref={titleRef}
                    placeholder="New Event Title"
                    defaultValue={calEvent && calEvent.title}
                  />
                </Form.Group>
              </Form.Row>

              {/** Start / End date */}
              <Form.Row>
                <Form.Group as={Col} controlId="newEventStartDate">
                  <Form.Control
                    ref={startDateRef}
                    type="date"
                    placeholder="Start Date"
                    defaultValue={
                      calEvent && calEvent.startDate.toLocaleDateString("en-CA")
                    }
                  />
                </Form.Group>
                <Form.Group as={Col} controlId="newEventStartTime">
                  <Form.Control
                    ref={startDateHourRef}
                    type="time"
                    placeholder="Hour"
                    defaultValue={calEvent && getHourString(calEvent.startDate)}
                  />
                </Form.Group>

                <Form.Label> - </Form.Label>

                <Form.Group as={Col} controlId="newEventEndDate">
                  <Form.Control
                    ref={endDateRef}
                    type="date"
                    placeholder="End Date"
                    defaultValue={
                      calEvent && calEvent.endDate.toLocaleDateString("en-CA")
                    }
                  />
                </Form.Group>
                <Form.Group as={Col} controlId="newEventEndTime">
                  <Form.Control
                    ref={endDateHourRef}
                    type="time"
                    placeholder="Hour"
                    defaultValue={calEvent && getHourString(calEvent.endDate)}
                  />
                </Form.Group>
              </Form.Row>
            </Col>
          </Form.Row>

          <Accordion>
            {/** Description */}
            <Card>
              <Card.Header>
                <Accordion.Toggle as={Button} variant="link" eventKey="0">
                  <FontAwesomeIcon icon={faAlignJustify} />{" "}
                  <Form.Label>Description</Form.Label>
                </Accordion.Toggle>
              </Card.Header>

              <Accordion.Collapse eventKey="0">
                <Card.Body>
                  <Form.Group controlId="newEventDescription">
                    <Form.Control
                      ref={descriptionRef}
                      as="textarea"
                      rows="3"
                      placeholder="Description..."
                    />
                  </Form.Group>
                </Card.Body>
              </Accordion.Collapse>
            </Card>

            {/** Location */}
            <Card>
              <Card.Header>
                <Accordion.Toggle as={Button} variant="link" eventKey="1">
                  <FontAwesomeIcon icon={faMapMarker} />{" "}
                  <Form.Label>Location</Form.Label>
                </Accordion.Toggle>
              </Card.Header>

              <Accordion.Collapse eventKey="1">
                <Card.Body>
                  <Form.Group controlId="newEventLocation">
                    <Form.Control ref={locationRef} placeholder="Location" />
                  </Form.Group>
                </Card.Body>
              </Accordion.Collapse>
            </Card>
          </Accordion>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={closeHandler}>
            Close
          </Button>
          <Button variant="primary" onClick={createHandler}>
            Create
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

const CalendarEventPopover = props => {
  const { placement, calEvent, onHide, onUpdate, onDelete } = props;
  // TODO
  return (
    <OverlayTrigger
      trigger="click"
      key={placement}
      placement={placement}
      overlay={
        <Popover id={`popover-positioned-${placement}`}>
          <Popover.Title as="h3">{`Popover ${placement}`}</Popover.Title>
          <Popover.Content>
            <strong>Holy guacamole!</strong> Check this info.
          </Popover.Content>
        </Popover>
      }
    >
      <Button variant="secondary">Popover on {placement}</Button>
    </OverlayTrigger>
  );
};

const CalendarEvent = props => {
  const {
    onClick,
    onHeightChangeStop,
    overlayBounds,
    dayWidth,
    minuteHeight,
    resizeOnCreation,
    startDate,
    endDate,
    setEndDate,
    description
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
      y: hourBounds.top - overlayBounds.top
    };
  }, [overlayBounds, startDate]);

  const [position, setPosition] = useState(getPosition());
  const [height, setHeight] = useState(getHeight());
  const [hourString, setHourString] = useState("");
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
    <MovableContainer
      onClick={onClick}
      className={className}
      snapColumnWidth={dayWidth}
      initialPosition={position}
      style={{
        position: "absolute",
        width: dayWidth * 0.9 + "px"
      }}
    >
      <BottomResizableContainer
        heightModulo={minuteHeight * 15}
        resizeOnCreation={resizeOnCreation}
        onHeightChange={onHeightChange}
        onHeightChangeStop={onHeightChangeStopHandler}
        style={{
          color: "white",
          height: height + "px"
        }}
      >
        <div className="container calendar-event">
          <div className="row description-event">
            <div className="col">
              <p>{hourString}</p>
              <span>{description}</span>
            </div>
          </div>
        </div>
      </BottomResizableContainer>
    </MovableContainer>
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

  const [modalShow, setModalShow] = useState(false);
  const [dimensions, setDimensions] = useState(getDimensions());
  const [selectedEvent, setSelectedEvent] = useState(false);
  const [overlayCreationMode, setOverlayCreationMode] = useState(false);

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

  const onModalHide = useCallback(() => {
    updateTileLayout();
    setSelectedEvent(false);
    setModalShow(false);
  }, [updateTileLayout]);

  /**
   * InputOverlay CB functions
   */
  const overlayEventCreationStart = useCallback(
    e => {
      e.stopPropagation();
      if (modalShow) return;
      setOverlayCreationMode(true);
      setSelectedEvent(createEvent(e));
    },
    [modalShow, setSelectedEvent, createEvent]
  );

  const overlayEventCreationStop = useCallback(e => {
    setModalShow(true);
    setOverlayCreationMode(false);
    e.stopPropagation();
  }, []);

  /**
   * Modal CB functions
   */
  const eventCreationConfirm = useCallback(
    event => {
      if (onEventCreation) {
        onEventCreation(event);
        setSelectedEvent(false);
        updateTileLayout();
      }
    },
    [onEventCreation, updateTileLayout]
  );

  const eventCreationCancel = useCallback(
    event => {
      if (!modalShow) return;
    },
    [modalShow]
  );

  /**
   * Event CB functions
   */
  const eventHeightChangeStop = useCallback(
    event => {
      if (!overlayCreationMode) {
        updateTileLayout();
        onEventUpdate(event, event);
      }
    },
    [overlayCreationMode, updateTileLayout, onEventUpdate]
  );

  console.log("Overlay rendered again");
  return (
    <InputOverlay
      onMouseDown={overlayEventCreationStart}
      onMouseUp={overlayEventCreationStop}
      setOverlayRef={r => (overlayRef.current = r)}
    >
      <CalendarEventCreationModal
        show={modalShow}
        calEvent={selectedEvent}
        onHide={onModalHide}
        onCancel={eventCreationCancel}
        onCreate={eventCreationConfirm}
      />

      {[...(selectedEvent ? [selectedEvent] : []), ...events].map(e => (
        <CalendarEvent
          // Dimensions data
          onHeightChangeStop={() => eventHeightChangeStop(e)}
          overlayBounds={dimensions.overlayBounds}
          dayWidth={dimensions.dayWidth}
          minuteHeight={dimensions.minuteHeight}
          // Event data
          resizeOnCreation={e.resizeOnCreation}
          startDate={e.startDate}
          endDate={e.endDate}
          setEndDate={date => (e.endDate = date)}
          description={e.description}
          // Props
          onClick={clickEvent => {
            clickEvent.stopPropagation();
            console.log("Event clicked");
          }}
          // Others
          key={e.renderKey || e.id}
        />
      ))}
    </InputOverlay>
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
  const [events, setEvents] = useState();
  const [selectedDay, setSelectedDay] = useState(getTodayDate());
  const [view, setView] = useState(viewEnum.DAY);

  const createEvent = useCallback(
    newEvent => {
      setEvents([newEvent, ...events]);
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
      console.log(eventData);
    },
    [events, setEvents]
  );

  const cancelEvent = useCallback(
    oldEvent => {
      const key = oldEvent.renderKey || oldEvent.id;
      const id = oldEvent.renderKey ? "renderKey" : "id";
      setEvents(events.filter(event => event[id] !== key));
      console.log(events);
    },
    [events, setEvents]
  );

  return (
    <div className="container">
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
    </div>
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
    <div className="container calendar-day-view">
      <CalendarWeekHeader day={day} onClickCallBack={switchDayHandler} />
      <CalendarDayBody events={filteredEvents} day={day} {...other} />
    </div>
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
      <div className="col body-main-col">
        <div className="container cell-columns">
          <div className="row">
            <CalendarDayCol
              setColReference={r => (colRef.current = r)}
              dayOfWeek={day}
            />
          </div>
        </div>
        <CalendarEventsOverlay
          events={events}
          onEventCreation={createEvent}
          onEventUpdate={updateEvent}
          onEventDelete={cancelEvent}
          rowRef={rowRef}
          colRef={colRef}
        />
      </div>
    </CalendarDayHeaderCol>
  );
};

export default Calendar;

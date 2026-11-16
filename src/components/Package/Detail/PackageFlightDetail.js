import React from 'react'
import { FaPlane } from 'react-icons/fa'
import moment from 'moment'
import styles from './PackageFlightDetail.module.css'

function calcDuration(from, to) {
  const diff = moment(to).diff(moment(from), 'minutes')
  if (!diff || diff < 0) return null
  const h = Math.floor(diff / 60)
  const m = diff % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function placeLabel(value) {
  if (!value) return { city: '—', code: '' }
  const text = String(value).trim()
  const codeMatch = text.match(/\(([A-Z]{3})\)/) || text.match(/\b([A-Z]{3})\b\s*$/)
  const code = codeMatch?.[1] || ''
  const city = code ? text.replace(codeMatch[0], '').replace(/[,\-–—]\s*$/, '').trim() : text
  return { city: city || text, code }
}

function FlightSegment({ item, index, isReturn, stopsInLeg }) {
  const duration = calcDuration(item.datetime_from, item.datetime_to)
  const from = placeLabel(item.departure_from)
  const to = placeLabel(item.departure_to)
  const stopLabel =
    stopsInLeg <= 1 ? 'Non-stop' : `${stopsInLeg - 1} ${stopsInLeg - 1 === 1 ? 'stop' : 'stops'}`
  const direct = stopsInLeg <= 1

  return (
    <div className={styles.segment}>
      <div className={styles.segmentMeta}>
        <div className={styles.metaLeft}>
          {!isReturn && index === 0 ? (
            <span className={styles.popularBadge}>Popular</span>
          ) : (
            <span className={styles.softBadge}>{isReturn ? 'Return' : 'Outbound'}</span>
          )}
          <span className={styles.softBadge}>{isReturn ? 'Economy' : 'Depart'}</span>
        </div>
        <div className={styles.metaRight}>
          <span className={styles.metaHint}>
            <FaPlane size={11} aria-hidden="true" />
            {direct ? 'Direct' : stopLabel}
          </span>
        </div>
      </div>

      <div className={styles.airlineBlock}>
        <div className={styles.airlineName}>{item.airline_name || 'Airline'}</div>
        {item.flight_number && (
          <div className={styles.flightNumber}>
            {String(item.flight_number).startsWith('Flight')
              ? item.flight_number
              : `Flight ${item.flight_number}`}
          </div>
        )}
      </div>

      <div className={styles.routeRow}>
        <div className={styles.airlineMark} aria-hidden="true">
          {(item.airline_name || 'A').trim().charAt(0).toUpperCase()}
        </div>

        <div className={styles.endpoint}>
          <div className={styles.time}>{moment.utc(item.datetime_from).format('h:mm A')}</div>
          <div className={styles.place}>
            {from.city}
            {from.code ? ` ${from.code}` : ''}
          </div>
          <div className={styles.date}>{moment.utc(item.datetime_from).format('DD MMM YYYY')}</div>
        </div>

        <div className={styles.path}>
          {duration && <span className={styles.duration}>{duration}</span>}
          <div className={styles.pathLine}>
            <span className={styles.dot} />
            <span className={styles.line} />
            <FaPlane size={14} className={styles.planeIcon} />
            <span className={styles.line} />
            <span className={styles.dot} />
          </div>
          <span className={styles.stopLabel}>{stopLabel}</span>
        </div>

        <div className={`${styles.endpoint} ${styles.endpointEnd}`}>
          <div className={styles.time}>{moment.utc(item.datetime_to).format('h:mm A')}</div>
          <div className={styles.place}>
            {to.city}
            {to.code ? ` ${to.code}` : ''}
          </div>
          <div className={styles.date}>{moment.utc(item.datetime_to).format('DD MMM YYYY')}</div>
        </div>
      </div>
    </div>
  )
}

export default function PackageFlightDetail({ PackageDetail }) {
  if (!PackageDetail?.flights || PackageDetail.flights.length === 0) return null

  const hasReturn = PackageDetail.flights.some((f) =>
    f.stops?.some((s) => s.is_return === true)
  )

  const departStopsCount = PackageDetail.flights.reduce((total, flight) => {
    const departStops = flight.stops?.filter((s) => s.is_return === false) || []
    return Math.max(total, departStops.length)
  }, 0)

  const returnStopsCount = PackageDetail.flights.reduce((total, flight) => {
    const returnStops = flight.stops?.filter((s) => s.is_return === true) || []
    return Math.max(total, returnStops.length)
  }, 0)

  const departSegments = []
  const returnSegments = []

  PackageDetail.flights.forEach((flight, fi) => {
    ;(flight.stops?.filter((s) => s.is_return === false) || []).forEach((item, i) => {
      departSegments.push({ item, key: `dep-${fi}-${i}` })
    })
    ;(flight.stops?.filter((s) => s.is_return === true) || []).forEach((item, i) => {
      returnSegments.push({ item, key: `ret-${fi}-${i}` })
    })
  })

  return (
    <section className={styles.flightSection}>
      <p className={styles.eyebrow}>Key Journey Highlights</p>
      <h2 className={styles.sectionTitle}>Flights</h2>

      <div className={styles.flightsCard}>
        {departSegments.map(({ item, key }, index) => (
          <FlightSegment
            key={key}
            item={item}
            index={index}
            isReturn={false}
            stopsInLeg={departStopsCount}
          />
        ))}

        {hasReturn &&
          returnSegments.map(({ item, key }, index) => (
            <React.Fragment key={key}>
              <div className={styles.segmentDivider} />
              <FlightSegment
                item={item}
                index={index}
                isReturn
                stopsInLeg={returnStopsCount}
              />
            </React.Fragment>
          ))}
      </div>
    </section>
  )
}

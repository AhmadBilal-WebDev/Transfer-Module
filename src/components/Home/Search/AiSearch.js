'use client'
import React, { useState, useEffect } from 'react';
import { BiMicrophone } from 'react-icons/bi';
import { RiRobot2Line } from 'react-icons/ri';
import { LuSparkle } from 'react-icons/lu';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FaCheck, FaSearch } from 'react-icons/fa';
import styles from './ai.module.css';
import HotelAiSearch from '../AiSearchesRes/HotelAiSearch';
import FlightAiSearch from '../AiSearchesRes/FlightAirSearch';
import UmrahGetawayAiSearch from '../AiSearchesRes/UmrahGetawayAiSearch';
import TransferAiSearch from '../AiSearchesRes/TransferAiSearch';
import Link from 'next/link';
import SpeechRecognition, { useSpeechRecognition, } from "react-speech-recognition";

const TRY_SUGGESTIONS = [
  'Heathrow → Central London',
  'Jeddah → Makkah hotel',
  "Madinah → Prophet's Mosque",
];

const AI_PLACEHOLDER =
  'Describe your trip, e.g. Jeddah airport to my Makkah hotel tomorrow at 9am, 3 people';

export default function AiSearch({ categoryList }) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const [destinationList, setDestinationList] = useState([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem('aiRecentSearches');
    if (savedSearches) {
      try {
        setRecentSearches(JSON.parse(savedSearches));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, []);

  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
  };
  const handleSubmit = async () => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    // Save to recent searches
    const trimmedMessage = message.trim();
    const updatedSearches = [trimmedMessage, ...recentSearches.filter(s => s !== trimmedMessage)].slice(0, 4);
    setRecentSearches(updatedSearches);
    localStorage.setItem('aiRecentSearches', JSON.stringify(updatedSearches));

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AI_API_URL}/api/ai-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_AI_API_TOKEN
        },
        body: JSON.stringify({
          query: message
        })
      });

      if (!res.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await res.json();
      if (data.type === "activities" && data.missing_fields.length === 0) {
        await GetDestinations();
      }
      setResponse(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const GetDestinations = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/activities/destinations`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // 'ngrok-skip-browser-warning': 'true',
          },
        }
      );
      const data = await response.json();
      if (data.Success === true) {
        const NewList = data.Content.destinations.map((item) => ({ id: item.id, value: item.city_slug, label: item.city }));
        const uniqueList = [
          ...new Map(NewList.map((item) => [item.value, item])).values(),
        ];
        setDestinationList(uniqueList);
      }
    } catch (error) {
      console.error('Error fetching destinations:', error);
      setDestinationList([]);
    }
  };
     
  if (!browserSupportsSpeechRecognition) {
    return null;
  }

  const startListening = () => {
    if (response?.type === 'unknown' && response?.missing_fields?.length !== 0) {
      resetTranscript(); // Clear transcript before new recording
    }
    SpeechRecognition.startListening({ continuous: true, language: "en-US" });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  // Update message when transcript changes and listening stops
  useEffect(() => {
    if (!listening && transcript) {
      // Replace with new transcript (each input is fresh)
      setMessage(transcript);
    }
  }, [listening, transcript]);

  // Auto-submit after message is updated from speech
  useEffect(() => {
    if (!listening && transcript && message.includes(transcript)) {
      const timer = setTimeout(() => {
        handleSubmit();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [message, listening, transcript]);

  const tryChips = recentSearches.length > 0
    ? recentSearches.slice(0, 3)
    : TRY_SUGGESTIONS;

  return (
    <div className={styles.aiSearchContainer}>
      {isLoading && (
        <div className={styles.aiResponseBox}>
          <div className={styles.aiLoadingWrapper}>
            <AiOutlineLoading3Quarters className={styles.aiLoadingIcon} size={24} />
            <span>AI is thinking...</span>
          </div>
        </div>
      )}

      {error && (
        <div className={styles.aiResponseBox}>
          <div className={styles.aiErrorMessage}>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {response && !isLoading && (
        <>
          {response.type === 'hotel' && (!response.missing_fields || !response.missing_fields.some(field => field.type === 'city' || field.message?.toLowerCase().includes('city'))) ? (
            <HotelAiSearch searchResponse={response} />
          ) : (response.type === 'flight' && response.missing_fields.length === 0) ? (
            <FlightAiSearch searchResponse={response} />
          ) : (response.type === 'umrah_getaway' && response.missing_fields.length === 0) ? (
            <UmrahGetawayAiSearch searchResponse={response} />
          ) : (response.type === 'umrah_getaway' && response.missing_fields.length === 0) ? (
            <UmrahGetawayAiSearch searchResponse={response} />
          ) : (response.type === 'transfers' && response.missing_fields.length === 0) ? (
            <TransferAiSearch searchResponse={response} />
          ) : (response.type === 'guided_packages' && response.missing_fields.length === 0 && categoryList) ? (
            <div className={styles.aiResponseBox}>
              <div className={styles.aiResponseHeader}>
                <RiRobot2Line size={20} />
                <span className='ms-2'>Select Package Category</span>
              </div>
              <div className={styles.aiResponseContent}>
                <p className='mb-3'>Kindly select the package category you wish to explore:</p>
                <div className='d-flex flex-wrap gap-2'>
                  {categoryList.map((category, index) => (
                    <Link key={index} href={`/packages?category_slug=${category.slug}&date=${response?.departureDate}`}>
                      <button type="button" className={styles.aiSuggestionChip}>
                        <LuSparkle className='me-1' />
                        {category.name}
                      </button>
                    </Link>
                  ))}
                  <Link href={`/packages?date=${response?.departureDate}`}>
                    <button type="button" className={styles.aiSuggestionChip}>
                      <LuSparkle className='me-1' />
                      All
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (response.type === 'activities' && response.missing_fields.length === 0 && destinationList) ? (
            <div className={styles.aiResponseBox}>
              <div className={styles.aiResponseHeader}>
                <RiRobot2Line size={20} />
                <span className='ms-2'>Select Destination</span>
              </div>
              <div className={styles.aiResponseContent}>
                <p className='mb-3'>Please select your preferred destination:</p>
                <div className='d-flex flex-wrap gap-2'>
                  {destinationList.map((destination, index) => (
                    <Link key={index} href={`/activities?city=${destination.value}&date=${response?.activityDate}`}>
                      <button type="button" className={styles.aiSuggestionChip}>
                        <LuSparkle className='me-1' />
                        {destination.label}
                      </button>
                    </Link>
                  ))}
                  <Link href={`/activities?date=${response?.activityDate}`}>
                    <button type="button" className={styles.aiSuggestionChip}>
                      <LuSparkle className='me-1' />
                      All
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ) : response.missing_fields && response.missing_fields.length > 0 ? (
            <div className={styles.aiResponseBox}>
              <div className={styles.aiResponseHeader}>
                <RiRobot2Line size={20} />
                <span className='ms-2'>AI</span>
              </div>
              <div className={styles.aiResponseContent}>
                <p className='mb-2'>{response?.missing_message}</p>
              </div>
            </div>
          ) : (
            <div className={styles.aiResponseBox}>
              <div className={styles.aiResponseHeader}>
                <RiRobot2Line size={20} />
                <span className='ms-2'>AI Response</span>
              </div>
              <div className={styles.aiResponseContent}>
                {typeof response === 'string' ? response : JSON.stringify(response, null, 2)}
              </div>
            </div>
          )}
        </>
      )}

      <div className={styles.aiSearchRow}>
        <span className={styles.aiSparkBtn} aria-hidden="true">
          <LuSparkle />
        </span>

        <input
          type="text"
          className={styles.aiInput}
          placeholder={AI_PLACEHOLDER}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
          aria-label="Describe your trip"
        />

        <button
          type="button"
          onClick={listening ? stopListening : startListening}
          className={`${styles.aiMicBtn} ${listening ? styles.listening : ''}`}
          title={listening ? 'Stop Recording' : 'Voice Input'}
          aria-label={listening ? 'Stop Recording' : 'Voice Input'}
        >
          <BiMicrophone size={18} />
          {listening && <span className={styles.listeningPulse}></span>}
        </button>

        <button
          type="button"
          className={styles.aiSearchBtn}
          onClick={handleSubmit}
          disabled={isLoading || !message.trim()}
        >
          {isLoading ? (
            <AiOutlineLoading3Quarters className={styles.aiLoadingIcon} size={16} />
          ) : (
            <FaSearch className={styles.aiSearchBtnIcon} />
          )}
          Search
        </button>
      </div>

      <div className={styles.aiTryRow}>
        <span className={styles.aiTryLabel}>Try</span>
        <div className={styles.aiTryChips}>
          {tryChips.map((chip) => (
            <button
              key={chip}
              type="button"
              className={styles.aiTryChip}
              onClick={() => handleSuggestionClick(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.divider} />

      <ul className={styles.trustRow}>
        <li><FaCheck /> No surge pricing</li>
        <li><FaCheck /> Free cancellation up to 24h</li>
        <li><FaCheck /> 60 min free airport wait</li>
      </ul>
    </div>
  )
}

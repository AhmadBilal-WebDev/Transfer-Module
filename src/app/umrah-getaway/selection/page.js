'use client'
import React, { useState, useEffect, useRef } from 'react';
import { FaBed, FaCheck, FaCheckCircle, FaPlane } from 'react-icons/fa';
import HotelsDetail from '@/components/UmrahGetAway/Detail/HotelsDetail';
import FlightSelection from '@/components/UmrahGetAway/Detail/FlightSelection';
import OtherServices from '../../../components/UmrahGetAway/Detail/OtherServices';
import Umrah_Getaway_Detail_Loader from '@/components/Loader/Umrah_Getaway_Detail_Loader';
import { BiInfoCircle } from 'react-icons/bi';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { UmrahPackageProvider, useUmrahPackage } from '@/contexts/UmrahPackageContext';
import { FaRegCircleCheck } from 'react-icons/fa6';
import style from './selection.module.css';

function UmrahSelectionContent() {
    const [currentStep, setCurrentStep] = useState(1);
    const [visitedSteps, setVisitedSteps] = useState([1]);
    const topRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        topRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
    }, [currentStep]);
    const { packageData, isLoading } = useUmrahPackage();
    const steps = [
        { id: 1, title: 'Makkah Hotel', icon: <FaBed /> },
        { id: 2, title: 'Madinah Hotel', icon: <FaBed /> },
        { id: 3, title: 'Select Flight', icon: <FaPlane /> },
        { id: 4, title: 'Other Services', icon: <FaRegCircleCheck /> },
    ];

    const handleStepClick = (stepId) => {
        if (visitedSteps.includes(stepId)) {
            setCurrentStep(stepId);
        }
    };


    return (
        <div className='Umrah-getaway-detail-wrap'>
            <div ref={topRef} />
            {isLoading ? <Umrah_Getaway_Detail_Loader /> : (
                <div className='container my-5'>
                    {!packageData || Object.keys(packageData).length === 0 ? (
                        <div className="text-center p-5">
                            <div className="mb-3">
                                <BiInfoCircle className="text-danger fs-1" />
                            </div>

                            <h4 className="fw-semibold text-danger">
                                Package Not Available
                            </h4>

                            <p className="text-muted mt-2 mb-4">
                                We couldn’t find the details for this package.
                                It may no longer be available or the information has expired.
                                Please go back and choose another package to continue your journey.
                            </p>

                            <button
                                className="btn btn-outline-danger px-4"
                                onClick={() => router.back()}
                            >
                                ← Go Back to Packages
                            </button>
                        </div>

                    ) : (
                        <div>
                            {/* Stepper */}
                            <div className={style.stepper}>
                                <div className={style.stepperRow}>
                                    {steps.map((step, idx) => {
                                        const isActive = currentStep === step.id;
                                        const isCompleted = visitedSteps.includes(step.id) && !isActive;
                                        const isLocked = !visitedSteps.includes(step.id);
                                        return (
                                            <React.Fragment key={step.id}>
                                                {idx > 0 && (
                                                    <div className={style.connector} style={{ background: isCompleted || isActive ? '#16a34a' : '#e5e7eb' }} />
                                                )}
                                                <div className={style.step} onClick={() => handleStepClick(step.id)} style={{ cursor: isLocked ? 'default' : 'pointer' }}>
                                                    <div className={style.stepCircle} style={{
                                                        background: isActive ? '#e31c23' : isCompleted ? '#f0fdf4' : '#f9fafb',
                                                        border: `1.5px solid ${isActive ? '#e31c23' : isCompleted ? '#16a34a' : '#e5e7eb'}`,
                                                        color: isActive ? '#fff' : isCompleted ? '#16a34a' : '#9ca3af',
                                                    }}>
                                                        {isCompleted ? <FaCheck size={13} /> : step.icon}
                                                    </div>
                                                    <span className={style.stepNum}>Step {step.id}</span>
                                                    <span className={style.stepLabel} style={{ fontWeight: isActive ? 700 : 500, color: isActive ? '#e31c23' : isCompleted ? '#374151' : '#9ca3af' }}>
                                                        {step.title}
                                                    </span>
                                                </div>
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>
                            {/* Step Content */}
                            <div className='mt-4'>
                                {currentStep === 1 && (
                                    <div>
                                        <HotelsDetail
                                            type="makkah"
                                            detail={packageData?.makkah_hotel || {}}
                                            onNext={() => {
                                                const nextStep = currentStep + 1;
                                                if (!visitedSteps.includes(nextStep)) {
                                                    setVisitedSteps([...visitedSteps, nextStep]);
                                                }
                                                setCurrentStep(nextStep);
                                            }}
                                        />
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div>
                                        <HotelsDetail
                                            type="madinah"
                                            detail={packageData?.madinah_hotel || {}}
                                            onNext={() => {
                                                const nextStep = currentStep + 1;
                                                if (!visitedSteps.includes(nextStep)) {
                                                    setVisitedSteps([...visitedSteps, nextStep]);
                                                }
                                                setCurrentStep(nextStep);
                                            }}
                                        />
                                    </div>
                                )}

                                {currentStep === 3 && (
                                    <div>
                                        <FlightSelection
                                            detail={packageData?.flight || {}}
                                            requestinfo={packageData?.details_request_info || {}}
                                            onNext={() => {
                                                const nextStep = currentStep + 1;
                                                if (!visitedSteps.includes(nextStep)) {
                                                    setVisitedSteps([...visitedSteps, nextStep]);
                                                }
                                                setCurrentStep(nextStep);
                                            }}
                                        />
                                    </div>
                                )}

                                {currentStep === 4 && (
                                    <div>
                                        <OtherServices />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function Page() {
    const searchParams = useSearchParams();
    const packageId = searchParams.get('packageId');

    if (!packageId) {
        return (
            <div className='container my-5 text-center'>
                <BiInfoCircle className="text-danger fs-1" />
                <h4 className="fw-semibold text-danger mt-3">
                    Package ID Missing
                </h4>
                <p className="text-muted">Please provide a valid package ID to continue.</p>
            </div>
        );
    }

    return (
        <UmrahPackageProvider packageId={packageId}>
            <UmrahSelectionContent />
        </UmrahPackageProvider>
    )
}

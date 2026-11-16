'use client'
import React from 'react'
import PriceDisplay from '@/components/Currency/PriceDisplay'
import styles from './ActivityDetail.module.css'

export default function AdditionalServices({ Services, currency, selectedServices, setSelectedServices, setServicesTotal }) {

    const handleServiceToggle = (service) => {
        const isSelected = selectedServices.find((s) => s.name === service.name);
        if (isSelected) {
            const updatedServices = selectedServices.filter((s) => s.name !== service.name);
            const Total = updatedServices.reduce((acc, curr) => acc + Number(curr.total), 0)
            setServicesTotal(Total);
            setSelectedServices(updatedServices);
        } else {
            const newService = {
                "name": service.name,
                "type": service.type,
                "price": service.price,
                "quantity": 1,
                "total": Number(service.price)
            };
            const updatedServices = [...selectedServices, newService];
            const Total = updatedServices.reduce((acc, curr) => acc + Number(curr.total), 0)
            setServicesTotal(Total);
            setSelectedServices(updatedServices);
        }
    };

    const handleQuantityChange = (serviceName, changeType) => {
        const updatedServices = selectedServices.map((service) => {
            if (service.name === serviceName) {
                if (changeType === 'plus') {
                    const newQty = service.quantity + 1;
                    return { ...service, quantity: newQty, total: newQty * Number(service.price) };
                } else if (changeType === 'minus' && service.quantity > 1) {
                    const newQty = service.quantity - 1;
                    return { ...service, quantity: newQty, total: newQty * Number(service.price) };
                }
            }
            return service;
        });
        const Total = updatedServices.reduce((acc, curr) => acc + Number(curr.total), 0)
        setServicesTotal(Total);
        setSelectedServices(updatedServices);
    }

    if (!Services?.length) return null;

    return (
        <div className={styles.servicesCard}>
            <h5 className={styles.servicesTitle}>Additional Services</h5>
            <p className={styles.servicesHint}>Enhance your journey with optional services</p>
            {Services.map((service, index) => (
                <div key={index} className={styles.serviceRow}>
                    <div className={styles.serviceTop}>
                        <div className="form-check form-switch mb-0">
                            <input
                                onChange={() => handleServiceToggle(service)}
                                checked={selectedServices.some(s => s.name === service.name)}
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id={`switchCheckDefault-${index + 1}`}
                            />
                            <label className={`form-check-label ${styles.serviceName}`} htmlFor={`switchCheckDefault-${index + 1}`}>
                                {service?.name}
                            </label>
                        </div>
                        <div className={styles.servicePrice}>
                            <PriceDisplay price={service.price} currency={currency} />
                            <span className={styles.serviceMeta}>
                                {service.type === 'per_person' ? 'per person' : 'per booking'}
                            </span>
                        </div>
                    </div>
                    {selectedServices.some(s => s.name === service.name) && service.type === 'per_person' && (
                        <div className="quantity-box d-flex align-items-center justify-content-between">
                            <button onClick={() => handleQuantityChange(service.name, 'minus')} className="btn-qty minus" type="button">−</button>
                            <span className="qty-value">{selectedServices.find(s => s.name === service.name)?.quantity}</span>
                            <button onClick={() => handleQuantityChange(service.name, 'plus')} className="btn-qty plus" type="button">+</button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

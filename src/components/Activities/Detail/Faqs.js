import React from 'react'
import {
    Accordion,
    AccordionItem,
    AccordionControl,
    AccordionPanel,
} from "@mantine/core";
import styles from './ActivityDetail.module.css'

export default function Faqs({ faqsList }) {
    if (!faqsList?.length) return null;

    return (
        <section id="faqs" className={styles.faqSection}>
            <h4 className={styles.faqTitle}>Frequently Asked Questions</h4>
            <div className={styles.faqList}>
                <Accordion
                    chevronPosition="right"
                    classNames={{
                        root: styles.faqAccordion,
                        item: styles.faqItem,
                        control: styles.faqControl,
                        label: styles.faqLabel,
                        chevron: styles.faqChevron,
                        panel: styles.faqPanel,
                        content: styles.faqContent,
                    }}
                >
                    {faqsList.map((item, index) => (
                        <AccordionItem
                            value={`faq-${index}`}
                            key={index}
                        >
                            <AccordionControl>{item.title}</AccordionControl>
                            <AccordionPanel>{item.description}</AccordionPanel>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </section>
    )
}

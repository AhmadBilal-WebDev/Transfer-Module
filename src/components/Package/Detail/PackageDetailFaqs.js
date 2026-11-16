'use client'
import React from 'react'
import { Accordion } from '@mantine/core'
import { FaChevronDown } from 'react-icons/fa'
import styles from './PackageDetailFaqs.module.css'

export default function PackageDetailFaqs({ faqsList }) {
  if (!faqsList?.length) return null

  return (
    <section className={styles.faqsSection}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Frequently Asked</p>
        <h2 className={styles.title}>Questions from travelers</h2>
      </div>

      <div className={styles.accordionWrap}>
        <Accordion
          variant="contained"
          radius={0}
          defaultValue="question1"
          chevron={<FaChevronDown size={12} />}
          classNames={{
            root: styles.accordionRoot,
            item: styles.item,
            control: styles.control,
            label: styles.label,
            chevron: styles.chevron,
            panel: styles.panel,
            content: styles.content,
          }}
        >
          {faqsList.map((faq, index) => (
            <Accordion.Item key={faq?.id || index} value={`question${index + 1}`}>
              <Accordion.Control>{faq.title}</Accordion.Control>
              <Accordion.Panel>
                {/<[a-z][\s\S]*>/i.test(String(faq.description || '')) ? (
                  <div dangerouslySetInnerHTML={{ __html: faq.description }} />
                ) : (
                  faq.description
                )}
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

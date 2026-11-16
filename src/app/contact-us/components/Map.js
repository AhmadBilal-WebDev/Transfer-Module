import styles from "../ContactUs.module.css";

export default function Map({ className = '' }) {
  return (
    <div className={`${styles.map} ${className}`.trim()}>
      <iframe
        title="Royalane office location"
        src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=en&amp;q=693a%20Stratford%20Road%20Birmingham%20B11%204DX,%20UK+(Royalane%20Travel)&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
        frameBorder="0"
        allowFullScreen=""
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      ></iframe>
    </div>
  );
}
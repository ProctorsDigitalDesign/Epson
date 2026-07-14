"use client";
import styles from "./Header.module.css";

export default function Header({ step }) {
  return (
    <header className={`${styles.header} ${step === 1 ? styles.headerDark : ''}`}>
      <div className={step === 1 ? styles.containerHero : "container"}>
        <div className={styles.inner}>
          <div className={styles.logo}>
            <img
              src="/Epson%20Logo.png"
              alt="Epson"
              style={{ height: 36, width: "auto", filter: step === 1 ? "brightness(0) invert(1)" : "none" }}
            />
          </div>


        </div>
      </div>
    </header>
  );
}

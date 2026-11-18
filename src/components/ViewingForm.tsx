import React, { useState } from "react";

interface ViewingFormProps {
  onBackToTop?: () => void;
  extraFooterClearance?: boolean;
}

export function ViewingForm({
  onBackToTop,
  extraFooterClearance = false,
}: ViewingFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedPhone) {
      setNote("Add your name and phone number so an advisor can call you.");
      return;
    }

    if (trimmedPhone.replace(/[^0-9+]/g, "").length < 6) {
      setNote("Enter a valid phone number so an advisor can reach you.");
      return;
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setNote("Enter a valid email address or leave it blank.");
      return;
    }

    setNote(
      `Enquiry received for ${trimmedName}. A private advisor will call ${trimmedPhone} to confirm your viewing.`
    );
    setName("");
    setPhone("");
    setEmail("");
  };

  return (
    <div className="viewings-band">
      <div className="viewings" id="viewings-enquiry">
        <div>
          <h2 className="display">
            Book a
            <br />
            viewing
          </h2>
          <p className="copy line">
            Daily, by appointment. Leave your details and an advisor will call
            to arrange a time.
          </p>
          <dl className="copy">
            <div>
              <dt>Phone</dt>
              <dd>+41 44 580 24 00</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>viewings@altura-residence.com</dd>
            </div>
          </dl>
        </div>

        <form className="enquiry-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="f-name">
            Full name
            <input
              id="f-name"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label htmlFor="f-phone">
            Phone
            <input
              id="f-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label htmlFor="f-email">
            Email
            <input
              id="f-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <button className="cta-btn" type="submit">
            Request a viewing
          </button>
          <p className="copy note" role="status" aria-live="polite">
            {note}
          </p>
        </form>
      </div>

      <footer
        className={`site-footer nav-text${
          extraFooterClearance ? " !pb-20 sm:!pb-24" : ""
        }`}
      >
        <p>© Altura. Private Residence.</p>
        <a
          href="#top"
          onClick={(e) => {
            if (onBackToTop) {
              e.preventDefault();
              onBackToTop();
            }
          }}
        >
          Back to top
        </a>
      </footer>
    </div>
  );
}

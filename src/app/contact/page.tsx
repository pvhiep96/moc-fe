"use client";

import Link from "next/link";
import { useState } from "react";
import MenuOverlay from "@/components/MenuOverlay";
import DynamicMenuButton from "@/components/DynamicMenuButton";
import DynamicLogo from "@/components/DynamicLogo";
import { projectsApi } from "@/services/api";
import { getErrorMessage } from "@/utils/errorHandler";
import { MultilineText, useSiteContent } from "@/content/SiteContentProvider";

export default function ContactPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t, lines, e } = useSiteContent();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    whereDoYouLive: "",
    eventType: "",
    whatIsYourRole: "",
    date: "",
    eventLocation: "",
    budget: "",
    bridesInstagramName: "",
    howDidYouHearAboutUs: "",
    message: "",
    consent: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // e.preventDefault();
    // Implement form submission logic here
    if (!formData.consent) {
      setSubmitError(
        "You must consent to the privacy policy before submitting."
      );
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      // Map frontend state to backend API fields.
      // Using snake_case as it's a common convention for APIs.
      const payload = {
        full_name: formData.fullName,
        email: formData.email,
        location: formData.whereDoYouLive,
        event_type: formData.eventType,
        role: formData.whatIsYourRole,
        event_date: formData.date,
        event_location: formData.eventLocation,
        budget: formData.budget,
        instagram: formData.bridesInstagramName,
        source: formData.howDidYouHearAboutUs,
        message: formData.message,
      };

      // await apiClient.post('/inquiries', payload);
      const data = await projectsApi.createInquiries(payload);
      setSubmitSuccess(true);
      // Reset form on success
      setFormData({
        fullName: "",
        email: "",
        whereDoYouLive: "",
        eventType: "",
        whatIsYourRole: "",
        date: "",
        eventLocation: "",
        budget: "",
        bridesInstagramName: "",
        howDidYouHearAboutUs: "",
        message: "",
        consent: false,
      });
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      {/* Menu Overlay */}
      <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Dynamic Menu Button with color changing based on background */}
      <DynamicMenuButton menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {/* Dynamic Logo at top left corner */}
      <DynamicLogo width={120} height={40} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 md:px-0">
        {/* Title & Description */}
        <div className="w-full max-w-6xl flex flex-row justify-between items-start mt-12 mb-2">
          <h1 className="text-[3rem] md:text-[5rem] font-extrabold leading-none tracking-tight" {...e("contact_title")}>
            <MultilineText text={t("contact_title")} />
          </h1>
          <div className="text-xs text-right max-w-xs mt-4 md:mt-8 ml-4" {...e("contact_intro")}>
            <MultilineText text={t("contact_intro")} />
          </div>
        </div>
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-6xl bg-[#f5f5f5] p-8 rounded-md mb-10 mt-8"
        >
          {!submitSuccess && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6">
                <div className="flex flex-col mb-2">
                  <label htmlFor="email" className="uppercase text-xs font-bold text-gray-500 mb-1">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    placeholder="FULL NAME"
                    className="bg-transparent border-0 border-b border-gray-300 py-3 px-2 text-base font-semibold uppercase placeholder-gray-400 focus:outline-none"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex flex-col mb-2">
                  <label
                    htmlFor="email"
                    className="text-xs font-bold text-gray-500 uppercase mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="EMAIL"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="bg-transparent border-0 border-b border-gray-300 py-3 px-2 text-base font-semibold uppercase placeholder:text-gray-400 focus:outline-none focus:border-gray-600 transition-colors"
                    aria-label="Email address"
                  />
                </div>
                <div className="flex flex-col mb-2">
                  <label className="uppercase text-xs font-bold text-gray-500 mb-1">
                    Where do you live?
                  </label>
                  <input
                    type="text"
                    name="whereDoYouLive"
                    placeholder="WHERE DO YOU LIVE?"
                    className="bg-transparent border-0 border-b border-gray-300 py-3 px-2 text-base font-semibold uppercase placeholder-gray-400 focus:outline-none"
                    value={formData.whereDoYouLive}
                    onChange={handleChange}
                  />
                </div>
                <div className="flex flex-col mb-2">
                  <label className="uppercase text-xs font-bold text-gray-500 mb-1">
                    Event Type
                  </label>
                  <select
                  {...e("contact_event_types")}
                    name="eventType"
                    className="bg-transparent border-0 border-b border-gray-300 py-3 px-2 text-base font-semibold uppercase focus:outline-none"
                    value={formData.eventType}
                    onChange={handleChange}
                    required
                  >
                    <option>EVENT TYPE</option>
                    {lines("contact_event_types").map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col mb-2">
                  <label className="uppercase text-xs font-bold text-gray-500 mb-1">
                    What is your role?
                  </label>
                  <select
                  {...e("contact_roles")}
                    name="whatIsYourRole"
                    className="bg-transparent border-0 border-b border-gray-300 py-3 px-2 text-base font-semibold uppercase focus:outline-none"
                    value={formData.whatIsYourRole}
                    onChange={handleChange}
                    required
                  >
                    <option>WHAT IS YOUR ROLE?</option>
                    {lines("contact_roles").map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col mb-2">
                  <label className="uppercase text-xs font-bold text-gray-500 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    placeholder="DD/MM/YYYY"
                    className="bg-transparent border-0 border-b border-gray-300 py-3 px-2 text-base font-semibold uppercase placeholder-gray-400 focus:outline-none"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex flex-col mb-2">
                  <label className="uppercase text-xs font-bold text-gray-500 mb-1">
                    Event Location
                  </label>
                  <input
                    type="text"
                    name="eventLocation"
                    placeholder="EVENT LOCATION"
                    className="bg-transparent border-0 border-b border-gray-300 py-3 px-2 text-base font-semibold uppercase placeholder-gray-400 focus:outline-none"
                    value={formData.eventLocation}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex flex-col mb-2">
                  <label className="uppercase text-xs font-bold text-gray-500 mb-1">
                    Budget
                  </label>
                  <select
                  {...e("contact_budgets")}
                    name="budget"
                    className="bg-transparent border-0 border-b border-gray-300 py-3 px-2 text-base font-semibold uppercase focus:outline-none"
                    value={formData.budget}
                    onChange={handleChange}
                    required
                  >
                    <option>BUDGET</option>
                    {lines("contact_budgets").map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col mb-2">
                  <label className="uppercase text-xs font-bold text-gray-500 mb-1">
                    How did you hear about us?
                  </label>
                  <select
                  {...e("contact_sources")}
                    name="howDidYouHearAboutUs"
                    className="bg-transparent border-0 border-b border-gray-300 py-3 px-2 text-base font-semibold uppercase focus:outline-none"
                    value={formData.howDidYouHearAboutUs}
                    onChange={handleChange}
                    required
                  >
                    <option>HOW DID YOU HEAR ABOUT US?</option>
                    {lines("contact_sources").map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col mb-2">
                  <label className="uppercase text-xs font-bold text-gray-500 mb-1">
                    Bride's Instagram Name
                  </label>
                  <input
                    type="text"
                    name="bridesInstagramName"
                    placeholder="BRIDE'S INSTAGRAM NAME"
                    className="bg-transparent border-0 border-b border-gray-300 py-3 px-2 text-base font-semibold uppercase placeholder-gray-400 focus:outline-none"
                    value={formData.bridesInstagramName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col mb-2 mt-2">
                <label className="uppercase text-xs font-bold text-gray-500 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  placeholder="MESSAGE"
                  rows={2}
                  className="bg-transparent border-0 border-b border-gray-300 py-3 px-2 text-base font-semibold uppercase placeholder-gray-400 focus:outline-none resize-none"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="consent"
                  name="consent"
                  className="mr-2"
                  checked={formData.consent}
                  onChange={handleCheckboxChange}
                  required
                />
                <label htmlFor="consent" className="text-xs text-gray-500" {...e("contact_consent")}>
                  {t("contact_consent")}
                </label>
              </div>
            </>
          )}
          {submitSuccess && (
            <div className="mt-4 text-green-700 bg-green-100 p-3 rounded-md text-sm" {...e("contact_success")}>
              {t("contact_success")}
            </div>
          )}
          {submitError && (
            <div className="mt-4 text-red-700 bg-red-100 p-3 rounded-md text-sm">
              {submitError}
            </div>
          )}

          {!submitSuccess && (
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="flex items-center gap-2 text-xl font-bold group"
                disabled={submitting}
              >
                <span {...e("contact_send_label")}>{submitting ? "SENDING..." : t("contact_send_label")}</span>
                {!submitting && (
                  <span className="ml-2 text-3xl group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                )}
              </button>
            </div>
          )}
        </form>
      </main>
      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-end text-xs font-semibold mb-2">
          <div>
            <a
              href={`mailto:${t("contact_email")}`}
              className="hover:underline"
              {...e("contact_email")}
            >
              {t("contact_email")}
            </a>
            <br />
            <span {...e("contact_phone")}>{t("contact_phone")}</span>
            <br />
            <span {...e("contact_messengers")}>{t("contact_messengers")}</span>
          </div>
          {/* <div className="flex gap-4 mt-2 md:mt-0">
            <a href="#" className="hover:underline">MENU</a>
            <a href="#" className="hover:opacity-70">IG</a>
            <a href="#" className="hover:opacity-70">PI</a>
            <a href="#" className="hover:opacity-70">FB</a>
          </div> */}
          <div className="text-right mt-2 md:mt-0" {...e("contact_copyright")}>
            <MultilineText text={t("contact_copyright")} />
          </div>
        </div>
        <div className="text-[55px] md:text-[80px] font-extrabold tracking-tighter leading-none text-black/90 text-left mt-4" {...e("contact_big_word")}>
          {t("contact_big_word")}
        </div>
      </footer>
    </div>
  );
}

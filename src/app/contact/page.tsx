'use client';

import Link from 'next/link';
import { useState } from 'react';
import MenuOverlay from '@/components/MenuOverlay';
import DynamicMenuButton from '@/components/DynamicMenuButton';
import DynamicLogo from '@/components/DynamicLogo';

export default function ContactPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    whereDoYouLive: '',
    eventType: '',
    whatIsYourRole: '',
    date: '',
    eventLocation: '',
    budget: '',
    bridesInstagramName: '',
    howDidYouHearAboutUs: '',
    message: '',
    consent: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Implement form submission logic here
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
          <h1 className="text-[3rem] md:text-[5rem] font-extrabold leading-none tracking-tight">
            CONNECT<br />WITH US
          </h1>
          <div className="text-xs text-right max-w-xs mt-4 md:mt-8 ml-4">
            TO REACH MOC PRODUCTIONS STUDIO OR TO REQUEST A DETAILED COLLECTION OF OUR WEDDING PHOTOGRAPHY SERVICES, PLEASE FEEL FREE TO FILL OUT YOUR INFORMATION AND WE WILL CONTACT YOU WITHIN 24 HOURS.
          </div>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full max-w-6xl bg-[#f5f5f5] p-8 rounded-md mb-10 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6">
            <div className="flex flex-col mb-2">
              <label className="uppercase text-xs font-bold text-gray-500 mb-1">Full Name</label>
              <input
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
              <label className="uppercase text-xs font-bold text-gray-500 mb-1">Email</label>
              <input
                type="email"
                name="email"
                placeholder="EMAIL"
                className="bg-transparent border-0 border-b border-gray-300 py-3 px-2 text-base font-semibold uppercase placeholder-gray-400 focus:outline-none"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col mb-2">
              <label className="uppercase text-xs font-bold text-gray-500 mb-1">Where do you live?</label>
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
              <label className="uppercase text-xs font-bold text-gray-500 mb-1">Event Type</label>
              <select
                name="eventType"
                className="bg-transparent border-0 border-b border-gray-300 py-3 px-2 text-base font-semibold uppercase focus:outline-none"
                value={formData.eventType}
                onChange={handleChange}
                required
              >
                <option>EVENT TYPE</option>
                <option>Wedding</option>
                <option>Engagement</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex flex-col mb-2">
              <label className="uppercase text-xs font-bold text-gray-500 mb-1">What is your role?</label>
              <select
                name="whatIsYourRole"
                className="bg-transparent border-0 border-b border-gray-300 py-3 px-2 text-base font-semibold uppercase focus:outline-none"
                value={formData.whatIsYourRole}
                onChange={handleChange}
                required
              >
                <option>WHAT IS YOUR ROLE?</option>
                <option>Bride</option>
                <option>Groom</option>
                <option>Planner</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex flex-col mb-2">
              <label className="uppercase text-xs font-bold text-gray-500 mb-1">Date</label>
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
              <label className="uppercase text-xs font-bold text-gray-500 mb-1">Event Location</label>
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
              <label className="uppercase text-xs font-bold text-gray-500 mb-1">Budget</label>
              <select
                name="budget"
                className="bg-transparent border-0 border-b border-gray-300 py-3 px-2 text-base font-semibold uppercase focus:outline-none"
                value={formData.budget}
                onChange={handleChange}
                required
              >
                <option>BUDGET</option>
                <option>Under $10,000</option>
                <option>$10,000 - $30,000</option>
                <option>$30,000 - $50,000</option>
                <option>Over $50,000</option>
              </select>
            </div>
            <div className="flex flex-col mb-2">
              <label className="uppercase text-xs font-bold text-gray-500 mb-1">How did you hear about us?</label>
              <select
                name="howDidYouHearAboutUs"
                className="bg-transparent border-0 border-b border-gray-300 py-3 px-2 text-base font-semibold uppercase focus:outline-none"
                value={formData.howDidYouHearAboutUs}
                onChange={handleChange}
                required
              >
                <option>HOW DID YOU HEAR ABOUT US?</option>
                <option>Instagram</option>
                <option>Google</option>
                <option>Friend</option>
                <option>Other</option>
              </select>
            </div>
            <div className="flex flex-col mb-2">
              <label className="uppercase text-xs font-bold text-gray-500 mb-1">Bride's Instagram Name</label>
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
            <label className="uppercase text-xs font-bold text-gray-500 mb-1">Message</label>
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
            <label htmlFor="consent" className="text-xs text-gray-500">
              I CONSENT FOR THE INFORMATION SUBMITTED ABOVE TO BE RECORDED AND STORED FOR THE PURPOSES OF PROVIDING SERVICES RELATING TO MY INQUIRY. I AGREE THAT REGISTRATION ON OUR SITE OR THE MOC PRODUCTIONS SITE CONSTITUTES AGREEMENT TO ITS USER AGREEMENT & PRIVACY POLICY
            </label>
          </div>
          <div className="flex justify-end mt-4">
            <button type="submit" className="flex items-center gap-2 text-xl font-bold group">
              SEND
              <span className="ml-2 text-3xl group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </form>
      </main>
      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-end text-xs font-semibold mb-2">
          <div>
            <a href="mailto:mocnguyen.productions@gmail.com" className="hover:underline">mocnguyen.productions@gmail.com</a><br />
            +41 (0) 764 530 053
          </div>
          {/* <div className="flex gap-4 mt-2 md:mt-0">
            <a href="#" className="hover:underline">MENU</a>
            <a href="#" className="hover:opacity-70">IG</a>
            <a href="#" className="hover:opacity-70">PI</a>
            <a href="#" className="hover:opacity-70">FB</a>
          </div> */}
          <div className="text-right mt-2 md:mt-0">
            WEBSITE BY<br />
            <span className="font-bold">THE FIRST THE LAST</span>
          </div>
          <div className="text-right mt-2 md:mt-0">
            ©2025 moc-production<br />- ALL RIGHTS RESERVED
          </div>
        </div>
        <div className="text-[55px] md:text-[80px] font-extrabold tracking-tighter leading-none text-black/90 text-left mt-4">
          MOC PRODUCTIONS
        </div>
      </footer>
    </div>
  );
}

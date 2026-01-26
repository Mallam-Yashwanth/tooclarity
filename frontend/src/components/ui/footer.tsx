"use client"; 

import React from "react";
import Image from "next/image";
import Link from "next/link";


const Footer = () => {
  return (
    <footer className="bg-blue-800 text-white py-12 px-4 sm:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-6xl mx-auto mb-8">
        <div>
          <h4 className="font-bold mb-4">For Institutions</h4>
          <ul className="space-y-2">
            <li>How it Works</li>
            <li><Link href="/features"> Features </Link> </li>
            <li>Pricing</li>
            <li>Success Stories</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Company</h4>
          <ul className="space-y-2">
            <li>About Us</li>
            <li><Link href="/PrivacyPolicy">Privacy Policy</Link></li>
            <li><Link href="/TermsConditions">Terms and Conditions</Link></li>
            <li><Link href="/">Student</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Support</h4>
          <ul className="space-y-2">
            <li>Blog</li>
            <li>Help Center</li>
            <li><Link href="/contactUs">Schedule a Demo</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4">Contact</h4>
          <p className="text-sm">Email: tooclarity0@gmail.com</p>
          <p className="text-sm">Phone: +91 9391160205</p>
          <p className="text-sm">Tarnaka, Secunderabad, 500007</p>
        </div>
      </div>

      <section className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center py-8 px-4 overflow-hidden relative opacity-100">
  {/* Logo (OO) */}
  <div className="flex justify-center items-center mb-2">
  <Image
    src="/OO.png"
    alt="Too Clarity Logo"
    width={200}
    height={200}
    className="
      w-[58px] h-[58px]                /* Mobile */
      sm:w-[120px] sm:h-[120px]       /* Small screens */
      md:w-[186px] md:h-[186px]       /* Medium screens */
      lg:w-[200.6px] lg:h-[200.6px]       /* Large screens */
            /* Extra large screens */
      opacity-100
    "
  />
</div>
</section>

 {/* Title: TOO CLARITY */}
<div className="flex justify-center items-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
  <h1
    className="
      font-kanit font-semibold text-center leading-[100%] tracking-[0px] text-[48px] sm:text-[96px] md:text-[95px] lg:text-[180px] xl:text-[234.66px] max-w-[90vw] whitespace-nowrap opacity-100"
  >
    TOO CLARITY
  </h1>
</div>

 

  {/* Social Icons and Copyright */}
  <footer className="w-full max-w-md mx-auto flex flex-col items-center justify-center mt-8 opacity-100">
    <div className="flex items-center justify-center flex-wrap gap-4 sm:gap-6 mb-4">
      <a href="https://x.com/tooclarity" target="_blank" rel="noopener noreferrer">
        <Image src="/x.png" alt="X" width={40} height={40} className="h-8 sm:h-10 object-contain" />
      </a>
      <a href="https://www.instagram.com/tooclarity/#" target="_blank" rel="noopener noreferrer">
        <Image src="/instagram_02.png" alt="Instagram" width={40} height={40} className="h-8 sm:h-10 object-contain" />
      </a>
      <a href="https://www.linkedin.com/company/tooclarity/" target="_blank" rel="noopener noreferrer">
        <Image src="/linked.png" alt="LinkedIn" width={40} height={40} className="h-8 sm:h-10 object-contain" />
      </a>
      <a href="https://www.youtube.com/@tooclarity" target="_blank" rel="noopener noreferrer">
        <Image src="/yt.png" alt="YouTube" width={40} height={40} className="h-8 sm:h-10 object-contain" />
      </a>
    </div>
    <div className="text-center text-xs sm:text-sm text-white/60">
      Copyright © 2025 Too Clarity. All rights reserved.
    </div>
  </footer>


    </footer>
  );
};

export default Footer;